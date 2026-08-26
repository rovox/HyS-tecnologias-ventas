# Hostinger Cloud Startup — sales API deploy

Separate **Node.js Web App** + dedicated **MySQL** on the same Cloud Startup plan (up to 10 apps). Do not run this service on the static SPA instance. Frontend publish: [hostinger-frontend.md](./hostinger-frontend.md).

**Never use a VPS.** MySQL is localhost-only from the Node app; the API must stay on this Cloud Startup. Free remote Node hosts cannot reach Hostinger MySQL.

App name suggestion: `hys-sales-api`. Package: `apps/api`. Global prefix: `/api`. Branch: `migration/backend-api`.

## How the pieces fit (white-goat independent)

```text
Browser  →  white-goat SPA (static dist, often mock today)
                │
                │  HTTPS + JWT  (VITE_API_MODE=api)
                ▼
         Nest Node Web App  (second Hostinger website)
                │
                │  DATABASE_URL @ localhost
                ▼
         MySQL u656468476_hys_sales   ←── not the WordPress DB
```

| Piece | Role |
|-------|------|
| `hstecnologias.com` WordPress | Marketing site. Own DB. Untouched. |
| `white-goat-213580.hostingersite.com` SPA | ERP UI. Publishes `apps/web/dist` only. |
| Nest Node app | REST API in `apps/api`. Reads/writes sales data. |
| `u656468476_hys_sales` MySQL | Only data store for Nest. |

Creating the database via Hostinger API/hPanel only provisions an empty MySQL schema + DB user on the shared Cloud Startup account. It does **not** install Nest, change white-goat, or touch WordPress.

## Create MySQL from hPanel UI (yes, fully supported)

Same result as the API call we already used. Prefer UI if you want to see the password on screen and copy it once.

