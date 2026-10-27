#!/usr/bin/env node
// Browser smoke for the shared list (LIST-01) on the Libro of finance: the totals are read above the rows, the
// header stays in view while scrolling, columns are hidden and moved and the choice survives a reload, and groups fold
// keeping their subtotal.
//
//   node scripts/smoke-lists.mjs [--web http://localhost:3000] [--api http://localhost:3001/api] [--shots dir]
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
const errors = [];
const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(credentialsFor(ROLE_ACCOUNTS.contabilidad)) });
const login = await res.json();
const context = await browser.newContext({ viewport: { width: 1366, height: 700 } });
await context.addInitScript(([t, u]) => { localStorage.setItem('hs_token', t); localStorage.setItem('hs_user', u); }, [login.accessToken, JSON.stringify(login.user)]);
const page = await context.newPage();
page.on('pageerror', (e) => errors.push(`pageerror ${e.message}`));
page.on('response', (r) => { if (r.url().startsWith(API) && r.status() >= 400) errors.push(`${r.status()} ${r.request().method()} ${r.url().replace(API, '')}`); });

const steps = [];
let failed = false;
async function step(name, fn) {
  if (failed) return steps.push({ step: name, ok: 'skipped' });
  try { await fn(); steps.push({ step: name, ok: true }); } catch (e) {
    failed = true;
    steps.push({ step: name, ok: false, error: e.message.split('\n')[0] });
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/smoke-lists.png`, fullPage: true });
  }
}
const header = (name) => page.getByRole('columnheader', { name, exact: true });

await step('the Libro shows Ingresos, Egresos, Neto and Por validar above the rows', async () => {
  await page.goto(`${WEB}/finanzas?vista=movimientos`, { waitUntil: 'networkidle' });
  for (const label of ['Ingresos', 'Egresos', 'Neto']) await page.getByText(label, { exact: true }).first().waitFor(T);
  await page.getByText(/^Por validar \(\d+\)$/).waitFor(T);
  const summary = await page.getByText('Neto', { exact: true }).first().boundingBox();
  const table = await page.locator('table').first().boundingBox();
  if (!(summary.y < table.y)) throw new Error('the summary is not above the table');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/lists-summary.png` });
});
await step('the header stays in view, under the app header, while the page scrolls', async () => {
  await page.evaluate(() => window.scrollTo(0, 900));
  if ((await page.evaluate(() => window.scrollY)) === 0) return; // Too few rows to scroll: nothing to check.
  const [head, appHeader] = [await page.locator('thead').first().boundingBox(), await page.locator('header').first().boundingBox()];
  if (Math.abs(head.y - (appHeader.y + appHeader.height)) > 2) throw new Error(`header not stuck: ${head.y} vs ${appHeader.y + appHeader.height}`);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/lists-sticky.png` });
  await page.evaluate(() => window.scrollTo(0, 0));
});
await step('a hidden column stays hidden after reload, a moved one keeps its place, reset restores both', async () => {
  await header('Concepto').waitFor(T);
  await page.getByRole('button', { name: 'Elegir columnas' }).click(T);
  await page.getByRole('menu').getByLabel('Concepto', { exact: true }).uncheck(T);
  await page.getByRole('button', { name: 'Subir Monto' }).click(T);
  await page.keyboard.press('Escape');
  if (await header('Concepto').count()) throw new Error('Concepto is still shown');
  await page.reload({ waitUntil: 'networkidle' });
  if (await header('Concepto').count()) throw new Error('Concepto came back after reload');
  const names = await page.locator('thead th').allInnerTexts();
  const at = (n) => names.findIndex((t) => t.trim().toLowerCase() === n);
  if (!(at('monto') > -1 && at('monto') < at('estado'))) throw new Error(`Monto did not move: ${names.join(' | ')}`);
  await page.getByRole('button', { name: 'Elegir columnas' }).click(T);
  await page.getByRole('menuitem', { name: 'Volver a las columnas iniciales' }).click(T);
  await header('Concepto').waitFor(T);
});
await step('groups fold and unfold, keeping their subtotal', async () => {
  await page.goto(`${WEB}/finanzas?vista=movimientos&g=concepto`, { waitUntil: 'networkidle' });
  const firstGroup = page.locator('tbody button[aria-expanded]').first();
  await firstGroup.waitFor(T);
  const rowsBefore = await page.locator('tbody tr').count();
  await page.getByRole('button', { name: 'Plegar grupos' }).click(T);
  const rowsFolded = await page.locator('tbody tr').count();
  if (!(rowsFolded < rowsBefore)) throw new Error('folding did not hide rows');
  if ((await page.locator('tbody tr', { hasText: 'Subtotal' }).count()) === 0) throw new Error('subtotals disappeared');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/lists-folded.png` });
  await page.getByRole('button', { name: 'Desplegar grupos' }).click(T);
  if ((await page.locator('tbody tr').count()) !== rowsBefore) throw new Error('not every group unfolded');
  await firstGroup.click(T);
  if ((await firstGroup.getAttribute('aria-expanded')) !== 'false') throw new Error('one group did not fold on its own');
});

await browser.close();
console.table(steps);
if (errors.length) console.log('API/page errors:', errors);
process.exit(failed || errors.length ? 1 : 0);
