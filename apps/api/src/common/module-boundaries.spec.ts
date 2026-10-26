import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

// Modular monolith: a module imports only common/ and another module's public `index.ts`; common/ never imports a module.
const SRC = resolve(__dirname, '..');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const files = walk(SRC)
  .filter((f) => f.endsWith('.ts'))
  .map((f) => relative(SRC, f))
  .filter((f) => f.startsWith(`modules${sep}`) || f.startsWith(`common${sep}`));

/** `modules/<name>` of a path under src, or null. */
const moduleOf = (p: string) => (p.startsWith(`modules${sep}`) ? p.split(sep)[1] : null);

function violations(file: string): string[] {
  const src = readFileSync(join(SRC, file), 'utf8');
  const own = moduleOf(file);
  const out: string[] = [];
  for (const [, spec] of src.matchAll(/from ['"](\.{1,2}\/[^'"]+)['"]/g)) {
    const target = relative(SRC, resolve(dirname(join(SRC, file)), spec));
    const other = moduleOf(target);
    if (!other || other === own) continue;
    if (!own) out.push(`common imports module ${other}`);
    else if (target !== join('modules', other) && target !== join('modules', other, 'index')) {
      out.push(`${spec} (use ../${other})`);
    }
  }
  return out;
}

describe('module boundaries', () => {
  it.each(files)('%s', (file) => expect(violations(file)).toEqual([]));
});
