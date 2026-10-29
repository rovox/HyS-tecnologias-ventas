#!/usr/bin/env node
// Browser smoke for direct sales (VD-01/02/03), two live sessions: the Punata seller sells from Inventario › Vender
// (his branch, a product, paid in cash by default; a second method takes part of it and the first shows the rest) → the stored note opens in the app → Contabilidad sees the sale live in
// Ventas directas; the branch stock went down and the ledger has the payment validated → the seller has no annul
// buttons → Contabilidad annuls it with the red bin and a reason (stock back, note marked ANULADA) and corrects another
// one ("Corregir" opens the same sale pre-filled; the new one is linked).
//
//   node scripts/smoke-direct-sales.mjs [--web http://localhost:3000] [--api http://localhost:3001/api] [--shots dir]
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
  return { page, token: login.accessToken, user: login.user };
}
const seller = await session('giovanny.collao@hys.com'); // VENTAS, sucursal Punata
const conta = await session(ROLE_ACCOUNTS.contabilidad);
const steps = [];
let failed = false;
async function step(name, fn) {
  if (failed) return steps.push({ step: name, ok: 'skipped' });
  try { await fn(); steps.push({ step: name, ok: true }); } catch (e) {
    failed = true;
    steps.push({ step: name, ok: false, error: e.message.split('\n')[0] });
    if (SHOTS) for (const [n, s] of Object.entries({ seller, conta })) await s.page.screenshot({ path: `${SHOTS}/smoke-direct-sales-${n}.png`, fullPage: true });
  }
}
const get = async (s, path) => (await fetch(`${API}${path}`, { headers: { authorization: `Bearer ${s.token}` } })).json();
const punataStock = async () => (await get(conta, '/inventory/products')).find((p) => p.codigo === 'UTP-CAT6').stock.suc_punata ?? 0;
const client = `Cliente smoke ${Date.now()}`;
const row = (page, text) => page.locator('tr', { hasText: text });
// The PDF iframe may take the focus (Escape would not reach the dialog): close the viewer with its button.
const closeViewer = (page) => page.getByRole('dialog').filter({ hasText: /Nota de venta NV-/ }).getByRole('button', { name: 'Cerrar', exact: true }).last().click(T);
let stockBefore = 0;

async function sell(s, name, qty) {
  const dlg = s.page.getByRole('dialog').filter({ hasText: /Nueva venta|Corregir la venta/ });
  const fromPunata = (await dlg.locator('#sale-origin').inputValue()) === 'suc_punata';
  await dlg.getByRole('combobox', { name: 'Producto 1' }).click(T);
  // Only products in stock in the branch: the seed switch is only in Central.
  if (fromPunata) {
    await s.page.getByPlaceholder('Código, nombre o marca…').fill('SW-24P-POE');
    await s.page.getByText('Sin productos con stock en Punata').waitFor(T);
  }
  await s.page.getByPlaceholder('Código, nombre o marca…').fill('UTP-CAT6');
  await s.page.getByRole('option', { name: /UTP-CAT6/ }).getByText(/^Stock \d+(\.\d+)? metro · Bs /).first().waitFor(T);
  await s.page.getByRole('option', { name: /UTP-CAT6/ }).first().click(T);
  await dlg.getByLabel('Cantidad 1').fill(String(qty));
  await dlg.getByLabel('Nombre en la nota').fill(name);
  // One method by default for the whole total; "Agregar medio" takes part of it and the first one shows the rest.
  const total = (await dlg.getByRole('button', { name: /^Vender Bs/ }).innerText()).replace('Vender ', '');
  if ((await dlg.getByLabel('Monto 1').innerText()) !== total) throw new Error(`first payment is not the total (${total})`);
  await dlg.getByRole('button', { name: 'Agregar medio' }).click(T);
  await dlg.getByLabel('Monto 2').fill('1');
  if ((await dlg.getByLabel('Monto 1').innerText()) === total) throw new Error('the first payment did not take the rest');
  await dlg.getByLabel('Quitar pago 2').click(T);
  await dlg.getByRole('button', { name: /^Vender Bs/ }).click(T);
}

