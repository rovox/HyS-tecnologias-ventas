import { accessSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const distIndex = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'index.html');

try {
  accessSync(distIndex);
  console.log('pre-built dist present; skipping vite (Hostinger cannot execute esbuild)');
} catch {
  console.error(`Missing ${distIndex}. Build locally with: pnpm --filter web build`);
  process.exit(1);
}
