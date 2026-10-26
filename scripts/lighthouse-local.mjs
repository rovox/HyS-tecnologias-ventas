#!/usr/bin/env node
// LOCAL-03: Lighthouse (performance) on the local stack — home, list, form-like page — median of N runs.
//   node scripts/lighthouse-local.mjs [--web http://localhost:3000] [--api http://localhost:3001/api]
//                                     [--runs 3] [--json out.json]
// Needs: the stack up, Chromium installed for Playwright (`pnpm exec playwright install chromium`).
// Lighthouse is fetched on demand with `pnpm dlx` (not a repo dependency). Auth: a Playwright-launched
// Chromium keeps the admin session in localStorage and Lighthouse attaches to it over the debugging port
// (`--disable-storage-reset`). There is no routable "form" page (forms are modals), so /configuration
// stands in as the form-like page; revisit when the CRUD toolkit adds form routes.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ROLE_ACCOUNTS, credentialsFor } from '../config/users.js';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const WEB = arg('web', 'http://localhost:3000');
const API = arg('api', 'http://localhost:3001/api');
const RUNS = Number(arg('runs', 3));
const PORT = 9333;
const PAGES = [
  { name: 'home', path: '/dashboard' },
  { name: 'list', path: '/quotations' },
  { name: 'form-like', path: '/configuration' },
];

let chromium;
try { ({ chromium } = await import('@playwright/test')); } catch {
  console.error('@playwright/test is not installed.');
  process.exit(2);
}

const login = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(credentialsFor(ROLE_ACCOUNTS.admin)),
});
if (!login.ok) { console.error(`Login failed: HTTP ${login.status}`); process.exit(2); }
const { accessToken, user } = await login.json();

const userDir = mkdtempSync(path.join(tmpdir(), 'hs-lh-profile-'));
const context = await chromium.launchPersistentContext(userDir, { headless: true, args: [`--remote-debugging-port=${PORT}`] });
await context.addInitScript(([t, u]) => { localStorage.setItem('hs_token', t); localStorage.setItem('hs_user', u); }, [accessToken, JSON.stringify(user)]);
const page = await context.newPage();
await page.goto(WEB + '/dashboard');

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const out = mkdtempSync(path.join(tmpdir(), 'hs-lh-'));
const rows = [];
for (const p of PAGES) {
  const runs = [];
  for (let i = 0; i < RUNS; i++) {
    const file = path.join(out, `${p.name}-${i}.json`);
    execFileSync('pnpm', ['dlx', 'lighthouse', WEB + p.path, '--quiet', '--output=json', `--output-path=${file}`,
      `--port=${PORT}`, '--disable-storage-reset', '--only-categories=performance'], { stdio: 'inherit' });
    const lhr = JSON.parse(readFileSync(file, 'utf8'));
    runs.push({ perf: Math.round(lhr.categories.performance.score * 100), lcp: lhr.audits['largest-contentful-paint'].numericValue, tbt: lhr.audits['total-blocking-time'].numericValue });
  }
  rows.push({ page: p.name, path: p.path, performance: median(runs.map((r) => r.perf)), lcpMs: Math.round(median(runs.map((r) => r.lcp))), tbtMs: Math.round(median(runs.map((r) => r.tbt))) });
}
await context.close();

for (const r of rows) console.log(`${r.page} ${r.path}: perf ${r.performance}, LCP ${r.lcpMs} ms, TBT ${r.tbtMs} ms`);
const json = arg('json');
if (json) writeFileSync(json, JSON.stringify(rows, null, 2));