await conta.page.goto(`${WEB}/ventas-directas?suc=`, { waitUntil: 'networkidle' });
await step('the Punata seller sells from Inventario › Vender; the stored note opens in the app', async () => {
  stockBefore = await punataStock();
  const p = seller.page;
  await p.goto(`${WEB}/inventario`, { waitUntil: 'networkidle' });
  await p.getByRole('link', { name: 'Vender' }).click(T);
  const dlg = p.getByRole('dialog').filter({ hasText: 'Nueva venta' });
  await dlg.waitFor(T);
  if ((await dlg.locator('#sale-origin').inputValue()) !== 'suc_punata') throw new Error('the sale does not start on his branch');
  const origins = await dlg.getByLabel('Sale de').locator('option').allInnerTexts();
  if (origins.some((o) => o.includes('Quillacollo'))) throw new Error(`a seller may sell from another branch: ${origins.join(', ')}`);
  await sell(seller, client, 3);
  await p.getByText(/^Venta NV-\d+ registrada/).waitFor(T);
  await p.getByRole('dialog').filter({ hasText: /Nota de venta NV-/ }).locator('iframe').waitFor(T);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/direct-sales-note.png` });
  await closeViewer(p);
});
await step('Contabilidad sees it live; the branch stock went down and the ledger has it validated', async () => {
  await row(conta.page, client).waitFor({ timeout: 4000 });
  if ((await punataStock()) !== stockBefore - 3) throw new Error(`Punata stock ${await punataStock()} (before ${stockBefore})`);
  const today = new Date(Date.now() - 4 * 3600e3).toISOString().slice(0, 10);
  const ledger = await get(conta, `/finance/movements?desde=${today}&hasta=${today}&sucursalId=suc_punata`);
  const pay = ledger.find((m) => m.concepto === 'venta_directa' && m.ventaDirectaId && m.estado === 'validado' && m.cajaId === 'caja_chica_punata');
  if (!pay) throw new Error('no validated payment in caja chica Punata');
  if (SHOTS) await conta.page.screenshot({ path: `${SHOTS}/direct-sales-list.png` });
});
await step('the seller has no annul or correct buttons', async () => {
  const p = seller.page;
  await p.goto(`${WEB}/ventas-directas`, { waitUntil: 'networkidle' });
  await row(p, client).waitFor(T);
  if (await row(p, client).getByRole('button', { name: /Anular|Corregir/ }).count()) throw new Error('the seller can annul');
});
await step('Contabilidad annuls it with the red bin and a reason: stock back, note marked ANULADA', async () => {
  const p = conta.page;
  await row(p, client).getByRole('button', { name: 'Anular (pide motivo)' }).click(T);
  const dlg = p.getByRole('dialog').filter({ hasText: '¿Anular la venta' });
  await dlg.getByRole('button', { name: 'Venta duplicada' }).click(T);
  await dlg.getByRole('button', { name: 'Anular', exact: true }).click(T);
  await p.getByText(/^Venta NV-\d+ anulada/).waitFor(T);
  await row(p, client).getByText('Anulada').first().waitFor(T);
  if ((await punataStock()) !== stockBefore) throw new Error('stock did not come back');
  await row(p, client).getByRole('button', { name: /^Ver nota/ }).click(T);
  await p.getByText('Copia marcada ANULADA').waitFor(T);
  await closeViewer(p);
});
await step('"Corregir" annuls and opens the same sale pre-filled; the new one is linked', async () => {
  const p = conta.page;
  const second = `${client} B`;
  await p.getByRole('button', { name: 'Nueva venta' }).click(T);
  await p.getByRole('dialog').filter({ hasText: 'Nueva venta' }).getByLabel('Sale de').selectOption('suc_central');
  await sell(conta, second, 1);
  await p.getByText(/^Venta NV-\d+ registrada/).first().waitFor(T);
  await closeViewer(p);
  await row(p, second).getByRole('button', { name: /^Corregir/ }).click(T);
  await p.getByRole('dialog').filter({ hasText: '¿Anular la venta' }).getByRole('button', { name: 'Precio mal cargado' }).click(T);
  await p.getByRole('dialog').filter({ hasText: '¿Anular la venta' }).getByRole('button', { name: 'Anular', exact: true }).click(T);
  const dlg = p.getByRole('dialog').filter({ hasText: 'Corregir la venta' });
  await dlg.waitFor(T);
  if ((await dlg.getByLabel('Nombre en la nota').inputValue()) !== second) throw new Error('the correction is not pre-filled');
  await dlg.getByLabel('Precio 1').fill('6.5');
  await dlg.getByRole('button', { name: /^Vender Bs/ }).click(T);
  await p.getByText(/^Venta NV-\d+ registrada/).first().waitFor(T);
  await closeViewer(p);
  await row(p, second).getByText(/Corregida en NV-/).waitFor(T);
  await row(p, second).getByText(/Corrige NV-/).waitFor(T);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/direct-sales-corrected.png` });
});

await browser.close();
console.table(steps);
const errors = all.flat();
if (errors.length) console.log('API/page errors:', errors);
process.exit(failed || errors.length ? 1 : 0);
