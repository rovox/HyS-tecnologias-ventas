#!/usr/bin/env node
// Browser smoke for an ended session (LAUNCH P0-2), once per role: log in, open the dashboard, close the session from
// outside (POST auth/logout with the same token, as an expiry or a logout on another device would) and move to another
// screen → the app lands on /login with "Tu sesión venció", the stored session is gone and the page is never blank.
// Also a session kept only in sessionStorage ("Recordarme" off) still counts as logged in after a reload.
//
//   node scripts/smoke-session.mjs [--web http://localhost:3000] [--api http://localhost:3001/api]
//
// Exit code 1 when a step fails.

import { ROLE_ACCOUNTS, credentialsFor } from '../config/users.js';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const WEB = args.web ?? 'http://localhost:3000';
const API = args.api ?? 'http://localhost:3001/api';
const T = { timeout: 10000 };

const { chromium } = await import('@playwright/test');
const browser = await chromium.launch();
const steps = [];
let failed = false;
const step = async (name, fn) => {
  try {
    await fn();
    steps.push(`ok   ${name}`);
  } catch (err) {
    failed = true;
    steps.push(`FAIL ${name}: ${String(err.message).split('\n')[0]}`);
  }
};

async function login(email) {
  const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(credentialsFor(email)) });
  if (!res.ok) throw new Error(`login ${email}: ${res.status}`);
  return res.json();
}

for (const [role, email] of Object.entries(ROLE_ACCOUNTS)) {
  const { accessToken, user } = await login(email);
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  // Stored once (not with addInitScript, which would put it back on the redirect).
  await page.goto(`${WEB}/login`);
  await page.evaluate(([t, u]) => { localStorage.setItem('hs_token', t); localStorage.setItem('hs_user', u); }, [accessToken, JSON.stringify(user)]);

  await step(`${role}: dashboard opens with the session`, async () => {
    await page.goto(`${WEB}/dashboard`);
    await page.waitForURL(/\/dashboard/, T);
    await page.locator('nav, aside').first().waitFor(T);
  });
  await step(`${role}: session closed elsewhere → /login with notice, storage cleared, not blank`, async () => {
    const out = await fetch(`${API}/auth/logout`, { method: 'POST', headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' }, body: '{}' });
    if (!out.ok) throw new Error(`logout ${out.status}`);
    await page.goto(`${WEB}/clientes`);
    await page.waitForURL(/\/login\?expirada=1/, T);
    await page.getByText('Tu sesión venció').first().waitFor(T);
    await page.locator('input[type="email"], input#email').first().waitFor(T);
    const stored = await page.evaluate(() => localStorage.getItem('hs_token') || sessionStorage.getItem('hs_token'));
    if (stored) throw new Error('token still stored');
    if (pageErrors.length) throw new Error(`page errors: ${pageErrors.join(' | ')}`);
  });
  await context.close();
}

await step('Recordarme off: a session in sessionStorage survives a reload', async () => {
  const { accessToken, user } = await login(ROLE_ACCOUNTS.ventas);
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${WEB}/login`);
  await page.evaluate(([t, u]) => { sessionStorage.setItem('hs_token', t); sessionStorage.setItem('hs_user', u); }, [accessToken, JSON.stringify(user)]);
  await page.goto(`${WEB}/dashboard`);
  await page.reload();
  await page.waitForURL(/\/dashboard/, T);
  await page.locator('nav, aside').first().waitFor(T);
  await context.close();
});

await browser.close();
console.log(steps.join('\n'));
process.exit(failed ? 1 : 0);
