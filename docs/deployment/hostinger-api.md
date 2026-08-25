# Hostinger Cloud Startup — sales API deploy

Separate **Node.js Web App** + dedicated **MySQL** on the same Cloud Startup plan (up to 10 apps). Do not run this service on the static SPA instance. Frontend publish: [hostinger-frontend.md](./hostinger-frontend.md).

**Never use a VPS.** MySQL is localhost-only; the API must stay on this Cloud Startup. Free remote Node hosts cannot reach Hostinger MySQL.

App name suggestion: `hys-sales-api`. Package: `apps/api`. Global prefix: `/api`. Branch: `migration/backend-api`.

## Prisma on `noexec`

`nest build` emits JavaScript. GitHub Actions compiles and commits `apps/api/dist`. Runtime uses `@prisma/adapter-mariadb` (JS driver), not the native query engine.

Do **not** run `prisma migrate deploy` or `prisma generate` on the host. Import SQL from `apps/api/prisma/migrations/` in **phpMyAdmin**, in folder-name order.

## hPanel MySQL

- Database: `hys_sales`
- `DATABASE_URL=mysql://USER:PASS@localhost:3306/hys_sales` (internal Hostinger host, not your laptop)

## Node Web App

In hPanel: **Websites → Add Website → Node.js web app** → same GitHub repo, branch `migration/backend-api`.

| Setting | Value |
|---------|--------|
| Branch | `migration/backend-api` |
| Framework | **Other** (Nest preset would compile on the host) |
| Node | 22 |
| Root | `apps/api` |
| Package manager | pnpm |
| Build | **empty** |
| Start | `node dist/main.js` |

Environment:

```
DATABASE_URL=mysql://...
JWT_SECRET=<long random>
PORT=<host-assigned>
CORS_ORIGIN=https://<spa-host>
UPLOAD_DIR=/home/<user>/hys-uploads/quotations
```

`UPLOAD_DIR` must be **outside** the git checkout. Redeploys wipe `apps/api`.

## First boot

1. Create MySQL `hys_sales` (not the WordPress database).
2. phpMyAdmin: import each `migration.sql` in timestamp order (including `20260825160000_quotation_task_pool`).
3. phpMyAdmin: import [hostinger-bootstrap.sql](./hostinger-bootstrap.sql) (3 sucursales + one `ADMINISTRADOR`). **Do not** `prisma:seed`.
4. Wait for CI commit `chore: refresh api dist [skip ci]`, then redeploy.
5. Gate: `GET /api/health` then `GET /api/health/db`.

SPA origin for this ERP: `https://white-goat-213580.hostingersite.com` (independent of `hstecnologias.com` WordPress). Set `CORS_ORIGIN` to that origin.

## SPA after health check

Keep production `VITE_API_MODE=mock` until both health endpoints succeed. Then rebuild the SPA with:

```
VITE_API_MODE=api
VITE_API_URL=https://<api-host>/api
```

CORS must allow the SPA origin. Auth is Bearer JWT.

This API syncs sucursales, users/sessions, clients, quotations (cliente optional on quick tasks), commission %, PDFs / licitación / prerrequisitos, relevamientos, seller goals, activity metrics, schedules, and quotation-task pool (`tipo=cotizacion` + `POST /tasks/:id/claim`). Not synced: finance, vehicles, internal orders, marketing.
