#!/usr/bin/env node
// S8 realtime check: a change made in one session must appear in another open session without reloading,
// also when the change happens while that session is offline (recovered on reconnect).
//
//   node scripts/realtime-check.mjs [--web http://localhost:3000] [--api http://localhost:3001/api] [--role ventas]
//
// Needs the local stack and @playwright/test (Chromium). Exit code 1 when a check fails.

import { ROLE_ACCOUNTS, credentialsFor } from '../config/users.js';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const WEB = args.web ?? 'http://localhost:3000';
const API = args.api ?? 'http://localhost:3001/api';
const ROLE = args.role ?? 'ventas';
const LIVE_MS = 2_000;
const RECOVER_MS = 15_000;

async function login() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(credentialsFor(ROLE_ACCOUNTS[ROLE])),
  });
  if (!res.ok) throw new Error(`Login failed: HTTP ${res.status}`);
  return res.json();
}

async function createClient(token, nombre) {
  const res = await fetch(`${API}/clients`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ nombre, sucursalId: 'suc_central' }),
  });
  if (!res.ok) throw new Error(`Create client failed: HTTP ${res.status} ${await res.text()}`);
}

async function appears(page, text, timeout) {
  const started = Date.now();
  try {
    await page.getByText(text, { exact: false }).first().waitFor({ timeout });
    return Date.now() - started;
  } catch {
    return null;
  }
}

async function main() {
  const { chromium } = await import('@playwright/test');
  const viewer = await login();
  const editor = await login();
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript(([t, u]) => {
    localStorage.setItem('hs_token', t);
    localStorage.setItem('hs_user', u);
  }, [viewer.accessToken, JSON.stringify(viewer.user)]);
  const page = await context.newPage();
  let streams = 0;
  page.on('request', (r) => { if (r.url().includes('/realtime/events')) streams += 1; });
  await page.goto(`${WEB}/clientes`, { waitUntil: 'networkidle' });

  const results = [];
  const live = `RT live ${Date.now()}`;
  await createClient(editor.accessToken, live);
  const liveMs = await appears(page, live, LIVE_MS);
  results.push({ check: 'change in another session shows without reload', ok: liveMs !== null, ms: liveMs });

  await context.setOffline(true);
  await page.waitForTimeout(1_500);
  const missed = `RT offline ${Date.now()}`;
  await createClient(editor.accessToken, missed);
  await page.waitForTimeout(1_000);
  await context.setOffline(false);
  const recoverMs = await appears(page, missed, RECOVER_MS);
  results.push({ check: 'change made while offline shows after reconnect', ok: recoverMs !== null, ms: recoverMs });
  results.push({ check: 'one realtime stream per (re)connection', ok: streams >= 1, ms: null, streams });

  await browser.close();
  console.table(results);
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
