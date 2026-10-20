#!/usr/bin/env node
// LOCAL-03: p50/p95 latency of the critical endpoints against the local stack.
//   node scripts/measure-api.mjs [--api http://localhost:3001/api] [--n 200] [--c 5] [--json out.json]
// Local seed data only; reports numbers, enforces no budget (the baseline is recorded in docs/STATUS.md).

import { writeFileSync } from 'node:fs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const API = args.api ?? 'http://localhost:3001/api';
const N = Number(args.n ?? 200);
const C = Number(args.c ?? 5);
const CREDENTIALS = { email: 'julio.admin@demo.hs.local', password: 'julio' };

const post = (path, body, headers = {}) =>
  fetch(`${API}/${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });

const loginRes = await post('auth/login', CREDENTIALS);
if (!loginRes.ok) { console.error(`Login failed: HTTP ${loginRes.status}`); process.exit(2); }
const auth = { authorization: `Bearer ${(await loginRes.json()).accessToken}` };

const targets = [
  ['GET /clients', () => fetch(`${API}/clients`, { headers: auth })],
  ['GET /quotations', () => fetch(`${API}/quotations`, { headers: auth })],
  ['GET /schedules', () => fetch(`${API}/schedules`, { headers: auth })],
  ['GET /metrics/sales', () => fetch(`${API}/metrics/sales`, { headers: auth })],
  ['POST /auth/login', () => post('auth/login', CREDENTIALS)],
];

const pct = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
const results = [];
for (const [name, call] of targets) {
  const times = [];
  const statuses = new Map();
  let next = 0;
  await Promise.all(Array.from({ length: C }, async () => {
    while (next++ < N) {
      const t0 = performance.now();
      const res = await call();
      await res.arrayBuffer();
      times.push(performance.now() - t0);
      statuses.set(res.status, (statuses.get(res.status) ?? 0) + 1);
    }
  }));
  times.sort((a, b) => a - b);
  results.push({ endpoint: name, n: times.length, p50: Math.round(pct(times, 50)), p95: Math.round(pct(times, 95)), statuses: Object.fromEntries(statuses) });
}

console.log('endpoint | n | p50 ms | p95 ms | statuses');
for (const r of results) console.log(`${r.endpoint} | ${r.n} | ${r.p50} | ${r.p95} | ${JSON.stringify(r.statuses)}`);
if (args.json) writeFileSync(args.json, JSON.stringify(results, null, 2));
process.exit(results.some((r) => Object.keys(r.statuses).some((s) => Number(s) >= 400 && !(r.endpoint === 'POST /auth/login' && s === '429'))) ? 1 : 0);
