#!/usr/bin/env node
// Browser smoke for clients (CLI-01): no Activo/Contratado tags; "con servicio en curso" and "con saldo" filters;
// create and edit a client (another session sees it live); client page with projects, warranty and balance;
// a quotation started from the client comes with the client; a técnico reads clients without commercial actions.
//
//   node scripts/smoke-clients.mjs [--web http://localhost:3000] [--api http://localhost:3001/api] [--shots dir]

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
  const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(credentialsFor(ROLE_ACCOUNTS[role])) });
  const login = await res.json();
  const context = await browser.newContext({ viewport: { width: 1366, height: 860 } });
  await context.addInitScript(([t, u]) => { localStorage.setItem('hs_token', t); localStorage.setItem('hs_user', u); }, [login.accessToken, JSON.stringify(login.user)]);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`${role} pageerror ${e.message}`));
  page.on('response', (r) => { if (r.url().startsWith(API) && r.status() >= 400) errors.push(`${role} ${r.status()} ${r.request().method()} ${r.url().replace(API, '')}`); });
  all.push(errors);
  return { page };
}
const A = await session('ventas');
const B = await session('admin');
const tec = await session('tecnico');
const p = A.page;
const steps = [];
let failed = false;
async function step(name, fn) {
  if (failed) return steps.push({ step: name, ok: 'skipped' });
  try { await fn(); steps.push({ step: name, ok: true }); } catch (e) {
    failed = true;
    steps.push({ step: name, ok: false, error: e.message.split('\n')[0] });
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/smoke-clients-fail.png`, fullPage: true });
  }
}
const name = `Cliente smoke ${Date.now()}`;

await B.page.goto(`${WEB}/clientes`, { waitUntil: 'networkidle' });
await p.goto(`${WEB}/clientes`, { waitUntil: 'networkidle' });
await step('the list has no Activo/Contratado tags', async () => {
  const text = await p.locator('main').innerText();
  if (/\bActivo\b|\bInactivo\b|Contratado/.test(text)) throw new Error('old tags still shown');
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/clients-list.png` });
});
await step('filter: con saldo pendiente', async () => {
  await p.getByRole('button', { name: 'Filtros' }).click(T);
  await p.getByRole('menuitemcheckbox', { name: 'Con saldo pendiente' }).click(T);
  await p.keyboard.press('Escape');
  await p.getByText('Clínica Horizonte').first().waitFor(T);
  await p.getByRole('button', { name: 'Quitar Con saldo pendiente' }).click(T);
});
await step('create a client; the other session lists it live', async () => {
  await p.getByRole('button', { name: 'Nuevo cliente' }).click(T);
  await p.getByLabel('Nombre o razón social *').fill(name);
  await p.getByLabel('Teléfono').fill('70011122');
  await p.getByRole('button', { name: 'Registrar' }).click(T);
  await p.waitForURL(/\/clientes\/[0-9a-f-]{36}$/, T);
  await B.page.getByText(name).first().waitFor({ timeout: 3000 });
});
await step('edit the client (history records it)', async () => {
  await p.getByRole('button', { name: 'Editar' }).click(T);
  await p.getByLabel('Persona de contacto').fill('Ana Smoke');
  await p.getByRole('button', { name: 'Guardar' }).click(T);
  await p.getByText('Cliente guardado').waitFor(T);
  await p.getByText('Ana Smoke').first().waitFor(T);
  await p.getByText('editó').first().waitFor(T);
});
await step('a quotation started here comes with the client', async () => {
  await p.getByRole('button', { name: 'Nueva cotización' }).click(T);
  const dlg = p.getByRole('dialog', { name: 'Nueva cotización' });
  await dlg.getByRole('combobox').filter({ hasText: name }).waitFor(T);
  await dlg.getByRole('button', { name: 'Cancelar' }).click(T);
});
await step('a client with projects shows balance and warranty', async () => {
  await p.goto(`${WEB}/clientes/cli_hospital`, { waitUntil: 'networkidle' });
  await p.getByText('Saldo pendiente').first().waitFor(T);
  await p.getByRole('tab', { name: /Proyectos y garantías/ }).waitFor(T);
  await p.getByRole('columnheader', { name: 'Garantía' }).waitFor(T);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/client-detail.png`, fullPage: true });
});
await step('a técnico reads clients without commercial actions', async () => {
  await tec.page.goto(`${WEB}/clientes/cli_hospital`, { waitUntil: 'networkidle' });
  await tec.page.getByText('Clínica Horizonte').first().waitFor(T);
  if (await tec.page.getByRole('button', { name: 'Nueva cotización' }).count()) throw new Error('técnico sees Nueva cotización');
});

await browser.close();
console.table(steps);
const errors = all.flat();
if (errors.length) console.log('API/page errors:', errors);
process.exit(failed || errors.length ? 1 : 0);
