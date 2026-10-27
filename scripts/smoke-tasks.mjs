#!/usr/bin/env node
// Browser smoke for the tasks of Cotizaciones (TSK-03), two live sessions: ventas creates a task without anyone in
// charge (red counter) → Gerencia takes it with "Tomar" (the red counter drops live for ventas) → Gerencia hands it to
// ventas with a deadline (pencil) → ventas completes it with the green button: it leaves the list and shows under
// "Archivadas", where it can be reopened; with no tasks of his own, ventas' counter is green.
//
//   node scripts/smoke-tasks.mjs [--web http://localhost:3000] [--api http://localhost:3001/api] [--shots dir]
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
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await context.addInitScript(([t, u]) => { localStorage.setItem('hs_token', t); localStorage.setItem('hs_user', u); }, [login.accessToken, JSON.stringify(login.user)]);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`${role} pageerror ${e.message}`));
  page.on('response', (r) => { if (r.url().startsWith(API) && r.status() >= 400) errors.push(`${role} ${r.status()} ${r.request().method()} ${r.url().replace(API, '')}`); });
  all.push(errors);
  return { page, token: login.accessToken, user: login.user };
}
const ventas = await session('ventas');
const admin = await session('admin');
const steps = [];
let failed = false;
async function step(name, fn) {
  if (failed) return steps.push({ step: name, ok: 'skipped' });
  try { await fn(); steps.push({ step: name, ok: true }); } catch (e) {
    failed = true;
    steps.push({ step: name, ok: false, error: e.message.split('\n')[0] });
    if (SHOTS) for (const [n, s] of Object.entries({ ventas, admin })) await s.page.screenshot({ path: `${SHOTS}/smoke-tasks-${n}.png`, fullPage: true });
  }
}
const summary = async (s) => (await fetch(`${API}/tasks/resumen`, { headers: { authorization: `Bearer ${s.token}` } })).json();
const title = `Llamar a la clínica ${Date.now()}`;
const panel = (s) => s.page.getByRole('dialog');
const task = (s) => panel(s).locator('li', { hasText: title });
async function openTasks(s) {
  await s.page.goto(`${WEB}/quotations`, { waitUntil: 'networkidle' });
  await s.page.getByRole('button', { name: /^Tareas:/ }).click(T);
  await panel(s).getByText(/sin responsable/).first().waitFor(T);
}
// Start from a known state: nothing assigned to ventas (earlier runs may have left tasks).
const ventasOwn = (await (await fetch(`${API}/tasks`, { headers: { authorization: `Bearer ${ventas.token}` } })).json()).filter((t) => t.asignado?.id === ventas.user.id);
for (const t of ventasOwn) await fetch(`${API}/tasks/${t.id}`, { method: 'PATCH', headers: { authorization: `Bearer ${ventas.token}`, 'content-type': 'application/json' }, body: JSON.stringify({ estado: 'completada' }) });

await step('with no tasks of his own, ventas sees a green ✓; a task without anyone in charge raises the red counter', async () => {
  await openTasks(ventas);
  await panel(ventas).getByText('✓ Sin tareas pendientes').waitFor(T);
  const before = (await summary(ventas)).sinAsignar;
  await panel(ventas).getByLabel('Nueva tarea').fill(title);
  await panel(ventas).getByRole('button', { name: 'Agregar tarea' }).click(T);
  await ventas.page.getByText('Tarea creada').waitFor(T);
  await panel(ventas).getByText(`${before + 1} sin responsable`).waitFor(T);
  await task(ventas).getByText('Sin responsable').waitFor(T);
  if (SHOTS) await ventas.page.screenshot({ path: `${SHOTS}/tasks-panel.png` });
});
await step('Gerencia takes it with "Tomar"; the red counter drops live for ventas', async () => {
  const before = (await summary(ventas)).sinAsignar;
  await openTasks(admin);
  await task(admin).getByRole('button', { name: 'Tomar' }).click(T);
  await admin.page.getByText('Tarea tomada: ahora es tuya').waitFor(T);
  await panel(ventas).getByText(`${before - 1} sin responsable`).waitFor({ timeout: 4000 });
});
await step('Gerencia hands it to ventas with a deadline (pencil); ventas sees it as his, live', async () => {
  await task(admin).getByRole('button', { name: 'Responsable y plazo' }).click(T);
  await task(admin).getByRole('combobox', { name: 'Responsable' }).click(T);
  await admin.page.getByPlaceholder('Buscar…').fill(ventas.user.name);
  await admin.page.getByRole('option', { name: ventas.user.name }).click(T);
  await task(admin).getByLabel('Plazo', { exact: true }).fill('2026-12-31');
  await task(admin).getByRole('button', { name: 'Guardar' }).click(T);
  await admin.page.getByText('Tarea actualizada').waitFor(T);
  await panel(ventas).getByText(/^1 mías/).waitFor({ timeout: 4000 });
  await task(ventas).getByText('31 dic 2026').waitFor(T);
});
await step('ventas completes it with the green button: it leaves the list, his counter turns green', async () => {
  await task(ventas).getByRole('button', { name: `Completar ${title}` }).click(T);
  await ventas.page.getByText(`Completada: ${title}`).waitFor(T);
  await task(ventas).waitFor({ state: 'detached', ...T });
  await panel(ventas).getByText('✓ Sin tareas pendientes').waitFor(T);
});
await step('it shows under "Archivadas" and can be reopened', async () => {
  await panel(ventas).getByRole('button', { name: 'Archivadas (30 días)' }).click(T);
  await task(ventas).getByText(/^Completada el /).waitFor(T);
  if (SHOTS) await ventas.page.screenshot({ path: `${SHOTS}/tasks-archived.png` });
  await task(ventas).getByRole('button', { name: 'Reabrir' }).click(T);
  await ventas.page.getByText('Tarea reabierta').waitFor(T);
  await panel(ventas).getByRole('button', { name: 'Pendientes' }).click(T);
  await task(ventas).getByRole('button', { name: `Completar ${title}` }).click(T);
  await task(ventas).waitFor({ state: 'detached', ...T });
});

await browser.close();
console.table(steps);
const errors = all.flat();
if (errors.length) console.log('API/page errors:', errors);
process.exit(failed || errors.length ? 1 : 0);
