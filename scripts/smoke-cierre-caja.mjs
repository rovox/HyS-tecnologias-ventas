#!/usr/bin/env node
// Browser smoke for the daily cash close and advances (FIN-04), two sessions: the Punata seller opens Finanzas on
// "Cierre del día" (his branch only), counts notes and coins of a past day; a difference turns the light red until he
// gives a reason; he closes it (read-only after) → Contabilidad opens it in "Cierres", observes it, then approves it
// → Contabilidad hands him an advance (Registrar gasto › Anticipo por rendir), it shows as late in "Anticipos" and is
// marked rendido.
// A different past day each run, so runs do not collide with earlier closes.
//
//   node scripts/smoke-cierre-caja.mjs [--web http://localhost:3000] [--api http://localhost:3001/api] [--shots dir]
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
async function session(email) {
  const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(credentialsFor(email)) });
  const login = await res.json();
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await context.addInitScript(([t, u]) => { localStorage.setItem('hs_token', t); localStorage.setItem('hs_user', u); }, [login.accessToken, JSON.stringify(login.user)]);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`${email} pageerror ${e.message}`));
  page.on('response', (r) => { if (r.url().startsWith(API) && r.status() >= 400) errors.push(`${email} ${r.status()} ${r.request().method()} ${r.url().replace(API, '')}`); });
  all.push(errors);
  return { page, user: login.user };
}
const seller = await session('giovanny.collao@hys.com');
const conta = await session(ROLE_ACCOUNTS.contabilidad);
const steps = [];
let failed = false;
async function step(name, fn) {
  if (failed) return steps.push({ step: name, ok: 'skipped' });
  try { await fn(); steps.push({ step: name, ok: true }); } catch (e) {
    failed = true;
    steps.push({ step: name, ok: false, error: e.message.split('\n')[0] });
    if (SHOTS) for (const [n, s] of Object.entries({ seller, conta })) await s.page.screenshot({ path: `${SHOTS}/smoke-cierre-${n}.png`, fullPage: true });
  }
}
// A past day not used by earlier runs (2023–2024).
const day = new Date(Date.UTC(2023, 0, 1) + (Math.floor(Date.now() / 1000) % 700) * 86400e3).toISOString().slice(0, 10);
const asunto = `Insumos smoke ${Date.now()}`;

