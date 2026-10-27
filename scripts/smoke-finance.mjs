#!/usr/bin/env node
// Browser smoke for the ledger (FIN-01/02, FIN-03): técnico registers an expense he paid → Contabilidad observes it
// with ✗ → técnico corrects it → Contabilidad validates it with ✓ and refunds it; ventas collects on a project for the
// técnico and Contabilidad sees it live in "Por rendir"; Contabilidad annuls a validated movement after seeing its
// effect on the box; the daily ledger moves by day and branch, downloads Excel and annuls with the red bin (FIN-06);
// boxes and receivables render; the técnico has no inbox.
//
//   node scripts/smoke-finance.mjs [--web http://localhost:3000] [--api http://localhost:3001/api] [--shots dir]
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
  const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(credentialsFor(ROLE_ACCOUNTS[role])) });
  const login = await res.json();
  const context = await browser.newContext({ viewport: { width: 1366, height: 800 } });
  await context.addInitScript(([t, u]) => { localStorage.setItem('hs_token', t); localStorage.setItem('hs_user', u); }, [login.accessToken, JSON.stringify(login.user)]);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`${role} pageerror ${e.message}`));
  page.on('response', (r) => { if (r.url().startsWith(API) && r.status() >= 400) errors.push(`${role} ${r.status()} ${r.request().method()} ${r.url().replace(API, '')}`); });
  all.push(errors);
  return { page, token: login.accessToken, user: login.user };
}
const tec = await session('tecnico');
const admin = await session('contabilidad'); // the rendición is Contabilidad's (AUTH-01)
const ventas = await session('ventas');
const steps = [];
let failed = false;
async function step(name, fn) {
  if (failed) return steps.push({ step: name, ok: 'skipped' });
  try { await fn(); steps.push({ step: name, ok: true }); } catch (e) {
    failed = true;
    steps.push({ step: name, ok: false, error: e.message.split('\n')[0] });
    if (SHOTS) for (const [n, s] of Object.entries({ tec, admin, ventas })) await s.page.screenshot({ path: `${SHOTS}/smoke-finance-${n}.png`, fullPage: true });
  }
}
async function confirmWith(page, label, reason) {
  const dialog = page.getByRole('dialog');
  if (reason) await dialog.locator('textarea').fill(reason);
  await dialog.getByRole('button', { name: label, exact: true }).click(T);
  await dialog.waitFor({ state: 'hidden', ...T });
}
const note = `Combustible ${Date.now()}`;
const row = (page, text) => page.locator('tr', { hasText: text });
async function rowAction(page, text, label) {
  await row(page, text).getByRole('button', { name: 'Más acciones del movimiento' }).click(T);
  await page.getByRole('menuitem', { name: label }).click(T);
}

