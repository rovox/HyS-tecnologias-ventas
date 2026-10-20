#!/usr/bin/env node
// LOCAL-04 promotion gate: nothing is built for staging or Hostinger unless LOCAL-01..03 are green.
//   node scripts/promote-gate.mjs [--skip-lighthouse]
// Runs, in order, and stops at the first failure:
//   LOCAL-01  docker compose ps: db, api, web all healthy
//   LOCAL-02  Playwright suite against the local stack (`pnpm local:test`)
//   LOCAL-03  bundle budget (`pnpm local:bundle`)
// CI connects this job before any deploy job at the end of Phase 3 (not wired yet).

import { execSync } from 'node:child_process';

const steps = [
  ['LOCAL-01 stack healthy', () => {
    const rows = execSync('docker compose ps --format json', { encoding: 'utf8' })
      .trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
    const bad = ['db', 'api', 'web'].filter((s) => rows.find((r) => r.Service === s)?.Health !== 'healthy');
    if (bad.length) throw new Error(`not healthy: ${bad.join(', ')} (run: pnpm local:up)`);
  }],
  ['LOCAL-02 playwright', () => execSync('pnpm local:test', { stdio: 'inherit' })],
  ['LOCAL-03 bundle budget', () => execSync('pnpm local:bundle', { stdio: 'inherit' })],
];

for (const [name, run] of steps) {
  try {
    run();
    console.log(`PASS ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}: ${e.message.split('\n')[0]}`);
    console.error('Promotion blocked.');
    process.exit(1);
  }
}
console.log('Promotion gate green.');
