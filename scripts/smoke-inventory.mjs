#!/usr/bin/env node
// Browser smoke for inventory (INV-01): create a product; register an entrada and a transfer (another session sees
// the stock per branch live); low-stock filter; an internal order picks the product from the catalog and, once
// delivered, moves the stock; a técnico reads the inventory without actions.
//
//   node scripts/smoke-inventory.mjs [--web http://localhost:3000] [--api http://localhost:3001/api] [--shots dir]

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
  return { page, token: login.accessToken };
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
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/smoke-inventory-fail.png`, fullPage: true });
  }
}
const code = `SMK-${Date.now().toString().slice(-6)}`;
const row = (page) => page.getByRole('row', { name: new RegExp(code) });
// Central · Punata · Quillacollo · total, as the row shows them (waits for the live refresh).
const stockIs = (page, expected) =>
  page.waitForFunction(([c, e]) => [...document.querySelectorAll('tr')].some((tr) => { const t = tr.innerText.replace(/\s+/g, ' '); return t.includes(c) && t.includes(` ${e} unidad`); }), [code, expected], { timeout: 3000 });
async function act(label) {
  await p.getByRole('button', { name: `Acciones de ${code}` }).click(T);
  await p.getByRole('menuitem', { name: label }).click(T);
}

await B.page.goto(`${WEB}/inventario`, { waitUntil: 'networkidle' });
await p.goto(`${WEB}/inventario`, { waitUntil: 'networkidle' });
await step('create a product; the other session lists it live', async () => {
  await p.getByRole('button', { name: 'Nuevo producto' }).click(T);
  await p.getByLabel('Código *').fill(code);
  await p.getByLabel('Nombre *').fill('Cámara domo smoke');
  await p.getByRole('radio', { name: 'Seguridad electrónica' }).click(T);
  await p.getByLabel('Stock mínimo (alerta)').fill('5');
  await p.getByRole('button', { name: 'Crear' }).click(T);
  await p.getByText('Producto creado').waitFor(T);
  await row(B.page).waitFor({ timeout: 3000 });
});
await step('a product without stock shows in "Stock bajo"', async () => {
  await p.getByRole('button', { name: 'Filtros' }).click(T);
  await p.getByRole('menuitemcheckbox', { name: 'Stock bajo' }).click(T);
  await p.keyboard.press('Escape');
  await row(p).waitFor(T);
  await p.getByRole('button', { name: 'Quitar Stock bajo' }).click(T);
});
await step('entrada of 10 to Central; the other session sees the stock', async () => {
  await act('Entrada (compra)');
  await p.getByLabel('Entra a').selectOption({ label: 'Central' });
  await p.getByLabel(/Cantidad/).fill('10');
  await p.getByLabel('Costo unitario (Bs)').fill('300');
  await p.getByRole('button', { name: 'Registrar' }).click(T);
  await p.getByText('Entrada registrada').waitFor(T);
  await stockIs(B.page, '10 0 0 10');
});
await step('a transfer above the stock is warned; 3 to Quillacollo moves it', async () => {
  await act('Transferir');
  await p.getByLabel('Sale de').selectOption({ label: 'Central (10)' });
  await p.getByLabel('Hacia').selectOption({ label: 'Quillacollo' });
  await p.getByLabel(/Cantidad/).fill('50');
  await p.getByText('Solo hay 10').waitFor(T);
  await p.getByLabel(/Cantidad/).fill('3');
  await p.getByRole('button', { name: 'Registrar' }).click(T);
  await p.getByText('Transferencia registrada').waitFor(T);
  await stockIs(p, '7 0 3 10');
});
await step('an internal order (Inventario › Pedidos) is delivered from its page: stock moves, history shows who did it', async () => {
  await p.goto(`${WEB}/inventario?vista=pedidos`, { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: 'Nuevo pedido' }).click(T);
  const dlg = p.getByRole('dialog');
  await dlg.getByRole('radio', { name: 'Para una sucursal' }).click(T);
  await dlg.getByLabel('Sale de').selectOption({ label: 'Central' });
  await dlg.getByLabel('Para la sucursal *').selectOption({ label: 'Punata' });
  await dlg.getByLabel('Producto del inventario').first().click(T); // searchable combobox (SearchSelect)
  await p.getByPlaceholder('Buscar por código o nombre…').fill(code);
  await p.getByRole('option', { name: new RegExp(code) }).click(T);
  await dlg.getByLabel('Cantidad *').first().fill('2');
  await dlg.getByRole('button', { name: 'Crear pedido' }).click(T);
  await p.waitForURL(/\/inventario\/pedidos\//, T);
  for (const label of ['Aprobar', 'Preparar', 'Listo para entregar', 'Entregar']) {
    await p.getByRole('button', { name: label, exact: true }).first().click(T);
    const confirm = p.getByRole('dialog');
    if (label === 'Entregar') await confirm.getByText(/Salen 2 .* de Central a Punata/).waitFor(T);
    await confirm.getByRole('button', { name: label, exact: true }).click(T);
    await confirm.waitFor({ state: 'hidden', ...T });
  }
  await p.getByText('Stock movido al entregar').waitFor(T);
  await p.getByRole('region', { name: 'Historial' }).getByText('cambió el estado').first().waitFor(T);
  await stockIs(B.page, '5 2 3 10');
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/order.png`, fullPage: true });
});
await step('salida a proyecto: the project shows the material and its cost, the client the equipment', async () => {
  await p.goto(`${WEB}/inventario`, { waitUntil: 'networkidle' });
  await act('Salida a proyecto');
  await p.getByLabel('Sale de').selectOption({ label: 'Central (5)' });
  const projects = await (await fetch(`${API}/projects`, { headers: { Authorization: `Bearer ${B.token}` } })).json();
  const target = projects.find((x) => !['cerrado', 'anulado'].includes(x.estado));
  const projectId = target.id;
  await p.getByLabel('Proyecto *').click(T); // searchable combobox (SearchSelect)
  await p.getByPlaceholder('Buscar código, título o cliente…').fill(target.codigo);
  await p.getByRole('option', { name: new RegExp(target.codigo) }).first().click(T);
  await p.getByLabel(/Cantidad/).fill('1');
  await p.getByRole('button', { name: 'Registrar' }).click(T);
  await p.getByText('Salida registrada').waitFor(T);
  await p.goto(`${WEB}/projects/${projectId}`, { waitUntil: 'networkidle' });
  await p.getByRole('tab', { name: /Material/ }).click(T);
  await p.getByRole('row', { name: new RegExp(code) }).waitFor(T);
  await p.getByText(/material: Bs/).waitFor(T);
  const project = await (await fetch(`${API}/projects/${projectId}`, { headers: { Authorization: `Bearer ${B.token}` } })).json();
  await p.goto(`${WEB}/clientes/${project.cliente?.id ?? project.clienteId}`, { waitUntil: 'networkidle' });
  await p.getByRole('tab', { name: /Equipos/ }).click(T);
  await p.getByRole('row', { name: new RegExp(code) }).waitFor(T);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/client-equipment.png` });
});
await step('movements tab lists the order delivery', async () => {
  await p.goto(`${WEB}/inventario?vista=movimientos`, { waitUntil: 'networkidle' });
  await p.getByRole('link', { name: /^Pedido PED-/ }).first().waitFor(T);
});
await step('a técnico reads the inventory without actions', async () => {
  await tec.page.goto(`${WEB}/inventario`, { waitUntil: 'networkidle' });
  await row(tec.page).waitFor(T);
  if (await tec.page.getByRole('button', { name: 'Nuevo producto' }).count()) throw new Error('técnico sees Nuevo producto');
  if (await tec.page.getByRole('button', { name: `Acciones de ${code}` }).count()) throw new Error('técnico sees row actions');
});

await browser.close();
console.table(steps);
const errors = all.flat();
if (errors.length) console.log('API/page errors:', errors);
process.exit(failed || errors.length ? 1 : 0);
