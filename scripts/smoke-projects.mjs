#!/usr/bin/env node
// Browser smoke for projects (PRO-01): an approved quotation opens its project → payment → new job → execution →
// delivered (warranty) → closing blocked by the balance → last payment → closed; a second session follows the list.
//
//   node scripts/smoke-projects.mjs [--web http://localhost:3000] [--api http://localhost:3001/api] [--shots dir]
//
// Creates its own approved quotation through the API. Exit code 1 when a step fails or the API answers 4xx/5xx
// (the expected 400s of closing with a balance and of a payment above it are allowed).

import { ROLE_ACCOUNTS, credentialsFor } from '../config/users.js';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const WEB = args.web ?? 'http://localhost:3000';
const API = args.api ?? 'http://localhost:3001/api';
const SHOTS = args.shots;
const T = { timeout: 8000 };

async function login() {
  const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(credentialsFor(ROLE_ACCOUNTS.ventas)) });
  return res.json();
}
async function api(token, method, path, body, isForm) {
  const res = await fetch(`${API}/${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, ...(isForm ? {} : { 'content-type': 'application/json' }) },
    body: isForm ? body : body && JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

const setup = await login();
const title = `Smoke proyecto ${Date.now()}`;
const quote = await api(setup.accessToken, 'POST', 'quotations', { titulo: title, categoriaId: 'cableado_estructurado', clienteId: 'cli_hospital', sucursalId: 'suc_central', monto: 3000 });
const form = new FormData();
form.append('file', new Blob(['%PDF-1.4 smoke'], { type: 'application/pdf' }), 'c.pdf');
await api(setup.accessToken, 'POST', `quotations/${quote.id}/files`, form, true);
await api(setup.accessToken, 'POST', `quotations/${quote.id}/status`, { estado: 'enviado' });
const approved = await api(setup.accessToken, 'POST', `quotations/${quote.id}/status`, { estado: 'aprobado' });

const { chromium } = await import('@playwright/test');
const browser = await chromium.launch();
async function session() {
  const l = await login();
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await context.addInitScript(([t, u]) => { localStorage.setItem('hs_token', t); localStorage.setItem('hs_user', u); }, [l.accessToken, JSON.stringify(l.user)]);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror ${e.message}`));
  page.on('response', (r) => {
    const expected = r.status() === 400 && (r.url().endsWith('/estado') || r.url().endsWith('/cobros'));
    if (r.url().startsWith(API) && r.status() >= 400 && !expected) errors.push(`${r.status()} ${r.request().method()} ${r.url().replace(API, '')}`);
  });
  return { page, errors };
}
const A = await session();
const B = await session();
const p = A.page;
const steps = [];
let failed = false;
async function step(name, fn) {
  if (failed) return steps.push({ step: name, ok: 'skipped' });
  try { await fn(); steps.push({ step: name, ok: true }); } catch (e) {
    failed = true;
    steps.push({ step: name, ok: false, error: e.message.split('\n')[0] });
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/smoke-projects-fail.png`, fullPage: true });
  }
}
async function confirmWith(label, reason) {
  const dialog = p.getByRole('dialog');
  if (reason) await dialog.locator('textarea').fill(reason);
  await dialog.getByRole('button', { name: label, exact: true }).click(T);
  await dialog.waitFor({ state: 'hidden', ...T });
}
const saldoOf = async (page) => page.getByText('Saldo pendiente', { exact: true }).locator('..').innerText();

await B.page.goto(`${WEB}/projects`, { waitUntil: 'networkidle' });
await step('open the project from the approved quotation', async () => {
  await p.goto(`${WEB}/quotations/${quote.id}`, { waitUntil: 'networkidle' });
  await p.getByText(approved.project?.codigo || /^PRY-/).first().click(T);
  await p.waitForURL(/\/projects\//, T);
  await p.getByText('Planificado').first().waitFor(T);
});
await step('the other session lists the project', () => B.page.getByText(title).first().waitFor({ timeout: 3000 }));
await step('register an advance', async () => {
  await p.getByRole('button', { name: 'Registrar cobro' }).click(T);
  await p.getByRole('radio', { name: 'Adelanto' }).click(T);
  await p.getByLabel('Monto (Bs) *').fill('1000');
  await p.getByRole('dialog').getByRole('button', { name: 'Registrar' }).click(T);
  await p.getByText('Cobro de Bs 1,000.00 registrado').waitFor(T);
  if (!(await saldoOf(p)).includes('2,000.00')) throw new Error(`saldo: ${await saldoOf(p)}`);
});
await step('a payment above the balance is refused by the API, with the reason', async () => {
  await p.getByRole('button', { name: 'Registrar cobro' }).click(T);
  await p.getByLabel('Monto (Bs) *').fill('5000');
  await p.getByRole('dialog').getByRole('button', { name: 'Registrar' }).click(T);
  await p.getByText(/supera el saldo pendiente/).first().waitFor(T);
  await p.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click(T);
  if (!(await saldoOf(p)).includes('2,000.00')) throw new Error(`saldo changed: ${await saldoOf(p)}`);
});
await step('add a job to the cronograma', async () => {
  await p.getByRole('button', { name: 'Nuevo trabajo' }).click(T);
  await p.getByLabel('Trabajo *').fill('Certificación Fluke');
  await p.getByLabel('Fecha *').fill('2026-11-20');
  await p.getByRole('dialog').getByRole('button', { name: 'Agregar' }).click(T);
  await p.getByText('Trabajo agregado al cronograma').waitFor(T);
  await p.getByRole('tab', { name: 'Trabajos (2)' }).waitFor(T);
});
await step('start; delivering is refused while jobs are pending', async () => {
  await p.getByRole('button', { name: 'Iniciar ejecución' }).click(T);
  await confirmWith('Confirmar');
  await p.getByRole('button', { name: 'Marcar entregado' }).click(T);
  await confirmWith('Marcar entregado');
  await p.getByText(/Termina o cancela los trabajos pendientes/).waitFor(T);
});
await step('jobs finished in the cronograma, then deliver (warranty starts)', async () => {
  const project = await api(setup.accessToken, 'GET', `projects/${approved.proyectoId ?? approved.project?.id}`);
  for (const job of project.trabajos) {
    await api(setup.accessToken, 'PATCH', `schedules/${job.id}`, { estado: 'en_proceso' });
    await api(setup.accessToken, 'PATCH', `schedules/${job.id}`, { estado: 'terminado' });
  }
  await p.getByRole('cell', { name: 'Terminado' }).first().waitFor(T);
  await p.getByRole('button', { name: 'Marcar entregado' }).click(T);
  await confirmWith('Marcar entregado');
  await p.getByText('Proyecto entregado: empieza la garantía').waitFor(T);
  await p.getByText(/hasta \d{2} \w+\.? \d{4}/).first().waitFor(T);
});
await step('closing with a balance is refused with the reason', async () => {
  await p.getByRole('button', { name: 'Cerrar', exact: true }).click(T);
  await confirmWith('Cerrar proyecto');
  await p.getByText(/No se cierra un proyecto con saldo pendiente/).waitFor(T);
});
await step('pay the rest and close', async () => {
  await p.getByRole('button', { name: 'Registrar cobro' }).click(T);
  await p.getByLabel('Monto (Bs) *').fill('2000');
  await p.getByRole('dialog').getByRole('button', { name: 'Registrar' }).click(T);
  await p.getByText('Cobro de Bs 2,000.00 registrado').waitFor(T);
  await p.getByRole('button', { name: 'Cerrar', exact: true }).click(T);
  await confirmWith('Cerrar proyecto');
  await p.getByText('Proyecto cerrado').waitFor(T);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/project-closed.png`, fullPage: true });
});
await step('the other session shows it closed without reload', () =>
  B.page.locator('tr', { hasText: title }).getByText('Cerrado').waitFor({ timeout: 3000 }));

await browser.close();
console.table(steps);
const errors = [...A.errors, ...B.errors];
if (errors.length) console.log('API/page errors:', errors);
process.exit(failed || errors.length ? 1 : 0);
