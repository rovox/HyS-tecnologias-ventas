#!/usr/bin/env node
// Browser smoke for the cronograma (SCH-02, SCH-03, SCH-04): ventas programs a stand-alone job in three steps (what,
// when with hour pickers and the day's jobs, who) without técnico (red "Sin técnico" button) and assigns him from the
// job panel → the técnico sees it live, starts it from the card and takes a payment; his panel says what he may do
// and has no Cancelar → ventas sees the change live and moves it with "Editar trabajo" → the técnico finishes it (green)
// and it moves from "Activos" to "Terminados"; month and list views render; a project job shows that its money is the
// project's and offers "Registrar material".
//
//   node scripts/smoke-schedule.mjs [--web http://localhost:3000] [--api http://localhost:3001/api] [--shots dir]

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
async function session(role, viewport = { width: 1366, height: 860 }) {
  const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(credentialsFor(ROLE_ACCOUNTS[role])) });
  const login = await res.json();
  const context = await browser.newContext({ viewport });
  await context.addInitScript(([t, u]) => { localStorage.setItem('hs_token', t); localStorage.setItem('hs_user', u); }, [login.accessToken, JSON.stringify(login.user)]);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`${role} pageerror ${e.message}`));
  page.on('response', (r) => { if (r.url().startsWith(API) && r.status() >= 400) errors.push(`${role} ${r.status()} ${r.request().method()} ${r.url().replace(API, '')}`); });
  all.push(errors);
  return { page, user: login.user };
}
const ventas = await session('ventas');
const tec = await session('tecnico', { width: 390, height: 844 });
const steps = [];
let failed = false;
async function step(name, fn) {
  if (failed) return steps.push({ step: name, ok: 'skipped' });
  try { await fn(); steps.push({ step: name, ok: true }); } catch (e) {
    failed = true;
    steps.push({ step: name, ok: false, error: e.message.split('\n')[0] });
    if (SHOTS) { await ventas.page.screenshot({ path: `${SHOTS}/smoke-schedule-ventas.png`, fullPage: true }); await tec.page.screenshot({ path: `${SHOTS}/smoke-schedule-tec.png`, fullPage: true }); }
  }
}
async function confirmWith(page, label, reason) {
  const dialog = page.getByRole('dialog').filter({ hasText: '¿' });
  if (reason) await dialog.locator('textarea').fill(reason);
  await dialog.getByRole('button', { name: label, exact: true }).click(T);
  await dialog.waitFor({ state: 'hidden', ...T });
}
const desc = `Revisión smoke ${Date.now()}`;
const sheet = (page) => page.getByRole('dialog').filter({ hasText: desc });
let movedTo = '';

