#!/usr/bin/env node
// LOCAL-03: bundle budget for apps/web/dist (run `pnpm --filter @hs-erp/web build` first).
//   node scripts/measure-bundle.mjs [--json out.json]
// Budgets (docs/rules/performance.md, raw bytes / 1000): entry JS (index + shell/Layout) <= 300 kB,
// any route chunk <= 100 kB, CSS <= 60 kB. Entry = index.html script chain plus the shell, i.e. the chunks
// at least half of the lazy routes statically import (Layout). A route chunk = the lazy chunk's own file.
// Exit code 1 when over budget.

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = process.env.BUNDLE_DIST ?? path.join(ROOT, 'apps/web/dist');
const BUDGET = { entryJsKb: 300, routeChunkKb: 100, cssKb: 60 };

let html;
try {
  html = readFileSync(path.join(DIST, 'index.html'), 'utf8');
} catch {
  console.error(`No build found at ${DIST}. Run: pnpm --filter @hs-erp/web build`);
  process.exit(2);
}

const kb = (bytes) => Math.round((bytes / 1000) * 10) / 10;
const size = (file) => statSync(path.join(DIST, file)).size;
const clean = (href) => href.replace(/^\.?\//, '');

// Static import closure of a chunk (`from"./x.js"`); dynamic `import("./x.js")` chunks are lazy.
const staticImports = (file) => {
  const src = readFileSync(path.join(DIST, file), 'utf8');
  return [...src.matchAll(/(?:^|[;}\s])(?:import|export)[^'"()]*?from\s*["']\.\/([^"']+\.js)["']/g)]
    .map((m) => path.posix.join(path.posix.dirname(file), m[1]));
};
const dynamicImports = (file) => [...readFileSync(path.join(DIST, file), 'utf8').matchAll(/import\(\s*["']\.\/([^"']+\.js)["']\s*\)/g)]
  .map((m) => path.posix.join(path.posix.dirname(file), m[1]));
const closure = (roots) => {
  const seen = new Set();
  const queue = [...roots];
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    queue.push(...staticImports(file));
  }
  return seen;
};

const roots = [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((m) => clean(m[1]));
roots.push(...[...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)].map((m) => clean(m[1])));
const entryJs = closure(roots);
// Route chunks = lazy chunks referenced from the entry chain.
const routeChunks = [...new Set([...entryJs].flatMap(dynamicImports))];
const totalKb = (files) => kb([...files].reduce((n, f) => n + size(f), 0));
// Shell = the Layout chunk and what it statically imports (docs/rules/performance.md: entry JS = `index` + `Layout`).
// Chunks shared by many pages but not by Layout (dialogs, menus) are route weight, not shell: they load with the page
// that uses them (GATE-01, 2026-10-27; it used to be "imported by half of the routes", which counted them as shell).
const layoutChunks = readdirSync(path.join(DIST, 'assets')).filter((f) => /^Layout-[^/]+\.js$/.test(f)).map((f) => `assets/${f}`);
if (!layoutChunks.length) throw new Error('No Layout chunk in the build: the shell cannot be measured');
const shell = new Set();
for (const f of closure(layoutChunks)) if (!entryJs.has(f)) shell.add(f);
const routes = routeChunks.filter((c) => !shell.has(c)).map((chunk) => ({ chunk, kb: kb(size(chunk)) })).sort((a, b) => b.kb - a.kb);

const css = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map((m) => clean(m[1]));
const entryOnlyKb = totalKb(entryJs);
const entryKb = totalKb(new Set([...entryJs, ...shell]));
const cssKb = kb(css.reduce((n, f) => n + size(f), 0));

const allJs = readdirSync(path.join(DIST, 'assets')).filter((f) => f.endsWith('.js'))
  .map((f) => ({ file: `assets/${f}`, kb: kb(size(`assets/${f}`)) })).sort((a, b) => b.kb - a.kb);

const result = {
  entryJsKb: entryKb, indexChainKb: entryOnlyKb, shell: [...shell].map((f) => ({ file: f, kb: kb(size(f)) })),
  cssKb, budget: BUDGET, largestRouteChunks: routes.slice(0, 5),
  entryFiles: [...entryJs].map((f) => ({ file: f, kb: kb(size(f)) })),
  largestChunks: allJs.slice(0, 5),
  overRouteChunks: routes.filter((r) => r.kb > BUDGET.routeChunkKb),
  ok: entryKb <= BUDGET.entryJsKb && cssKb <= BUDGET.cssKb && routes.every((r) => r.kb <= BUDGET.routeChunkKb),
};

console.log(`entry JS (index + shell) : ${entryKb} kB (budget ${BUDGET.entryJsKb})  ${entryKb <= BUDGET.entryJsKb ? 'ok' : 'OVER'}`);
console.log(`  index chain ${entryOnlyKb} kB; shell: ${result.shell.map((f) => `${f.file} ${f.kb} kB`).join(', ') || 'none'}`);
console.log(`route chunks over ${BUDGET.routeChunkKb} kB : ${result.overRouteChunks.length} of ${routes.length}`);
for (const r of result.largestRouteChunks) console.log(`  route ${r.chunk} ${r.kb} kB ${r.kb > BUDGET.routeChunkKb ? 'OVER' : ''}`);
console.log(`CSS      : ${cssKb} kB (budget ${BUDGET.cssKb})  ${cssKb <= BUDGET.cssKb ? 'ok' : 'OVER'}`);
for (const f of result.largestChunks) console.log(`  chunk ${f.file} ${f.kb} kB`);
const json = process.argv.indexOf('--json');
if (json > 0) writeFileSync(process.argv[json + 1], JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
