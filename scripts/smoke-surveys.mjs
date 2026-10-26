#!/usr/bin/env node
// Browser smoke for relevamientos y asistencias (SUR-02): ventas registers an asistencia with its form data → the técnico
// sees it live on his phone, goes, attends, adds a photo, resolves it and takes the payment → ventas sees it live and
// the form data is still there when editing; a visit is cancelled with a quick reason; the payment is in Finanzas.
//
//   node scripts/smoke-surveys.mjs [--web http://localhost:3000] [--api http://localhost:3001/api] [--shots dir]

import { ROLE_ACCOUNTS, credentialsFor } from '../config/users.js';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const WEB = args.web ?? 'http://localhost:3000';
const API = args.api ?? 'http://localhost:3001/api';
const SHOTS = args.shots;
const T = { timeout: 8000 };
// 1×1 PNG: the evidence photo.
const PHOTO = { name: 'evidencia.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64') };

const { chromium } = await import('@playwright/test');
const browser = await chromium.launch();
async function session(role, viewport = { width: 1366, height: 860 }) {
  const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(credentialsFor(ROLE_ACCOUNTS[role])) });
  const login = await res.json();
  const context = await browser.newContext({ viewport });
  await context.addInitScript(([t, u]) => { localStorage.setItem('hs_token', t); localStorage.setItem('hs_user', u); }, [login.accessToken, JSON.stringify(login.user)]);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`${role} pageerror ${e.message}`));
  page.on('response', (r) => { if (r.url().startsWith(API) && r.status() >= 400) errors.push(`${role} ${r.status()} ${r.request().method()} ${r.url().replace(API, '')}`); });
  return { page, user: login.user, errors };
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
    if (SHOTS) { await ventas.page.screenshot({ path: `${SHOTS}/smoke-surveys-ventas.png`, fullPage: true }); await tec.page.screenshot({ path: `${SHOTS}/smoke-surveys-tec.png`, fullPage: true }); }
  }
}
async function confirmWith(page, label, quickReason) {
  const dialog = page.getByRole('dialog').filter({ hasText: '¿' });
  if (quickReason) await dialog.getByRole('button', { name: quickReason }).click(T);
  await dialog.getByRole('button', { name: label, exact: true }).click(T);
  await dialog.waitFor({ state: 'hidden', ...T });
}
const motivo = `Cámara sin imagen ${Date.now()}`;
const sheet = (page) => page.getByRole('dialog').filter({ hasText: motivo });

await ventas.page.goto(`${WEB}/surveys`, { waitUntil: 'networkidle' });
await tec.page.goto(`${WEB}/surveys`, { waitUntil: 'networkidle' });

await step('ventas registers an asistencia with the form data', async () => {
  const p = ventas.page;
  await p.getByRole('button', { name: 'Nueva visita' }).click(T);
  const dlg = p.getByRole('dialog').filter({ hasText: 'Nueva visita' });
  await dlg.getByRole('radio', { name: 'Asistencia' }).click(T);
  await dlg.getByRole('combobox').filter({ hasText: 'Selecciona un cliente' }).click(T);
  await p.getByPlaceholder('Buscar cliente…').fill('Andina');
  await p.getByRole('option', { name: 'Comercial Andina SRL' }).click(T);
  await dlg.getByLabel('Hora').fill('09:30');
  await dlg.getByLabel(/^Técnico/).click(T);
  await p.getByPlaceholder('Buscar técnico…').fill(tec.user.name);
  await p.getByRole('option', { name: tec.user.name }).click(T);
  await dlg.getByLabel('Motivo').fill(motivo);
  await dlg.getByLabel('Problema que reporta el cliente').fill('La cámara del ingreso no graba desde ayer');
  await dlg.getByLabel('Equipo afectado').fill('Cámara domo ingreso');
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/surveys-form.png` });
  await dlg.getByRole('button', { name: 'Registrar visita' }).click(T);
  await p.getByText('Asistencia registrada').waitFor(T);
  await sheet(p).waitFor(T);
});

await step('the técnico sees it live on his phone and goes', async () => {
  const p = tec.page;
  await p.getByText(motivo).first().click({ timeout: 5000 });
  await sheet(p).getByRole('button', { name: 'Salir a la visita' }).click(T);
  await confirmWith(p, 'Salir a la visita');
  await p.getByText('En camino', { exact: true }).first().waitFor(T);
});

await step('he attends it; resolving waits for a photo', async () => {
  const p = tec.page;
  await sheet(p).getByRole('button', { name: 'Atender' }).click(T);
  await confirmWith(p, 'Atender');
  await sheet(p).getByText('primero agrega una foto de evidencia').waitFor(T);
  if (!(await sheet(p).getByRole('button', { name: 'Resolver' }).isDisabled())) throw new Error('Resolver should wait for a photo');
});

await step('he adds the photo and resolves it', async () => {
  const p = tec.page;
  await sheet(p).getByLabel('Foto de evidencia').setInputFiles(PHOTO);
  await p.getByText('Foto agregada').waitFor(T);
  await sheet(p).getByText('Fotos (1)').waitFor(T);
  await sheet(p).getByRole('button', { name: 'Resolver' }).click(T);
  await confirmWith(p, 'Resolver');
  await p.getByText('Visita resuelta').waitFor(T);
});

await step('he takes the payment (ledger, por validar)', async () => {
  const p = tec.page;
  await sheet(p).getByRole('button', { name: 'Registrar cobro' }).click(T);
  const dlg = p.getByRole('dialog').filter({ hasText: 'Registrar cobro' }).last();
  await dlg.getByLabel('Monto (Bs) *').fill('150');
  await dlg.getByRole('button', { name: 'Registrar cobro' }).click(T);
  await p.getByText('Cobro de la asistencia de Bs 150,00 registrado').waitFor(T);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/surveys-phone.png` });
});