await ventas.page.goto(`${WEB}/schedule`, { waitUntil: 'networkidle' });
await tec.page.goto(`${WEB}/schedule`, { waitUntil: 'networkidle' });
await step('ventas schedules a stand-alone job without técnico', async () => {
  const p = ventas.page;
  await p.getByRole('button', { name: 'Programar trabajo', exact: true }).click(T);
  await p.getByRole('combobox').filter({ hasText: 'Selecciona un cliente' }).click(T);
  await p.getByPlaceholder('Buscar cliente…').fill('Andina');
  await p.getByRole('option', { name: 'Comercial Andina SRL' }).click(T);
  await p.getByRole('radio', { name: 'Seguridad electrónica' }).click(T);
  await p.getByLabel('Trabajo *').fill(desc);
  await p.getByLabel('Monto a cobrar (Bs)').fill('500');
  await p.getByRole('button', { name: 'Siguiente' }).click(T);
  await p.getByText(/Ya programados ese día \(\d+\)/).waitFor(T);
  await p.getByLabel('Desde', { exact: true }).selectOption('10:00');
  await p.getByLabel('Hasta', { exact: true }).selectOption('12:00');
  await p.getByRole('button', { name: 'Siguiente' }).click(T);
  await p.getByText('Al lado de cada técnico').waitFor(T);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/schedule-steps.png` });
  await p.getByRole('button', { name: 'Programar', exact: true }).click(T);
  await p.getByText('Trabajo programado').waitFor(T);
  await sheet(p).waitFor(T);
  await p.locator('button', { hasText: /Sin técnico \(\d+\)/ }).waitFor(T); // behind the open panel (aria-hidden)
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/schedule-unassigned.png` });
});
await step('ventas assigns the técnico from the job panel', async () => {
  const p = ventas.page;
  await sheet(p).getByRole('combobox').filter({ hasText: 'Asignar técnico' }).click(T); // searchable combobox (SearchSelect)
  await p.getByPlaceholder('Buscar técnico…').fill(tec.user.name);
  await p.getByRole('option', { name: tec.user.name }).click(T);
  await p.getByText(`Asignado a ${tec.user.name}`).waitFor(T);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/schedule-detail.png` });
});
await step('the técnico sees it live on his phone and starts it', async () => {
  const p = tec.page;
  await p.getByRole('button', { name: new RegExp('Comercial Andina SRL') }).filter({ hasText: desc }).waitFor({ timeout: 4000 });
  // The next step is on the card itself (SCH-04).
  await p.getByRole('button', { name: `Iniciar: Comercial Andina SRL — ${desc}` }).click(T);
  await confirmWith(p, 'Iniciar');
  await p.getByText('Trabajo en proceso').waitFor(T);
  await p.getByRole('button', { name: new RegExp('Comercial Andina SRL') }).filter({ hasText: desc }).click(T);
  await sheet(p).getByText(/Puedes: terminar, registrar cobro/).waitFor(T);
  if (await sheet(p).getByRole('button', { name: 'Cancelar', exact: true }).count()) throw new Error('the técnico can cancel');
});
await step('ventas sees "En proceso" without reload', () => sheet(ventas.page).getByText('En proceso').first().waitFor({ timeout: 3000 }));
await step('the técnico takes a payment by QR into his own QR (it must say which QR)', async () => {
  const p = tec.page;
  await sheet(p).getByRole('button', { name: 'Registrar cobro' }).click(T);
  const dlg = p.getByRole('dialog').filter({ hasText: 'Registrar cobro' }).last();
  await dlg.getByLabel('Monto (Bs) *').fill('200');
  await dlg.getByLabel('Método').selectOption('qr');
  if (await dlg.getByRole('button', { name: 'Registrar cobro' }).isEnabled()) throw new Error('a QR cobro without its QR can be registered');
  await dlg.getByRole('radio', { name: 'Mi QR personal' }).click(T);
  await dlg.getByText(/queda en Anticipos hasta entregarlo/).waitFor(T);
  await dlg.getByRole('button', { name: 'Registrar' }).click(T);
  await p.getByText('Cobro de Bs 200.00 registrado: queda por validar').waitFor(T);
  await sheet(ventas.page).getByText('Bs 300.00').waitFor({ timeout: 4000 });
});
await step('ventas moves it to the next day with "Editar trabajo"', async () => {
  const p = ventas.page;
  await sheet(p).getByRole('button', { name: 'Editar trabajo' }).click(T);
  const dlg = p.getByRole('dialog').filter({ hasText: 'Guardar cambios' });
  await dlg.getByRole('button', { name: /Cuándo/ }).click(T);
  const date = dlg.getByLabel('Fecha *');
  const value = await date.inputValue();
  const next = new Date(`${value}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  movedTo = next.toISOString().slice(0, 10);
  await date.fill(movedTo);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/schedule-edit.png` });
  await dlg.getByRole('button', { name: 'Guardar cambios' }).click(T);
  await p.getByText('Trabajo actualizado').waitFor(T);
});
await step('the técnico finishes it', async () => {
  const p = tec.page;
  await sheet(p).getByRole('button', { name: 'Terminar' }).click(T);
  await confirmWith(p, 'Terminar');
  await p.getByText('Trabajo terminado').waitFor(T);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/schedule-phone.png` });
});
await step('state tabs: the finished job leaves "Activos" and shows under "Terminados"', async () => {
  const p = ventas.page;
  await p.keyboard.press('Escape');
  const card = () => p.getByRole('button', { name: new RegExp('Comercial Andina SRL') }).filter({ hasText: desc });
  await card().waitFor({ state: 'detached', timeout: 4000 });
  await p.goto(`${WEB}/schedule?dia=${movedTo}`, { waitUntil: 'networkidle' }); // the week where it was moved
  if (await card().count()) throw new Error('a finished job is still under Activos');
  await p.getByRole('button', { name: /^Terminados \d+/ }).click(T);
  await card().waitFor(T);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/schedule-done.png` });
  await p.getByRole('button', { name: /^Activos \d+/ }).click(T);
});
await step('month and list views render', async () => {
  const p = ventas.page;
  await p.keyboard.press('Escape');
  await p.getByRole('tab', { name: 'Mes' }).click(T);
  await p.getByText('Lun', { exact: true }).waitFor(T);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/schedule-month.png` });
  await p.getByRole('tab', { name: 'Lista' }).click(T);
  await p.getByRole('columnheader', { name: 'Técnico' }).waitFor(T);
});
await step('a project job says its money is the project\'s', async () => {
  const p = ventas.page;
  const row = p.locator('tr', { hasText: 'PRY-' }).first();
  await row.click(T);
  await p.getByText('Los cobros van al proyecto').waitFor(T);
  await p.getByRole('button', { name: 'Registrar material' }).waitFor(T);
});
await step('week view (desktop) for the screenshot', async () => {
  const p = ventas.page;
  await p.keyboard.press('Escape');
  await p.getByRole('tab', { name: 'Semana' }).click(T);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/schedule-week.png` });
});

await browser.close();
console.table(steps);
const errors = all.flat();
if (errors.length) console.log('API/page errors:', errors);
process.exit(failed || errors.length ? 1 : 0);
