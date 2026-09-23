/**
 * Hostinger entry launcher (same pattern as apps/web/serve-dist.mjs).
 * Ensures Node runs dist/main.js with apps/api as cwd.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const main = path.join(root, 'dist', 'main.js');

const child = spawn(process.execPath, [main], {
  cwd: root,
  env: process.env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
