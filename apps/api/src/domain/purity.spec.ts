import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// domain/ holds business rules as plain TypeScript: no framework or ORM imports, so it can be tested and reused alone.
describe('domain purity', () => {
  const files = readdirSync(__dirname).filter((f) => f.endsWith('.ts') && !f.endsWith('.spec.ts'));

  it.each(files)('%s imports neither Nest nor Prisma', (file) => {
    const src = readFileSync(join(__dirname, file), 'utf8');
    expect(src).not.toMatch(/from ['"](@nestjs\/|@prisma\/|\.\.\/)/);
  });
});
