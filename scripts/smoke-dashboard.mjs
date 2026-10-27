#!/usr/bin/env node
// Browser smoke for the dashboard and the quotation quick actions (DASH-01/02, QUO-03, PLAT-07): ventas sees the money
// of the month and today per branch; "Nueva venta", "Programar trabajo" and "Agregar material" open their form at once;
// old /reports lands on the dashboard; Contabilidad also sees the latest activity; a quotation row duplicates into a
// pre-filled form and creates a task.
//
//   node scripts/smoke-dashboard.mjs [--web http://localhost:3000] [--api http://localhost:3001/api] [--shots dir]
//
// Exit code 1 when a step fails or the API answers 4xx/5xx.

import { ROLE_ACCOUNTS, credentialsFor } from '../config/users.js';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const WEB = args.web ?? 'http://localhost:3000';
const API = args.api ?? 'http://localhost:3001/api';
const SHOTS = args.shots;
const T = { timeout: 8000 };

const { chromium } = await import('@playwright/test');
const browser = await chromium.launch();
const all = [];
async function session(role) {
  const login = await (await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(credentialsFor(ROLE_ACCOUNTS[role])) })).json();
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await context.addInitScript(([t, u]) => { localStorage.setItem('hs_token', t); localStorage.setItem('hs_user', u); }, [login.accessToken, JSON.stringify(login.user)]);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`${role} pageerror ${e.message}`));
  page.on('response', (r) => { if (r.url().startsWith(API) && r.status() >= 400) errors.push(`${role} ${r.status()} ${r.request().method()} ${r.url().replace(API, '')}`); });
  all.push(errors);
  return { page };
}
const ventas = await session('ventas');
const conta = await session('contabilidad');
const steps = [];
let failed = false;
async function step(name, fn) {
  if (failed) return steps.push({ step: name, ok: 'skipped' });
  try { await fn(); steps.push({ step: name, ok: true }); } catch (e) {
    failed = true;
    steps.push({ step: name, ok: false, error: e.message.split('\n')[0] });
    if (SHOTS) for (const [n, s] of Object.entries({ ventas, conta })) await s.page.screenshot({ path: `${SHOTS}/smoke-dashboard-${n}.png`, fullPage: true });
  }
}
const p = ventas.page;
const dialog = (text) => p.getByRole('dialog').filter({ hasText: text });

await step('ventas: money of the month and today per branch; no activity feed', async () => {
  await p.goto(`${WEB}/dashboard`, { waitUntil: 'networkidle' });
  await p.getByRole('heading', { name: /^Dinero de / }).waitFor(T);
  for (const label of ['Cobrado', 'En caja', 'Egresos', 'Neto']) await p.getByText(label, { exact: true }).first().waitFor(T);
  await p.getByText('Hoy por sucursal').waitFor(T);
  if (await p.getByText('Actividad reciente').count()) throw new Error('ventas sees the activity feed');
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/dashboard.png`, fullPage: true });
});
await step('quick actions open their form at once (Nueva venta, Programar trabajo, Agregar material)', async () => {
  await p.getByRole('button', { name: 'Nueva venta' }).click(T);
  await dialog('Nueva venta').waitFor(T);
  await dialog('Nueva venta').getByRole('button', { name: 'Cancelar' }).click(T);
  await p.goto(`${WEB}/dashboard`, { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: 'Programar trabajo' }).click(T);
  await dialog('Programar trabajo').getByRole('button', { name: /Qué/ }).waitFor(T);
  await dialog('Programar trabajo').getByRole('button', { name: 'Cancelar' }).click(T);
  await p.goto(`${WEB}/dashboard`, { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: 'Agregar material' }).click(T);
  await dialog('Agregar material (compra)').waitFor(T);
  await dialog('Agregar material (compra)').getByRole('button', { name: 'Cancelar' }).click(T);
});
await step('old /reports lands on the dashboard; Contabilidad sees the latest activity', async () => {
  await p.goto(`${WEB}/reports`, { waitUntil: 'networkidle' });
  if (!p.url().endsWith('/dashboard')) throw new Error(`landed on ${p.url()}`);
  await conta.page.goto(`${WEB}/dashboard`, { waitUntil: 'networkidle' });
  await conta.page.getByText('Actividad reciente').waitFor(T);
  if (await conta.page.getByRole('link', { name: 'Reportes' }).count()) throw new Error('Reportes still in the menu');
});
await step('a quotation row duplicates into a pre-filled form and creates a task', async () => {
  await p.goto(`${WEB}/quotations`, { waitUntil: 'networkidle' });
  const row = p.locator('tbody tr').first();
  await row.getByRole('button', { name: 'Duplicar' }).click(T);
  const form = p.getByRole('dialog');
  const titulo = await form.getByLabel(/Título/).first().inputValue();
  if (!titulo.endsWith('(copia)')) throw new Error(`title: ${titulo}`);
  await form.getByRole('button', { name: 'Cancelar' }).click(T);
  await row.getByRole('button', { name: 'Nueva tarea de esta cotización' }).click(T);
  const confirm = p.getByRole('dialog').filter({ hasText: 'Tarea para' });
  await confirm.getByRole('button', { name: 'Llamar al cliente' }).click(T);
  await confirm.getByRole('button', { name: 'Crear tarea' }).click(T);
  await p.getByText(/^Tarea creada/).waitFor(T);
});

await browser.close();
console.table(steps);
const errors = all.flat();
if (errors.length) console.log('API/page errors:', errors);
process.exit(failed || errors.length ? 1 : 0);