await step('ventas sees it resolved with the payment, without reload', async () => {
  const p = ventas.page;
  await sheet(p).getByText('Resuelto').first().waitFor({ timeout: 4000 });
  await sheet(p).getByText('por rendir').waitFor({ timeout: 4000 });
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/surveys-detail.png` });
});

await step('the form data is kept: ventas edits the visit and finds it', async () => {
  const p = ventas.page;
  await sheet(p).getByRole('button', { name: 'Editar' }).click(T);
  const dlg = p.getByRole('dialog').filter({ hasText: 'Guardar cambios' });
  if ((await dlg.getByLabel('Problema que reporta el cliente').inputValue()) !== 'La cámara del ingreso no graba desde ayer') throw new Error('problemaReportado lost');
  if ((await dlg.getByLabel('Hora').inputValue()) !== '09:30') throw new Error('hora lost');
  await dlg.getByLabel('Observación final').fill('Se recomienda revisar la fuente en 3 meses');
  await dlg.getByRole('button', { name: 'Guardar cambios' }).click(T);
  await p.getByText('Visita actualizada').waitFor(T);
  await sheet(p).getByText('Se recomienda revisar la fuente en 3 meses').first().waitFor(T); // also in the history
});

await step('a visit is cancelled with a quick reason', async () => {
  const p = ventas.page;
  await p.keyboard.press('Escape');
  await p.getByRole('button', { name: 'Nueva visita' }).click(T);
  const dlg = p.getByRole('dialog').filter({ hasText: 'Nueva visita' });
  await dlg.getByRole('combobox').filter({ hasText: 'Selecciona un cliente' }).click(T);
  await p.getByPlaceholder('Buscar cliente…').fill('Andina');
  await p.getByRole('option', { name: 'Comercial Andina SRL' }).click(T);
  await dlg.getByLabel('Necesidad del cliente').fill(`Ampliar cámaras ${motivo}`);
  await dlg.getByRole('button', { name: 'Registrar visita' }).click(T);
  await p.getByText('Relevamiento registrado').waitFor(T);
  const s = p.getByRole('dialog').filter({ hasText: `Ampliar cámaras ${motivo}` });
  await s.getByRole('button', { name: 'Cancelar visita' }).click(T);
  await confirmWith(p, 'Cancelar visita', 'El cliente reprogramó');
  await s.getByText('Cancelada: El cliente reprogramó').waitFor(T);
});

await step('the payment waits in Finanzas as an asistencia', async () => {
  const p = ventas.page;
  await p.goto(`${WEB}/finanzas`, { waitUntil: 'networkidle' });
  await p.getByText('Asistencia').first().waitFor(T);
});

await browser.close();
console.table(steps);
const errors = [...ventas.errors, ...tec.errors];
if (errors.length) console.log('API/page errors:', errors);
process.exit(steps.every((s) => s.ok === true) && !errors.length ? 0 : 1);
