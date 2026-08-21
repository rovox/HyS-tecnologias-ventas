# Hostinger — sales API deploy

Separate **Node.js Web App** + dedicated **MySQL**. Do not run this service on the static SPA instance (Vite / esbuild `noexec`). Frontend publish: [hostinger-frontend.md](./hostinger-frontend.md).

App name suggestion: `hys-sales-api`. Package: `apps/api`. Global prefix: `/api`.

## First-deploy gate: Prisma exec

`nest build` emits JavaScript (no esbuild). Runtime still loads the **Prisma query engine** native binary. If that Node app filesystem is `noexec`, Prisma fails the same way Vite did.

1. Deploy a health build and hit `GET /api/health`.
2. If Prisma cannot start, move the API to a Hostinger **VPS** (full Linux, exec allowed). Do not stay on Cloud Startup Node in that case.

## hPanel MySQL

- Database: `hys_sales`
- `DATABASE_URL=mysql://USER:PASS@HOST:3306/hys_sales`

## Node Web App

| Setting | Value |
|---------|--------|
| Root | `apps/api` (or monorepo root with start `--filter api`) |
| Node | 22 |
| Package manager | pnpm |
| Start | `node dist/main.js` |
| Build on host | empty if GitHub already compiled `dist/` |

Environment:

```
DATABASE_URL=mysql://...
JWT_SECRET=<long random>
PORT=3001
CORS_ORIGIN=https://<spa-host>
UPLOAD_DIR=/home/<user>/hys-uploads/quotations
```

`UPLOAD_DIR` must be **outside** the git checkout. Hostinger redeploys wipe `apps/api`; PDFs would disappear next to `dist/`.

## CI (GitHub)

[`.github/workflows/api.yml`](../../.github/workflows/api.yml) runs `prisma generate` and `nest build` on `ubuntu-latest`. Copy `apps/api/dist` (and generated Prisma client) onto the Node app; do not compile Nest on a `noexec` disk.

First boot on the host:

```bash
pnpm --filter api prisma:deploy
# pnpm --filter api prisma:seed   # demo only; skip on real company data
```

## SPA after health check

Only then set production:

```
VITE_API_MODE=api
VITE_API_URL=https://<api-host>/api
```

GitHub Actions rebuilds `apps/web/dist`. CORS must allow the SPA origin. Auth is Bearer JWT (no cookies).

This API syncs sucursales, users/sessions, clients, quotations + commission % + PDFs, relevamientos, seller goals, activity metrics, and existing sales/jobs/payments. Not synced: finance, vehicles, internal orders, marketing, calendar owner.