await step('a seller opens Finanzas on "Cierre del día", only his branch', async () => {
  const p = seller.page;
  await p.goto(`${WEB}/finanzas`, { waitUntil: 'networkidle' });
  await p.getByRole('heading', { name: /Conteo del cajón|Qué movió el efectivo/ }).first().waitFor(T);
  const branches = await p.getByLabel('Sucursal del cierre').locator('option').allInnerTexts();
  if (branches.join('|') !== 'Punata') throw new Error(`branches: ${branches.join(', ')}`);
});
await step('counting with a difference turns red until there is a reason; then it closes and is read-only', async () => {
  const p = seller.page;
  await p.getByLabel('Día del cierre').fill(day);
  await p.getByText('Debe haber').waitFor(T);
  if (await p.getByText(/Cerrado por/).count()) throw new Error(`the day ${day} is already closed`);
  // LAUNCH P1-2: the opening cash comes from the API (no input) and the checklist to close is all green.
  if (await p.getByLabel('Saldo inicial').count()) throw new Error('the opening cash can still be typed');
  const reqs = p.getByRole('list', { name: 'Requisitos para cerrar' });
  await reqs.getByText('Los días anteriores con movimientos están cerrados').waitFor(T);
  if ((await reqs.locator('li').count()) !== 3) throw new Error('requirements missing');
  await p.getByLabel('Cantidad de Bs 50', { exact: true }).fill('1');
  await p.getByLabel('Cantidad de Bs 20', { exact: true }).fill('2');
  await p.getByLabel('Cantidad de 50 ctvs', { exact: true }).fill('1');
  await p.getByText(/Contado: Bs 90.50/).waitFor(T);
  const light = p.getByRole('status');
  if ((await light.innerText()) !== 'Cuadra') {
    await p.getByText(/falta el motivo/).waitFor(T);
    if (!(await p.getByRole('button', { name: 'Cerrar caja' }).isDisabled())) throw new Error('can close without a reason');
    await p.getByRole('button', { name: 'Error de cambio' }).click(T);
    await p.getByText(/con motivo$/).waitFor(T);
  }
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/cierre-conteo.png`, fullPage: true });
  await p.getByRole('button', { name: 'Cerrar caja' }).click(T);
  await p.getByRole('dialog').filter({ hasText: '¿Cerrar la caja' }).getByRole('button', { name: 'Cerrar caja' }).click(T);
  await p.getByText('Caja de Punata cerrada').waitFor(T);
  await p.getByText(/Cerrado por Giovanny/).waitFor(T);
  // The branch's latest closes under the form; one click opens that day (read-only).
  const latest = p.getByRole('list', { name: 'Últimos cierres' }).getByRole('button').first();
  const other = await latest.innerText();
  await latest.click(T);
  if ((await p.getByLabel('Día del cierre').inputValue()) !== other) throw new Error('history does not open the day');
  await p.getByText(/Cerrado por/).waitFor(T);
});
await step('Contabilidad opens it from "Cierres", observes it with a reason, then approves it', async () => {
  const p = conta.page;
  await p.goto(`${WEB}/finanzas?vista=cierres`, { waitUntil: 'networkidle' });
  await p.getByLabel('Desde').fill(day);
  const row = p.locator('tr', { hasText: day }).filter({ hasText: 'Punata' });
  await row.waitFor(T);
  // The difference is coloured by its sign: red shortage, amber surplus, green balanced.
  const diffClass = await row.getByText(/^(Faltante|Sobrante|Cuadra)/).first().getAttribute('class');
  const diffText = await row.getByText(/^(Faltante|Sobrante|Cuadra)/).first().innerText();
  const expected = diffText.startsWith('Faltante') ? 'danger' : diffText.startsWith('Sobrante') ? 'warning' : 'success';
  if (!diffClass.includes(`text-${expected}-fg`)) throw new Error(`difference "${diffText}" coloured ${diffClass}`);
  await row.getByRole('button', { name: 'Revisar' }).click(T);
  const dlg = p.getByRole('dialog').filter({ hasText: `Cierre del ${day}` });
  await dlg.getByRole('list', { name: 'Conteo por billete y moneda' }).getByText('2 × Bs 20').waitFor(T);
  await dlg.getByRole('button', { name: 'Observar', exact: true }).click(T);
  if (await dlg.getByRole('button', { name: 'Observar cierre' }).isEnabled()) throw new Error('observing without a reason');
  await dlg.getByRole('button', { name: 'Falta el comprobante' }).click(T);
  await dlg.getByRole('button', { name: 'Observar cierre' }).click(T);
  await p.getByText(`Cierre del ${day} observado`).waitFor(T);
  await row.getByText('Observado').waitFor(T);
  await row.getByRole('button', { name: 'Revisar' }).click(T);
  await dlg.getByText(/Observado por Estefany Gonzales: Falta el comprobante/).waitFor(T);
  await dlg.getByRole('button', { name: 'Aprobar' }).click(T);
  await p.getByText(`Cierre del ${day} aprobado`).waitFor(T);
  await row.getByText(/Aprobado · Estefany Gonzales/).waitFor(T);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/cierres.png` });
});
await step('an advance to account for: registered, late in "Anticipos", marked rendido', async () => {
  const p = conta.page;
  await p.goto(`${WEB}/finanzas?vista=anticipos`, { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: 'Registrar gasto' }).click(T);
  const dlg = p.getByRole('dialog');
  await dlg.getByLabel('Concepto').selectOption('anticipo_por_rendir');
  await dlg.getByLabel('Monto (Bs) *').fill('250');
  await dlg.getByRole('combobox', { name: 'Se entrega a' }).click(T);
  await p.getByPlaceholder('Buscar persona…').fill('Wilson');
  await p.getByRole('option', { name: 'Wilson' }).click(T);
  await dlg.getByLabel('Asunto *').fill(asunto);
  await dlg.getByLabel('Rendir hasta *').fill('2026-10-01');
  if (await dlg.getByLabel('Sucursal').count()) await dlg.getByLabel('Sucursal').selectOption({ label: 'Punata' });
  await dlg.getByRole('button', { name: 'Registrar' }).click(T);
  const row = p.locator('tr', { hasText: asunto });
  await row.getByText(/\d+ días/).waitFor(T);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/anticipos.png` });
  await row.getByRole('button', { name: 'Marcar rendido' }).click(T);
  const confirm = p.getByRole('dialog').filter({ hasText: '¿Marcar rendido' });
  await confirm.getByRole('button', { name: 'Rindió todo con facturas' }).click(T);
  await confirm.getByRole('button', { name: 'Rendido', exact: true }).click(T);
  await p.getByText('Anticipo rendido').waitFor(T);
  await row.waitFor({ state: 'detached', ...T });
});

await browser.close();
console.table(steps);
const errors = all.flat();
if (errors.length) console.log('API/page errors:', errors);
process.exit(failed || errors.length ? 1 : 0);
