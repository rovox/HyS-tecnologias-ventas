# Backend agent notes (`apps/api`)

First NestJS microservice: **sales** (this package). MySQL only. pnpm workspace name `api`. Prisma, not TypeORM.

## Stack

- NestJS, Prisma, MySQL, JWT (`bcryptjs`), Swagger at `/api/docs`
- Global prefix `/api`
- AuthGuard requires JWT **with** `sessionId`; ended sessions → 401
- No public signup. Seed creates demo users with simple per-user passwords. **Never seed on Hostinger/production.**
- No client DELETE. Never `prisma db push` — use migrations.
- PDFs: `UPLOAD_DIR` (local default `./uploads`). Hostinger: path outside git.

## Domain

Users + sessions, sucursales (Central, Punata, Quillacollo), clients, quotations (`borrador` → `enviado` → `aceptado`|`rechazado`), relevamientos, monthly seller goals, **Schedule cronograma**, tasks (optional `scheduleId` FK), metrics (includes schedule counts). Frozen sales/jobs/payments (admin-only mutations).

Out of scope: finance/caja, TypeORM.

## Commands

```bash
pnpm --filter api dev
pnpm --filter api prisma:deploy
pnpm --filter api prisma:seed
pnpm --filter api test
pnpm --filter api test:e2e
```

SPA: `apps/web/src/services/*` with `VITE_API_MODE=api`.

## Language

Documentation: English. Code comments: Spanish.
