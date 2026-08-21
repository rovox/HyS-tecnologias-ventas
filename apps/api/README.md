# apps/api — sales microservice

NestJS + Prisma + **MySQL**. Commercial registration: sucursales, users, clients, quotations (PDF), relevamientos, goals, **schedules (cronograma)**, tasks, metrics. Sales/jobs/payments stay frozen (admin-only writes).

Not included: finance, TypeORM, PocketBase, quotation biblioteca.

## Local

```bash
cp apps/api/.env.example apps/api/.env
docker compose -f apps/api/docker-compose.yml up -d
pnpm --filter api prisma:generate
pnpm --filter api prisma:deploy
pnpm --filter api prisma:seed
pnpm --filter api dev
```

Swagger pulls `@scarf/scarf`; its postinstall is denied in `pnpm-workspace.yaml` so install does not ask for `pnpm approve-builds`.

- Health: `http://localhost:3001/api/health`
- Swagger: `http://localhost:3001/api/docs`

Demo passwords (seed): first name lowercase — `dennis` / `julio` / `wilson` / `vanesa` / `elias` / `elena`. See [demo-accounts.md](../../docs/getting-started/demo-accounts.md).

```
VITE_API_MODE=api
VITE_API_URL=http://localhost:3001/api
```

Tests: `pnpm --filter api test` · `pnpm --filter api test:e2e` (needs MySQL + seed).

Default SPA production build stays `mock` until Hostinger API is healthy.

## Hostinger

Separate Node Web App + own MySQL. See [`docs/deployment/hostinger-api.md`](../../docs/deployment/hostinger-api.md). Never run this on the static SPA instance. **Never seed in production.**
