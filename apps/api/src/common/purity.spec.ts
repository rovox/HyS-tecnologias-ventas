import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

// Business rules live in `domain/` folders (each module's, plus `common/domain` and `common/policy/policy.ts`) as plain
// TypeScript: no framework or ORM imports, and relative imports only into another `domain/` folder.
const SRC = resolve(__dirname, '..');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const isDomain = (p: string) => p.split(sep).includes('domain');
const files = walk(SRC)
  .filter((f) => f.endsWith('.ts') && !f.endsWith('.spec.ts'))
  .filter((f) => isDomain(relative(SRC, f)) || relative(SRC, f) === join('common', 'policy', 'policy.ts'))
  .map((f) => relative(SRC, f));

describe('domain purity', () => {
  it('finds the domain files', () => expect(files.length).toBeGreaterThan(3));

  it.each(files)('%s imports neither Nest nor Prisma, nor code outside domain/', (file) => {
    const src = readFileSync(join(SRC, file), 'utf8');
    expect(src).not.toMatch(/from ['"]@(nestjs|prisma)\//);
    for (const [, spec] of src.matchAll(/from ['"](\.{1,2}\/[^'"]+)['"]/g)) {
      expect(isDomain(relative(SRC, resolve(dirname(join(SRC, file)), spec)))).toBe(true);
    }
  });
});
