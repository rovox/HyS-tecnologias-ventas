#!/usr/bin/env node
// Browser smoke for inventory per branch (INV-03), the Punata seller: Inventario opens on his branch (only its
// column) → "Agregar material" can only enter Central → "Mover a otra sucursal" sends two products from Central to
// Punata in one go → "Quitar material" removes one with a reason → Historial filtered by "Quitados" shows it → the
// kardex of Punata ends on the branch stock.
//
//   node scripts/smoke-inventory-branch.mjs [--web http://localhost:3000] [--api http://localhost:3001/api] [--shots dir]
//
// Exit code 1 when a step fails or the API answers 4xx/5xx.

import { credentialsFor } from '../config/users.js';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const WEB = args.web ?? 'http://localhost:3000';
const API = args.api ?? 'http://localhost:3001/api';
const SHOTS = args.shots;
const T = { timeout: 8000 };

const { chromium } = await import('@playwright/test');
const browser = await chromium.launch();
const errors = [];
const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(credentialsFor('wilson@hscontrol.com')) });
const login = await res.json();
const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
await context.addInitScript(([t, u]) => { localStorage.setItem('hs_token', t); localStorage.setItem('hs_user', u); }, [login.accessToken, JSON.stringify(login.user)]);
const p = await context.newPage();
p.on('pageerror', (e) => errors.push(`pageerror ${e.message}`));
p.on('response', (r) => { if (r.url().startsWith(API) && r.status() >= 400) errors.push(`${r.status()} ${r.request().method()} ${r.url().replace(API, '')}`); });
const steps = [];
let failed = false;
async function step(name, fn) {
  if (failed) return steps.push({ step: name, ok: 'skipped' });
  try { await fn(); steps.push({ step: name, ok: true }); } catch (e) {
    failed = true;
    steps.push({ step: name, ok: false, error: e.message.split('\n')[0] });
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/smoke-inventory-branch.png`, fullPage: true });
  }
}
const product = async (codigo) => (await (await fetch(`${API}/inventory/products`, { headers: { authorization: `Bearer ${login.accessToken}` } })).json()).find((x) => x.codigo === codigo);
const dialog = () => p.getByRole('dialog');
async function pick(i, code) {
  await dialog().getByRole('combobox', { name: `Producto ${i}` }).click(T);
  await p.getByPlaceholder('Código, nombre o marca…').fill(code);
  await p.getByRole('option', { name: new RegExp(code) }).first().click(T);
}
const reason = `Dañado en smoke ${Date.now()}`;
let before;

await step('Inventario opens on his branch: only its column and what it has', async () => {
  before = { utp: await product('UTP-CAT6'), dvr: await product('DVR-8CH') };
  await p.goto(`${WEB}/inventario`, { waitUntil: 'networkidle' });
  if ((await p.getByLabel('Sucursal', { exact: true }).inputValue()) !== 'suc_punata') throw new Error('not on his branch');
  await p.getByRole('columnheader', { name: 'En Punata' }).waitFor(T);
  if (await p.getByRole('columnheader', { name: 'Quillacollo', exact: true }).count()) throw new Error('other branches shown');
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/inventory-branch.png` });
});
await step('"Agregar material" can only enter Central', async () => {
  await p.getByRole('button', { name: 'Agregar material' }).click(T);
  const options = await dialog().getByLabel('Entra a').locator('option').allInnerTexts();
  if (options.join('|') !== 'Elige sucursal|Central') throw new Error(`destinations: ${options.join(', ')}`);
  await dialog().getByRole('button', { name: 'Cancelar' }).click(T);
});
await step('"Mover a otra sucursal" sends two products from Central to Punata in one go', async () => {
  await p.getByRole('button', { name: 'Mover a otra sucursal' }).click(T);
  await dialog().getByLabel('Sale de').selectOption('suc_central');
  await dialog().getByLabel('Entra a').selectOption('suc_punata');
  await pick(1, 'UTP-CAT6');
  await dialog().getByLabel('Cantidad 1').fill('5');
  await dialog().getByRole('button', { name: 'Agregar producto' }).click(T);
  await pick(2, 'DVR-8CH');
  await dialog().getByLabel('Cantidad 2').fill('1');
  await dialog().getByRole('button', { name: 'Mover a otra sucursal' }).click(T);
  await p.getByText('Material movido: 2 productos').waitFor(T);
  const [utp, dvr] = [await product('UTP-CAT6'), await product('DVR-8CH')];
  if (utp.stock.suc_punata !== (before.utp.stock.suc_punata ?? 0) + 5 || dvr.stock.suc_punata !== (before.dvr.stock.suc_punata ?? 0) + 1) throw new Error('Punata stock did not grow');
});
await step('"Quitar material" removes one with a reason', async () => {
  await p.getByRole('button', { name: 'Quitar material' }).first().click(T);
  if ((await dialog().getByLabel('Sale de').locator('option').allInnerTexts()).join('|') !== 'Punata') throw new Error('he may remove from other branches');
  await pick(1, 'UTP-CAT6');
  await dialog().getByLabel('Cantidad 1').fill('1');
  await dialog().getByLabel('Motivo *').fill(reason);
  await dialog().getByRole('button', { name: 'Quitar material' }).click(T);
  await p.getByText('Material quitado: 1 producto').waitFor(T);
});
await step('Historial filtered by "Quitados" shows it; the kardex of Punata ends on the branch stock', async () => {
  await p.goto(`${WEB}/inventario?vista=movimientos`, { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: 'Filtros' }).click(T);
  await p.getByRole('menuitemcheckbox', { name: /^Quitados/ }).click(T);
  await p.keyboard.press('Escape');
  await p.locator('tr', { hasText: reason }).waitFor(T);
  await p.goto(`${WEB}/inventario`, { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: 'Kardex de UTP-CAT6' }).click(T);
  const last = dialog().locator('tbody tr').last();
  await last.waitFor(T);
  const utp = await product('UTP-CAT6');
  if (!(await last.innerText()).includes(`${utp.stock.suc_punata} metro`)) throw new Error(`kardex ends on "${await last.innerText()}", stock ${utp.stock.suc_punata}`);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/inventory-kardex.png` });
});

await browser.close();
console.table(steps);
if (errors.length) console.log('API/page errors:', errors);
process.exit(failed || errors.length ? 1 : 0);
