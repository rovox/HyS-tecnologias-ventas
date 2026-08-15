/**
 * Hostinger pnpm hardlinks esbuild without +x (or the hbuilds mount is noexec).
 * Chmod in place; if spawn still EACCES, copy the native binary to /tmp and print that path.
 * stdout = ESBUILD_BINARY_PATH (may be empty if in-place bin already runs). stderr = logs.
 */
import { chmodSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function canRun(bin) {
  const result = spawnSync(bin, ['--version'], { encoding: 'utf8' });
  return result.status === 0 && Boolean(result.stdout);
}

function chmodQuiet(file) {
  try {
    chmodSync(file, 0o755);
  } catch {
    // Hostinger may deny chmod on the virtual store; /tmp copy is the fallback.
  }
}

function existingBins() {
  const bins = [];
  try {
    bins.push(path.join(path.dirname(require.resolve('esbuild/package.json')), 'bin', 'esbuild'));
  } catch {
    // esbuild not resolvable from this cwd
  }
  try {
    const platformPkg = `@esbuild/${process.platform}-${process.arch}`;
    bins.push(path.join(path.dirname(require.resolve(`${platformPkg}/package.json`)), 'bin', 'esbuild'));
  } catch {
    // optional platform package not installed
  }
  return [...new Set(bins.filter((file) => existsSync(file)))];
}

const bins = existingBins();
if (bins.length === 0) {
  process.stderr.write('ensure-esbuild-bin: no esbuild binary found; vite will fail if it needs one\n');
  process.exit(0);
}

for (const bin of bins) {
  chmodQuiet(bin);
  if (canRun(bin)) {
    process.exit(0);
  }
}

const source = bins[bins.length - 1];
const destDir = path.join(tmpdir(), 'hs-esbuild');
mkdirSync(destDir, { recursive: true });
const dest = path.join(destDir, 'esbuild');
copyFileSync(source, dest);
chmodQuiet(dest);
if (!canRun(dest)) {
  process.stderr.write(`ensure-esbuild-bin: cannot execute ${dest} (EACCES/noexec). Hostinger blocked native binaries.\n`);
  process.exit(1);
}
process.stdout.write(dest);
