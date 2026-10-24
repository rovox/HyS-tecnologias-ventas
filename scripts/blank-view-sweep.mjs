#!/usr/bin/env node
// RC-01 blank-view sweep: visits every route as every role and classifies the result.
//
//   node scripts/blank-view-sweep.mjs [--web http://localhost:3000] [--api http://localhost:3001/api]
//                                     [--roles admin,ventas,tecnico] [--json out.json] [--timeout 8000]
//
// Needs the local stack running (`pnpm dev` or the compose stack) and `@playwright/test` installed (LOCAL-02).
// Classification: pass | blank | error-boundary | spinner | redirect (unexpected) | redirect-ok | forbidden-ok (expected redirect)
// Exit code 1 when any cell is blank, error-boundary, spinner or an unexpected redirect.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROLE_ACCOUNTS, credentialsFor } from '../config/users.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const WEB = args.web ?? process.env.SWEEP_WEB ?? 'http://localhost:3000';
const API = args.api ?? process.env.SWEEP_API ?? 'http://localhost:3001/api';
const TIMEOUT = Number(args.timeout ?? 8000);

// One account per role from the shared roster (config/users.json), local stack only.
const ROLES = Object.fromEntries(Object.entries(ROLE_ACCOUNTS).map(([role, email]) => [role, credentialsFor(email)]));
const roleNames = (args.roles ?? 'admin,ventas,tecnico').split(',');

// Mirrors routeRoles in apps/web/src/config/nav.js (A = admin, V = ventas, T = técnico).
// Replaced by generated constants in FE-03; `checkRouteTable` fails if App.jsx and this table drift.
const ALL = 'AVT', AV = 'AV', A = 'A';
const ROUTES = [
  ['/dashboard', ALL], ['/quotations', AV], ['/quotations/:quotationId', AV], ['/projects', AV], ['/projects/:projectId', AV], ['/clientes', ALL], ['/clientes/:clientId', ALL],
  ['/surveys', ALL], ['/schedule', ALL], ['/activity-wall', ALL], ['/reports', A],
  ['/admin/management', A], ['/configuration', A], ['/solicitudes-web', AV],
  ['/pedidos-internos', AV], ['/pedidos-internos/:pedidoId', AV],
  ['/vehicle-control', A], ['/vehicle-control/:id', A], ['/vehicles', A], ['/vehicles/:id', A],
  ['/maintenance', A], ['/marketing', A], ['/campaigns', A], ['/finanzas', ALL], ['/inventario', ALL], ['/usuarios/:userId', ALL],
];
const ROLE_LETTER = { admin: 'A', ventas: 'V', tecnico: 'T' };
// Routes that intentionally redirect (ActivityWallPage is `<Navigate to="/dashboard">`); classified `redirect-ok`, not failing.
const EXPECTED_REDIRECT = new Set(['/activity-wall']);

function checkRouteTable() {
  const app = readFileSync(path.join(ROOT, 'apps/web/src/app/App.jsx'), 'utf8');
  // Only guarded routes are swept; redirects and /login need no role, /sin-acceso is for SIN ACCESO users.
  const declared = [...app.matchAll(/<Route path="([^"]+)" element=\{\s*<ProtectedRoute/g)].map((m) => m[1]).filter((p) => p !== '/sin-acceso');
  const known = new Set(ROUTES.map(([p]) => p.replace(/:[A-Za-z]+/, ':id')));
  const missing = declared.filter((p) => p !== '*' && !known.has(p.replace(/:[A-Za-z]+/, ':id')));
  if (missing.length) throw new Error(`Routes in App.jsx missing from the sweep table: ${missing.join(', ')}`);
}

async function login(role) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(ROLES[role]),
  });
  if (!res.ok) throw new Error(`Login failed for ${role}: HTTP ${res.status}`);
  const data = await res.json();
  return { token: data.accessToken, user: data.user };
}

async function firstId(token, endpoint) {
  const res = await fetch(`${API}/${endpoint}`, { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : rows.items)?.[0]?.id ?? null;
}

async function classify(page, url, allowed) {
  const problems = [];
  page.on('response', (r) => { if (r.url().startsWith(API) && r.status() >= 400) problems.push(`${r.status()} ${r.request().method()} ${r.url().replace(API, '')}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.split('\n')[0]}`));
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(Math.min(TIMEOUT, 1500));
  const deadline = Date.now() + TIMEOUT;
  let state;
  do {
    state = await page.evaluate(() => {
      const root = document.querySelector('#root');
      const text = (root?.innerText ?? '').trim();
      return {
        path: location.pathname,
        overlay: Boolean(document.querySelector('vite-error-overlay')),
        text: text.length,
        boundary: /something went wrong|algo sali[oó] mal|application error|error inesperado/i.test(text),
        spinner: Boolean(document.querySelector('.animate-spin, [class*="animate-pulse"]')),
      };
    });
    if (!state.spinner) break;
    await page.waitForTimeout(300);
  } while (Date.now() < deadline);
  const wanted = new URL(url).pathname;
  let result = 'pass';
  if (state.overlay || state.boundary) result = 'error-boundary';
  else if (state.text < 20) result = 'blank';
  else if (state.spinner) result = 'spinner';
  else if (state.path !== wanted) result = !allowed ? 'forbidden-ok' : EXPECTED_REDIRECT.has(wanted) ? 'redirect-ok' : 'redirect';
  return { result, finalPath: state.path, problems: [...new Set(problems)] };
}

async function main() {
  checkRouteTable();
  let chromium;
  try { ({ chromium } = await import('@playwright/test')); } catch {
    console.error('@playwright/test is not installed (LOCAL-02) or Chromium is missing: pnpm exec playwright install chromium');
    process.exit(2);
  }
  const browser = await chromium.launch();
  const rows = [];
  for (const role of roleNames) {
    const { token, user } = await login(role);
    const ids = { clientId: await firstId(token, 'clients'), quotationId: await firstId(token, 'quotations'), projectId: await firstId(token, 'projects'), pedidoId: await firstId(token, 'pedidos-internos'), userId: user?.id, id: 'sweep' };
    const context = await browser.newContext();
    await context.addInitScript(([t, u]) => { localStorage.setItem('hs_token', t); localStorage.setItem('hs_user', u); }, [token, JSON.stringify(user)]);
    for (const [pattern, roles] of ROUTES) {
      const param = pattern.match(/:([A-Za-z]+)/)?.[1];
      const url = WEB + pattern.replace(/:[A-Za-z]+/, ids[param] ?? '');
      if (param && !ids[param]) { rows.push({ role, route: pattern, result: 'skipped', problems: [`no ${param} in seed`] }); continue; }
      const page = await context.newPage();
      const allowed = roles.includes(ROLE_LETTER[role]);
      rows.push({ role, route: pattern, allowed, ...(await classify(page, url, allowed)) });
      await page.close();
    }
    await context.close();
  }
  await browser.close();

  const bad = rows.filter((r) => ['blank', 'error-boundary', 'spinner', 'redirect'].includes(r.result));
  console.log('role | route | result | final path | api/page problems');
  for (const r of rows) console.log(`${r.role} | ${r.route} | ${r.result} | ${r.finalPath ?? '-'} | ${(r.problems ?? []).join('; ') || '-'}`);
  console.log(`\n${rows.length} cells, ${bad.length} failing`);
  if (args.json) writeFileSync(args.json, JSON.stringify(rows, null, 2));
  process.exit(bad.length ? 1 : 0);
}

main().catch((e) => { console.error(e.message); process.exit(2); });