1. Log in to [hPanel](https://hpanel.hostinger.com).
2. Open the **Cloud Startup** hosting account (same plan as white-goat / `hstecnologias.com`).
3. Go to **Databases** → **Management** (or **MySQL Databases**).
4. **Create new database**:
   - Database name: `hys_sales` (Hostinger prefixes → `u656468476_hys_sales`).
   - Create / choose a **new database user** (e.g. `hys_api` → `u656468476_hys_api`).
   - Set a **strong password** and save it offline (this is the only time Hostinger shows it clearly).
   - Assign the database to website **white-goat-…** (or leave unassigned until the Nest site exists). Do **not** reuse the WordPress DB.
5. Confirm the new DB appears in the list next to the WordPress one (`u656468476_J6Jww`).
6. Open **phpMyAdmin** for `u656468476_hys_sales` (button next to the DB).

Optional: **Remote MySQL** only if you need laptop access; the Nest app on the same plan uses `localhost` and does not need remote access.

### What we already did via API

`hosting_createAccountDatabaseV1` created `u656468476_hys_sales` + user `u656468476_hys_api`, assigned to white-goat. Password was generated at that moment — same secret you would type in step 4 of the UI flow. If lost: **Databases → Change password**, then update Nest `DATABASE_URL`.

## MySQL credentials — what the password is for

| Field | Value |
|-------|--------|
| Database | `u656468476_hys_sales` |
| DB user | `u656468476_hys_api` |
| Password | Random secret generated at create time (password manager / hPanel notes — **never commit to git**) |
| Assigned site | `white-goat-213580.hostingersite.com` (logical link in hPanel; Nest still runs as its own Node website) |

That password is **only** the MySQL login for the Nest process. It is not:

- the SPA login,
- the admin ERP password (`admin@hstecnologias.com` from [hostinger-bootstrap.sql](./hostinger-bootstrap.sql)),
- or the GitHub / Hostinger panel password.

Nest reads it from env as part of `DATABASE_URL`:

```text
mysql://u656468476_hys_api:<PASSWORD>@localhost:3306/u656468476_hys_sales
```

On the Node app, use **`localhost`** (same machine). The public `srv….hstgr.io` host is for remote tools (phpMyAdmin / laptop) if remote access is enabled — not required for the API on Cloud Startup.

If you lose the DB password: hPanel → Databases → change password, then update `DATABASE_URL` on the Node app and restart.

## Prisma on `noexec`

`nest build` emits JavaScript. GitHub Actions compiles and commits `apps/api/dist`. Runtime uses `@prisma/adapter-mariadb` (JS driver), not the native query engine.

Do **not** run `prisma migrate deploy` or `prisma seed` on the host. `postinstall` in `apps/api` runs `prisma generate` only (allowed). Import SQL in phpMyAdmin — see [hostinger-db-master.sql](./hostinger-db-master.sql) for greenfield.

## hPanel — env, DB reassignment, and upload folder

Complete this on **lime-chamois-337700** before expecting `/api/health` to succeed.

### 1. Reassign MySQL (no new database)

The sales DB already exists (`u656468476_hys_sales`). **Do not create a second MySQL.**

1. hPanel → **Databases** → **Management**.
2. Edit `u656468476_hys_sales` → assign website **lime-chamois-337700.hostingersite.com** (was white-goat; reassignment is labels only — same physical DB).

### 2. MySQL password → `DATABASE_URL`

Hostinger does **not** show the DB password again after create.

1. Databases → user `u656468476_hys_api` → **Change password** → save in a password manager.
2. Prefer alphanumeric + `-` `_` (avoid `@`, `#`, `/` or URL-encode special chars).
3. Build one line (no spaces):

```text
mysql://u656468476_hys_api:YOUR_NEW_PASSWORD@localhost:3306/u656468476_hys_sales
```

### 3. Environment variables (exact keys — UPPERCASE)

Delete lowercase keys such as `cors_origin` / `upload_dir`. Nest reads **only** these names:

| Key | Example / how to get |
|-----|----------------------|
| `DATABASE_URL` | `mysql://u656468476_hys_api:<PASSWORD>@localhost:3306/u656468476_hys_sales` |
| `JWT_SECRET` | `openssl rand -hex 32` — required; Nest **refuses to start** with the old placeholder `cambiar-en-hostinger` |
| `CORS_ORIGIN` | `https://white-goat-213580.hostingersite.com` — **required**; missing value aborts bootstrap |
| `UPLOAD_DIR` | `/home/u656468476/hys-uploads/quotations` |
| `ENABLE_SWAGGER` | Omit in production. Set `1` only when you intentionally need `/api/docs` |

`PORT` is assigned by Hostinger — do not override unless support says so.

### 4. Upload folder (File Manager)

The **house** icon = `/home/u656468476`. Create directly under home:

```text
/home/u656468476/hys-uploads/quotations
```

Do **not** nest another `u656468476` folder inside home (wrong path: `/home/u656468476/u656468476/hys-uploads/...`).

### 5. Node app settings (lime-chamois)

| Setting | Value |
|---------|--------|
| Branch | `migration/backend-api` |
| Root | `apps/api` |
| Framework | **Other** |
| Build | **empty** |
| Entry / start | `start-api.mjs` (or `dist/main.js`) |

Save → **Redeploy** after each Git push that changes `postinstall`, `dist`, or Prisma config.

### 6. Verify

```bash
curl -sS https://lime-chamois-337700.hostingersite.com/api/health
curl -sS https://lime-chamois-337700.hostingersite.com/api/health/db
```

Expect JSON with `"ok":true`. `/api/health/db` must show `"db":true` before flipping the SPA to `VITE_API_MODE=api`.

**ERP admin** (from bootstrap SQL, not MySQL): `admin@hstecnologias.com` — rotate the one-time bootstrap password immediately after first login. Do not re-import bootstrap on a live DB (it no longer overwrites `passwordHash`, but still avoid it).

## Node Web App — you do not zip-upload only backend files

Hostinger clones the **same GitHub repo** and sets **Root directory = `apps/api`**. You do not manually upload a subset of files.

What happens:

1. GitHub branch `migration/backend-api` already has Nest source + committed `apps/api/dist` (CI).
2. hPanel Node app points at that branch, root `apps/api`.
3. Hostinger runs `pnpm install` (so `node_modules` exists) with **empty Build**.
4. Start command: `node dist/main.js` — runs the prebuilt Nest JS, listens on `PORT`, serves `/api/...`.
5. Env vars in hPanel inject `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `UPLOAD_DIR`.

The monorepo still contains `apps/web`, but the Node app **ignores** it because root is `apps/api`. white-goat remains a **separate** website that only publishes the SPA.

| Setting | Value |
|---------|--------|
| Branch | `migration/backend-api` |
| Framework | **Other** (Nest preset would compile on the host) |
| Node | 22 |
| Root | `apps/api` |
| Package manager | pnpm |
| Build | **empty** (do not run `nest build` on the host) |
| Start / entry file | `start-api.mjs` (preferred) or `dist/main.js` |

**Entry file:** use [`apps/api/start-api.mjs`](../../apps/api/start-api.mjs) — same launcher pattern as white-goat `serve-dist.mjs`. Hostinger runs it with Node and starts `dist/main.js`. Nest binds `0.0.0.0` on `PORT`.

**pnpm on Hostinger (pnpm 11):** root and [`apps/api/pnpm-workspace.yaml`](../../apps/api/pnpm-workspace.yaml) must set `allowBuilds` for `prisma` / `@prisma/client` / `@prisma/engines` (`true`) and deny `esbuild` / `@scarf/scarf` / `unrs-resolver`. `strictDepBuilds: false` avoids hard-fail on other ignored scripts. `apps/api` `postinstall` runs `prisma generate`. If the log shows `ERR_PNPM_IGNORED_BUILDS` + `ERROR: Failed to install dependencies`, push those YAML files and Redeploy — Nest never starts, so `/api/health` stays 503.

**File Manager (UPLOAD_DIR):** the house icon = `/home/u656468476`. Create `hys-uploads/quotations` directly under home — not inside an extra `u656468476` folder.

**MySQL password lost:** hPanel → Databases → user `u656468476_hys_api` → **Change password** → rebuild `DATABASE_URL`. Reassign DB to **lime-chamois** (not white-goat) for clarity.

Environment:

```
DATABASE_URL=mysql://u656468476_hys_api:<PASSWORD>@localhost:3306/u656468476_hys_sales
JWT_SECRET=<openssl rand -hex 32 — required, no placeholder>
PORT=<host-assigned>
CORS_ORIGIN=https://white-goat-213580.hostingersite.com
UPLOAD_DIR=/home/u656468476/hys-uploads/quotations
# ENABLE_SWAGGER=1
```

Nest fails fast if `JWT_SECRET` or `CORS_ORIGIN` is missing. Swagger (`/api/docs`) is off unless `ENABLE_SWAGGER=1`.

`UPLOAD_DIR` must be **outside** the git checkout. Redeploys wipe `apps/api`.

## phpMyAdmin — import schema

Hostinger has **no API to run SQL imports**. Do this in the UI. **Do not** run `prisma migrate deploy` or `prisma db seed` on the host.

**Empty database (greenfield)** — one import:

1. [hostinger-db-master.sql](./hostinger-db-master.sql) (all migrations + bootstrap in one file).

Or split: [hostinger-schema-baseline.sql](./hostinger-schema-baseline.sql) then [hostinger-bootstrap.sql](./hostinger-bootstrap.sql).

**Production users (after bootstrap):** import [hostinger-users-hscontrol.sql](./hostinger-users-hscontrol.sql) in phpMyAdmin. It upserts the 8 `hscontrol.com` accounts and sets `admin@hstecnologias.com` to `active = false`. Never run `prisma db seed` on the host.

Regenerate the baseline after new Prisma migrations (concat folders in name order). Do not squash Prisma migration folders in git — see `.cursor/rules/prisma-migrations-hostinger.mdc`.

**Existing DB** — import only the **new** `migration.sql` folder(s), then skip a full baseline re-import.

**Manual ordered import** (same as baseline contents):

| Order | Folder / file |
|------:|---------------|
| 1–11 | Each `apps/api/prisma/migrations/*/migration.sql` in folder-name order |
| 12 | `docs/deployment/hostinger-bootstrap.sql` |

## Create Nest Node app from hPanel UI

1. hPanel → **Websites** → **Add website** → **Node.js web app** (not WordPress, not “empty” PHP).
2. Use a **new free Hostinger subdomain** (or custom domain). Do **not** overwrite white-goat.
3. Connect the **same GitHub repo**, branch `migration/backend-api`.
4. Apply the settings table above (Framework **Other**, root `apps/api`, empty build, entry `start-api.mjs`).
5. In **Environment variables**, set `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `UPLOAD_DIR` (API cannot set these).
6. Deploy / restart. Create folder for `UPLOAD_DIR` outside the git checkout if needed.
7. Gate: `GET https://<api-host>/api/health` then `/api/health/db`.

Live Nest app (Git deploy): `https://lime-chamois-337700.hostingersite.com` (root `apps/api`, branch `migration/backend-api`). SPA stays `https://white-goat-213580.hostingersite.com`.

## First boot (checklist)

1. MySQL `u656468476_hys_sales` created (UI or API) — independent of WordPress. **Done.**
2. phpMyAdmin: schema (+ bootstrap) — **Done** if you already imported.
3. Node.js website + env (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `UPLOAD_DIR`) — hPanel.
4. Wait for CI `chore: refresh api dist [skip ci]` if `dist` is missing, then redeploy.
5. Gate: `GET https://lime-chamois-337700.hostingersite.com/api/health` then `/api/health/db`.

## What `JWT_SECRET` is

`JWT_SECRET` is **not** a login password for people and **not** the MySQL password.

It is a long random key that Nest uses to **sign and verify** JSON Web Tokens after `POST /api/auth/login`:

1. User logs in with ERP email + password (e.g. bootstrap admin).
2. API checks the password hash in MySQL, then creates a JWT signed with `JWT_SECRET`.
3. The SPA sends `Authorization: Bearer <token>` on later requests.
4. `AuthGuard` verifies the signature with the same secret (`apps/api/src/app.module.ts` + `auth.guard.ts`).

| Secret | Purpose |
|--------|---------|
| ERP user password | Human login (hashed in DB) |
| MySQL password inside `DATABASE_URL` | Nest ↔ MySQL only |
| `JWT_SECRET` | Cryptographic signing of session tokens |

If you change `JWT_SECRET` and Restart, **all existing tokens become invalid** — users must log in again. That is expected after a rotation (e.g. after the secret was pasted in chat). Generate with `openssl rand -hex 32`; never commit it to git.

## SPA after health check

Production SPA is flipped via Actions + Hostinger Git branch (not hPanel `VITE_*`):

```
VITE_API_MODE=api
VITE_API_URL=https://lime-chamois-337700.hostingersite.com/api
```

Point the white-goat website Git branch to **`migration/backend-api`**, wait for `chore: refresh web dist [skip ci]`, then hard-refresh.

CORS must allow the SPA origin. Auth is Bearer JWT (ERP user password ≠ MySQL password ≠ `JWT_SECRET`). Rotate the bootstrap admin password after first Nest login.

This API syncs sucursales, users/sessions, clients, quotations (cliente optional on quick tasks), commission %, PDFs / licitación / prerrequisitos, relevamientos, seller goals, activity metrics, schedules, and quotation-task pool (`tipo=cotizacion` + `POST /tasks/:id/claim`). Not synced: finance, vehicles, internal orders, marketing.

## Incident log — lime-chamois Nest + MySQL (2026-08)

**Outcome (verified):**  

- `GET /api/health` → `{"ok":true,"service":"sales"}`  
- `GET /api/health/db` → `{"ok":true,"service":"sales","db":true}`  

SPA white-goat uses **`VITE_API_MODE=api`** against lime-chamois once the SPA Git branch is `migration/backend-api` and Actions has refreshed `apps/web/dist`.

### Problems found (in order)

| Symptom | Root cause | Fix |
|---------|------------|-----|
| Hostinger HTML **404** | Empty entry / start file | Set entry to `dist/main.js` (or `start-api.mjs`) |
| Deploy log `ERR_PNPM_IGNORED_BUILDS` + install failed | pnpm 11 blocks Prisma lifecycle scripts unless approved | `allowBuilds` for Prisma in root + [`apps/api/pnpm-workspace.yaml`](../../apps/api/pnpm-workspace.yaml); `postinstall` → `prisma generate`; `strictDepBuilds: false`; push + Redeploy |
| `/api/health` **503** while install OK | Nest crash / not listening (env, bind, Prisma) | Bind `0.0.0.0`; tolerate bad DB on boot so liveness can respond; ensure UPPERCASE env keys |
| `/api/` **404** `Cannot GET /api/` | No root route under global prefix | Expected — use `/api/health`, `/api/docs`, etc. |
| `/api/health` 200 but `/api/health/db` `db:false` | Bad `DATABASE_URL` (password with `$` broke URI / env expansion) | Change MySQL password to alphanumeric; rebuild URL; **Restart** Node after env change |
| Confusion: “move DB to lime” | Thought a second MySQL was required | Same DB `u656468476_hys_sales`; only reassign website label in hPanel |

### What was done (ops + git)

1. Dedicated MySQL `u656468476_hys_sales` + user `u656468476_hys_api` (not WordPress).
2. Schema via phpMyAdmin (migrations + bootstrap) — do **not** reimport master SQL if tables already exist.
3. Node app **lime-chamois-337700** from branch `migration/backend-api`, root `apps/api`, empty build.
4. Folder `/home/u656468476/hys-uploads/quotations` for `UPLOAD_DIR`.
5. Four env keys UPPERCASE: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `UPLOAD_DIR`.
6. Git fixes pushed so Hostinger install runs Prisma generate (pnpm 11 `allowBuilds`).
7. Password + `JWT_SECRET` rotated after exposure in chat; Restart applied env.

### Lessons

- Hostinger Git deploys from GitHub — local laptop changes do nothing until push.
- Env changes need **Restart**, not only Save.
- Prefer MySQL passwords without `$ @ # /` inside `DATABASE_URL`, or URL-encode them (`$` → `%24`).
- Do not paste production secrets into chat; rotate if you did.