await admin.page.goto(`${WEB}/finanzas?vista=por_validar`, { waitUntil: 'networkidle' });
await step('técnico registers an expense he paid', async () => {
  await tec.page.goto(`${WEB}/finanzas`, { waitUntil: 'networkidle' });
  await tec.page.getByRole('button', { name: 'Registrar gasto' }).click(T);
  await tec.page.getByLabel('Concepto').selectOption('combustible');
  await tec.page.getByLabel('Monto (Bs) *').fill('80');
  await tec.page.getByRole('radio', { name: 'Yo (reembolso)' }).click(T);
  await tec.page.getByLabel('Nota').fill(note);
  await tec.page.getByRole('dialog').getByRole('button', { name: 'Registrar' }).click(T);
  await tec.page.getByText('Registrado: queda por validar').waitFor(T);
  await row(tec.page, note).getByText('Por validar').waitFor(T);
});
await step('the Contabilidad inbox shows it without reload', () => row(admin.page, note).waitFor({ timeout: 3000 }));
await step('Contabilidad observes it with ✗ and a quick reason', async () => {
  await row(admin.page, note).getByRole('button', { name: 'Observar: no es correcto' }).click(T);
  const dialog = admin.page.getByRole('dialog');
  await dialog.getByText('Tiene el dinero').or(dialog.getByText('Registró')).first().waitFor(T);
  await dialog.getByRole('button', { name: 'Falta comprobante' }).click(T);
  await dialog.getByRole('button', { name: 'Observar', exact: true }).click(T);
  await dialog.waitFor({ state: 'hidden', ...T });
  await row(admin.page, note).getByText('Observado').waitFor(T);
});
await step('técnico corrects it and it returns to validation', async () => {
  await row(tec.page, note).getByText('Observado').waitFor(T);
  await row(tec.page, note).getByRole('button', { name: 'Corregir' }).click(T);
  await tec.page.getByText('Observación: Falta comprobante').waitFor(T);
  await tec.page.getByLabel('Monto (Bs) *').fill('85');
  await tec.page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click(T);
  await tec.page.getByText('Corregido: vuelve a validación').waitFor(T);
});
await step('Contabilidad validates it with ✓ (branch box) and refunds it', async () => {
  await row(admin.page, note).getByText('Por validar').waitFor(T);
  await row(admin.page, note).getByRole('button', { name: 'Validar en la caja de la sucursal' }).click(T);
  await admin.page.getByText(/^Validado en /).waitFor(T);
  await admin.page.goto(`${WEB}/finanzas?vista=reembolsos`, { waitUntil: 'networkidle' });
  await rowAction(admin.page, note, 'Marcar reembolsado');
  await confirmWith(admin.page, 'Reembolsado');
  await row(admin.page, note).waitFor({ state: 'detached', ...T });
});
const cobro = `Cobro en sitio ${Date.now()}`;
await step('ventas collects on a project for the técnico; "Por rendir" shows it live', async () => {
  const projects = await (await fetch(`${API}/projects`, { headers: { authorization: `Bearer ${ventas.token}` } })).json();
  const p = projects.find((x) => x.saldo >= 50 && !['cerrado', 'anulado'].includes(x.estado));
  await admin.page.goto(`${WEB}/finanzas?vista=por_rendir`, { waitUntil: 'networkidle' });
  await ventas.page.goto(`${WEB}/projects/${p.id}`, { waitUntil: 'networkidle' });
  await ventas.page.getByRole('button', { name: 'Registrar cobro' }).click(T);
  await ventas.page.getByRole('radio', { name: 'Cobro' }).click(T);
  await ventas.page.getByLabel('Monto (Bs) *').fill('50');
  await ventas.page.getByLabel('¿Quién recibió el dinero?').click(T);
  await ventas.page.getByPlaceholder('Buscar persona…').fill(tec.user.name);
  await ventas.page.getByRole('option', { name: tec.user.name }).click(T);
  await ventas.page.getByLabel('Nota').fill(cobro);
  await ventas.page.getByRole('dialog').getByRole('button', { name: 'Registrar cobro' }).click(T);
  await ventas.page.getByText(/registrado: queda por validar/).waitFor(T);
  await admin.page.getByRole('region', { name: `Por rendir de ${tec.user.name}` }).locator('tr', { hasText: p.codigo }).first().waitFor({ timeout: 4000 });
  if (SHOTS) await admin.page.screenshot({ path: `${SHOTS}/finance-custody.png` });
});
await step('Contabilidad validates it, then annuls it after seeing the effect on the box', async () => {
  await admin.page.goto(`${WEB}/finanzas?vista=movimientos`, { waitUntil: 'networkidle' });
  await row(admin.page, cobro).click(T);
  const sheet = admin.page.getByRole('dialog');
  await sheet.getByRole('button', { name: 'Validar', exact: true }).click(T);
  await sheet.getByText('Validado', { exact: true }).first().waitFor(T);
  await sheet.getByRole('button', { name: 'Anular' }).click(T);
  const confirm = admin.page.getByRole('dialog').filter({ hasText: '¿Anular' });
  await confirm.getByText(/ baja de Bs/).waitFor(T);
  await confirm.locator('textarea').fill('Cobro duplicado');
  await confirm.getByRole('button', { name: 'Anular', exact: true }).click(T);
  await admin.page.getByText('Movimiento anulado').waitFor(T);
  await admin.page.keyboard.press('Escape');
});
await step('daily ledger (FIN-06): today by default, another day, one branch, Excel download, annul with the red bin', async () => {
  const p = admin.page;
  await p.goto(`${WEB}/finanzas?vista=movimientos`, { waitUntil: 'networkidle' });
  await row(p, note).waitFor(T);
  await p.getByRole('button', { name: 'Día anterior' }).click(T);
  await row(p, note).waitFor({ state: 'detached', ...T }); // yesterday's book does not have today's expense
  await p.getByRole('button', { name: 'Hoy' }).click(T);
  await row(p, note).waitFor(T);
  await p.getByLabel('Libro de').selectOption({ label: 'Sucursal Quillacollo' });
  await row(p, note).waitFor({ state: 'detached', ...T });
  await p.getByLabel('Libro de').selectOption({ label: 'Toda la empresa' });
  await row(p, note).waitFor(T);
  const [download] = await Promise.all([p.waitForEvent('download', T), p.getByRole('button', { name: 'Excel' }).click(T)]);
  if (!download.suggestedFilename().endsWith('.xlsx')) throw new Error(`downloaded ${download.suggestedFilename()}`);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/finance-ledger.png` });
  await row(p, note).getByRole('button', { name: 'Anular (pide motivo)' }).click(T);
  await confirmWith(p, 'Anular', 'Duplicado en el smoke');
  await row(p, note).getByText('Anulado').waitFor(T);
});
await step('boxes and receivables render', async () => {
  await admin.page.goto(`${WEB}/finanzas?vista=cajas`, { waitUntil: 'networkidle' });
  await admin.page.getByText('Caja central Cochabamba').waitFor(T);
  if (SHOTS) await admin.page.screenshot({ path: `${SHOTS}/finance-boxes.png` });
  await admin.page.goto(`${WEB}/finanzas?vista=por_cobrar`, { waitUntil: 'networkidle' });
  await admin.page.getByRole('columnheader', { name: 'Saldo' }).waitFor(T);
  if (SHOTS) await admin.page.screenshot({ path: `${SHOTS}/finance-receivables.png` });
});
await step('técnico has no validation inbox and sees only his movements', async () => {
  await tec.page.goto(`${WEB}/finanzas`, { waitUntil: 'networkidle' });
  if (await tec.page.getByRole('link', { name: /Bandeja/ }).count()) throw new Error('técnico sees the validation inbox');
  if (await tec.page.getByRole('link', { name: 'Por cobrar' }).count()) throw new Error('técnico sees receivables');
});

await browser.close();
console.table(steps);
const errors = all.flat();
if (errors.length) console.log('API/page errors:', errors);
process.exit(failed || errors.length ? 1 : 0);
