#!/usr/bin/env node
// S2/S3/S8 browser smoke for quotations (QUO-02): create → PDF → send → reject (reason) → reopen → delete (reason) →
// restore → send → approve, with a second session that must see the changes without reloading.
//
//   node scripts/smoke-quotations.mjs [--web http://localhost:3000] [--api http://localhost:3001/api] [--shots dir]
//
// Needs the local stack and @playwright/test (Chromium). Exit code 1 when a step fails or the API answers 4xx/5xx.

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

async function session() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(credentialsFor(ROLE_ACCOUNTS.ventas)),
  });
  const login = await res.json();
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await context.addInitScript(([t, u]) => {
    localStorage.setItem('hs_token', t);
    localStorage.setItem('hs_user', u);
  }, [login.accessToken, JSON.stringify(login.user)]);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror ${e.message}`));
  page.on('response', (r) => {
    if (r.url().startsWith(API) && r.status() >= 400) errors.push(`${r.status()} ${r.request().method()} ${r.url().replace(API, '')}`);
  });
  return { page, errors };
}

const A = await session();
const B = await session();
const p = A.page;
const title = `Smoke cotización ${Date.now()}`;
const steps = [];
let failed = false;
async function step(name, fn) {
  if (failed) return steps.push({ step: name, ok: 'skipped' });
  try {
    await fn();
    steps.push({ step: name, ok: true });
  } catch (e) {
    failed = true;
    steps.push({ step: name, ok: false, error: e.message.split('\n')[0] });
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/smoke-quotations-fail.png`, fullPage: true });
  }
}
async function confirmWith(label, reason) {
  const dialog = p.getByRole('dialog');
  const button = dialog.getByRole('button', { name: label, exact: true });
  if (reason) {
    if (!(await button.isDisabled())) throw new Error(`"${label}" is enabled without a reason`);
    await dialog.locator('textarea').fill(reason);
  }
  await button.click(T);
  await dialog.waitFor({ state: 'hidden', ...T });
}
const action = (name) => p.getByRole('button', { name, exact: true }).first().click(T);

await B.page.goto(`${WEB}/quotations`, { waitUntil: 'networkidle' });
await p.goto(`${WEB}/quotations`, { waitUntil: 'networkidle' });

await step('create a draft from the form', async () => {
  await p.getByRole('button', { name: 'Nueva', exact: true }).click(T);
  await p.getByLabel('Título *').fill(title);
  await p.getByRole('combobox').filter({ hasText: 'Selecciona un cliente' }).click(T);
  await p.getByPlaceholder('Buscar cliente…').fill('Andina');
  await p.getByRole('option', { name: 'Comercial Andina SRL' }).click(T);
  await p.getByRole('radio', { name: 'Seguridad electrónica' }).click(T);
  await p.getByLabel('Monto (Bs) *').fill('2500');
  await p.getByRole('button', { name: 'Guardar borrador' }).click(T);
  await p.waitForURL(/\/quotations\/[0-9a-f-]{36}$/, T);
  await p.getByText('Borrador guardado').waitFor(T);
});
await step('the other session lists it without reload', () => B.page.getByText(title).first().waitFor({ timeout: 3000 }));
await step('attach the PDF', async () => {
  await p.getByRole('button', { name: 'Adjuntar PDF' }).waitFor(T);
  await p.waitForLoadState('networkidle');
  await p.locator('input[type=file][accept="application/pdf"]').setInputFiles({ name: 'cot.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 smoke') });
  await p.getByText('PDF adjuntado').waitFor(T);
});
await step('send (confirmation)', async () => {
  await action('Enviar');
  await confirmWith('Enviar');
  await p.getByText('Vence', { exact: true }).waitFor(T);
});
await step('reject needs a reason', async () => {
  await action('Rechazar');
  await confirmWith('Rechazar', 'Precio alto');
  await p.getByText('Motivo del rechazo: Precio alto').waitFor(T);
});
await step('reopen', async () => {
  await action('Reabrir');
  await confirmWith('Reabrir');
  await p.getByText('Cotización reabierta').waitFor(T);
});
await step('delete with a reason, then restore', async () => {
  await action('Eliminar');
  await confirmWith('Eliminar', 'Duplicada');
  await p.getByText(/Motivo: Duplicada/).waitFor(T);
  await action('Restaurar');
  await confirmWith('Restaurar');
  await p.getByText('Cotización restaurada').waitFor(T);
});
await step('send and approve → project', async () => {
  await action('Enviar');
  await confirmWith('Enviar');
  await action('Aprobar');
  await confirmWith('Aprobar y crear proyecto');
  await p.getByText('Cotización aprobada: proyecto creado').waitFor(T);
  if (await p.getByRole('button', { name: 'Eliminar' }).count()) throw new Error('an approved quotation can still be deleted');
});
await step('history lists the changes', () => p.getByText('cambió el estado').first().waitFor(T));
await step('the other session no longer lists it in Cotizaciones', () => B.page.getByText(title).first().waitFor({ state: 'detached', timeout: 3000 }));
await step('it is in Cerradas', async () => {
  await p.goto(`${WEB}/quotations?vista=cerradas`, { waitUntil: 'networkidle' });
  await p.getByText(title).first().waitFor(T);
});

await browser.close();
console.table(steps);
const errors = [...A.errors, ...B.errors];
if (errors.length) console.log('API/page errors:', errors);
process.exit(failed || errors.length ? 1 : 0);
