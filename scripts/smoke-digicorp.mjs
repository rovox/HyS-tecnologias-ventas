#!/usr/bin/env node
// Browser smoke for Inventario › Tienda Digicorp (DIGI-01), as ventas: the saved catalog shows with photos and the
// date of the last update; search narrows it; a brand filter works; opening a product fetches its detail on demand
// (one request to Digicorp) and links to its page. Needs the catalog loaded once ("Actualizar ahora" as Gerencia).
//
//   node scripts/smoke-digicorp.mjs [--web http://localhost:3000] [--api http://localhost:3001/api] [--shots dir]
//
// Exit code 1 when a step fails or the API answers 4xx/5xx.

import { ROLE_ACCOUNTS, credentialsFor } from '../config/users.js';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const WEB = args.web ?? 'http://localhost:3000';
const API = args.api ?? 'http://localhost:3001/api';
const SHOTS = args.shots;
const T = { timeout: 15000 };

const { chromium } = await import('@playwright/test');
const browser = await chromium.launch();
const errors = [];
const login = await (await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(credentialsFor(ROLE_ACCOUNTS.ventas)) })).json();
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
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/smoke-digicorp.png`, fullPage: true });
  }
}
const cards = () => p.locator('ul li button');

await step('the catalog shows with photos and the date of the last update', async () => {
  await p.goto(`${WEB}/inventario?vista=digicorp`, { waitUntil: 'networkidle' });
  await p.getByText(/^Actualizado: .* productos/).waitFor(T);
  await cards().first().waitFor(T);
  if ((await cards().count()) < 10) throw new Error('fewer than 10 products shown');
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/digicorp.png` });
});
await step('search and brand narrow the catalog', async () => {
  await p.getByLabel('Buscar en Digicorp').fill('camara');
  await p.waitForResponse((r) => r.url().includes('/digicorp/productos?') && r.url().includes('q=camara'), T);
  await p.waitForTimeout(300);
  const first = await cards().first().innerText();
  if (!/c[aá]mara/i.test(first)) throw new Error(`first result: ${first}`);
  const brand = (await p.getByLabel('Marca').locator('option').nth(1).innerText()).replace(/ \(\d+\)$/, '');
  await p.getByLabel('Buscar en Digicorp').fill('');
  await p.getByLabel('Marca').selectOption({ index: 1 });
  await p.waitForResponse((r) => r.url().includes('/digicorp/productos?') && r.url().includes('marca='), T);
  await p.waitForTimeout(300);
  const texts = await cards().allInnerTexts();
  if (!texts.every((t) => t.includes(brand))) throw new Error(`a card is not of ${brand}`);
});
await step('a product opens with its detail and the link to its page in Digicorp', async () => {
  await cards().first().click(T);
  const dlg = p.getByRole('dialog');
  await dlg.getByText(/Stock en Digicorp:/).waitFor(T);
  const href = await dlg.getByRole('link', { name: 'Ver en Digicorp' }).getAttribute('href');
  if (!href?.startsWith('https://digicorp.com.bo/producto/')) throw new Error(`link: ${href}`);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/digicorp-product.png` });
});

await browser.close();
console.table(steps);
if (errors.length) console.log('API/page errors:', errors);
process.exit(failed || errors.length ? 1 : 0);
