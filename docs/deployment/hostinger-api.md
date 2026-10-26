# Hostinger Cloud Startup — sales API deploy

Separate **Node.js Web App** + dedicated **MySQL** on the same Cloud Startup plan (up to 10 apps). Do not run this service on the static SPA instance. Frontend publish: [hostinger-frontend.md](./hostinger-frontend.md).

> **2026-10-26 read-only check (`ssh hostinger-hs`, filesystem only, no DB rows read).** Confirms the mechanism below and finds the gap that blocks a deploy today:
> - Both apps are **Hostinger's own Node.js App Manager** (Phusion Passenger), not a generic static host: each site is `~/domains/<site>/hbuilds/{config,current→versions/<uuid>,last-source}`. A `.ci-trigger` marker file (API `console.log` shows redeploys through 2026-09-23) confirms hPanel's own Git integration pulls the watched branch and restarts the app — this part still works and needs no code change.
> - **The watched branch (`migration/backend-api`) is 91+ commits behind `mvp`** (last deploy commit `899fac51`, 2026-09-23). None of the UX-plan work (roles, finance ledger, inventory, cronograma) is on it yet.
> - **The real blocker: PLAT-06 (2026-10-20) stopped committing `apps/*/dist`.** Both Node apps have an **empty Build command** in hPanel — Hostinger never runs `vite build` or `nest build` itself (by design, see "Known pitfalls" below); it only runs `pnpm install` and starts the already-committed `dist/`. The old `web.yml`/`api.yml` workflows built and bot-committed `dist/` back to the watched branch; `ci.yml` (which replaced them) uploads `dist` only as a CI artifact and **never commits it**. Pushing `mvp` to `migration/backend-api` as-is would deploy a repo with no `dist/` and the Node apps would fail to start. Fixing this needs a workflow change, which needs **explicit approval** per `CLAUDE.md` (`.github/workflows` and the production branch are both covered by that rule) — see the proposal at the end of this file.
> - Schema comparison (production's deployed `prisma/schema.prisma`, read the same way, vs. local): see **"Schema diff 2026-10-26"** below.
> - Querying live table/row counts was not done — it needs a separate approval (it is a "production read" of actual data, not just structure).

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
| `WEB_LEADS_KEY` | `openssl rand -hex 32` — shared secret for `POST /api/solicitudes-web/webhook` (WEB-01). The same value goes in WordPress `wp-config.php` as `HS_ERP_LEADS_KEY`. Without it the webhook answers 503 |

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
| Entry / start | **Live:** `dist/main.js` (do not switch to `start-api.mjs` without verifying Hostinger listen detector ~3s) |

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

**File Manager (UPLOAD_DIR):** the house icon = `/home/u656468476`. Create `hys-uploads` under home (not inside the git checkout). Nest writes quotation PDFs at the root of `UPLOAD_DIR` and relevamiento photos under `UPLOAD_DIR/relevamientos/` (created on first upload). Ensure both are writable.

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

Nest fails fast if `JWT_SECRET` or `CORS_ORIGIN` is missing. Swagger (`/api/docs`) is off unless `ENABLE_SWAGGER=1` (keep off in production).

`UPLOAD_DIR` must be **outside** the git checkout. Redeploys wipe `apps/api`. Create subdirectory `relevamientos/` for visit photos.

**SSE / proxy:** `GET /api/realtime/events` keeps a long-lived stream. Hostinger Node cold start may exceed the ~3s listen detector; heartbeats run from Nest. If the proxy drops idle connections, clients reconnect; Plan B is polling `metrics/feed`.

## phpMyAdmin — import schema

Hostinger has **no API to run SQL imports**. Do this in the UI. **Do not** run `prisma migrate deploy` or `prisma db seed` on the host.

**Empty database (greenfield)** — one import:

1. [hostinger-db-master.sql](./hostinger-db-master.sql) (all migrations + bootstrap in one file).

Or split: [hostinger-schema-baseline.sql](./hostinger-schema-baseline.sql) then [hostinger-bootstrap.sql](./hostinger-bootstrap.sql).

**Production users (after bootstrap):** see [hostinger-users.md](./hostinger-users.md). The old `hostinger-users-hscontrol.sql` is retired; do not re-import it. Never run `prisma db seed` on the host.

Regenerate the baseline after new Prisma migrations (concat folders in name order). Do not squash Prisma migration folders in git — see `.cursor/rules/prisma-migrations-hostinger.mdc`.

**Existing DB** — import only the **new** `migration.sql` folder(s), then skip a full baseline re-import.

**Manual ordered import** (same as baseline contents):

| Order | Folder / file |
|------:|---------------|
| 1–11 | Each `apps/api/prisma/migrations/*/migration.sql` in folder-name order |
| 12 | `docs/deployment/hostinger-bootstrap.sql` |

### Production is at `20260923010000_pedidos_internos`; `mvp` has 10 more → [hostinger-delta-20261026.sql](./hostinger-delta-20261026.sql)

Checked 2026-10-26 (read-only, filesystem): production's deployed `prisma/migrations/` stops at `20260923010000_pedidos_internos` — the same 15 folders in the same order as local, so nothing is diverged, only behind. `mvp` adds 10 more: `solicitudes_web`, `activity_detalle`, `categories_divisions`, `quotations_close_states`, `task_client`, `projects`, `cash_ledger`, `inventory`, `movement_custody`, `order_requester`. `hostinger-delta-20261026.sql` is those 10 concatenated in order, for a single phpMyAdmin import on the existing DB — same convention as above, scoped to this upgrade. **Back up first**, and read the file's own header: one of the 10 (`categories_divisions`) rewrites every quotation's and job's category and needs a one-query manual check before it runs (the header gives the exact query). The other 9 are pure additions (new tables, or a new nullable/defaulted column with its own backfill) and touch no existing column's meaning.

### Schema diff 2026-10-26 (structural, not data)

Read-only (filesystem): production's deployed `apps/api/prisma/schema.prisma` vs. local. 19 tables in production, 24 in `mvp` (+`solicitudes_web`, `projects`, `cash_boxes`, `cash_movements`, `products`, `stock_movements` — all net new, nothing dropped). Of the existing 19, these have real column changes (everything else is formatting or an added relation, not a column):

| Table | Change |
|---|---|
| `quotations` | `categoria` (free text) column removed, `categoriaId` is now a required FK to `quotation_categories` instead of a loose string; added `eliminadaAt`, `eliminadaPorId`, `motivoEliminacion` (soft delete with reason); `estado` value `aceptado` renamed to `aprobado` |
| `schedules` | `type` column removed, replaced by a required `categoriaId` FK (same division as its quotation when it has one); added `projectId` (nullable: a job may belong to a project) |
| `quotation_categories` | added `principal` boolean (marks the 3 fixed divisions apart from user-made subcategory chips) |
| `activities` | added `detalle` (JSON: before/after per changed field, for the Chatter history) |
| `tasks` | added `clienteId` (nullable) |
| `pedidos_internos` | added `solicitanteId` (required FK: who asked, separate from `responsableId` who receives; backfilled from `responsableId` for existing rows) |
| `pedido_interno_items` | added `productoId` (nullable FK to the new `products` table) |
| `cash_movements` | (new table) added `recibidoPorId` after creation, in a later migration (who holds the money until validated) |

`Sale`, `SaleJob`, `SalePayment` (the old sales/payment tables) are untouched in both — `Project`/`CashMovement` are new, parallel tables for the flow going forward; this upgrade does not migrate old sales rows into them. The one migration worth a human look before running is `categories_divisions` (see above); the rest are additive and self-contained.

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

- `GET /api/health` → `{"ok":true,"service":"hs-erp"}`  
- `GET /api/health/db` → `{"ok":true,"service":"hs-erp","db":true}`  

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

## Proposed fix for the `dist` gap (revised 2026-10-26, not applied — needs explicit approval)

Per `CLAUDE.md`, `.github/workflows` and the production branch are not touched without the owner's explicit go-ahead, so this is written up, not done.

**Current hPanel docs (checked 2026-10-26, see sources in the chat log) confirm Hostinger's Node.js app *does* run a real Build script** — an npm script run after install, 15-minute limit, Root directory can point at a monorepo subfolder ("only that subdirectory is built"). That changes the plan for the API:

- **API (lime-chamois):** `nest build` is plain `tsc` — `nest-cli.json` sets no `compiler`/`builder`, so there is no native binary (no swc, no webpack) in the build step. **Verified locally 2026-10-26**: copied `apps/api` alone (no `node_modules`, no monorepo parent) into an empty directory, ran `pnpm install` then `pnpm run build` there with nothing else present — it installed, generated the Prisma client, ran `nest build`, produced `dist/main.js`, and the built app boots (module graph initializes) with no native-binary step anywhere. So the API no longer needs its `dist/` pre-built and committed: set **Build script = `build`** in hPanel and let Hostinger build it on every deploy, same as the docs' supported path. `apps/api/pnpm-workspace.yaml` (already in the repo, written for exactly this) keeps it installable with `apps/api` as the sole root.
- **Web (white-goat, SPA):** unchanged — `vite build` spawns a native `esbuild` binary, and this project's own deploy history already hit `EACCES` from that under Hostinger's filesystem (documented above and in `hostinger-frontend.md`); that finding predates this check and a generic doc search neither confirms nor rules it out for the current product, so it is not re-tested here. Safest path, and still Hostinger's own supported pattern for a prebuilt static app ("Output directory: ... for static sites, the files to serve"; leave Build script empty): keep **Build script empty, Output directory = `dist`**, with `dist/` pre-built in CI and committed.
- Hostinger's own docs describe exactly the branch-per-environment pattern already proposed below: *"Deploy a preview branch as a separate app on a free subdomain, then point the main site at the release branch once it's verified."*
- No rollback button in hPanel — deployment history shows commit/author/status/logs only. Rollback is `git revert` + push (already correct in this doc's existing "Rollback" section).

Revised plan (smaller than before — only the SPA still needs a CI-committed `dist/`):

1. A new workflow, triggered only on push to a dedicated `release` branch (not `mvp`/`feat/*`/`fix/*`): runs `pnpm --filter @hs-erp/web build` in CI, then commits `apps/web/dist` back to `release` with `[skip ci]`. The API needs no build/commit step in CI at all — `pnpm --filter @hs-erp/api build` already runs in `ci.yml` for `pnpm check`, so this adds nothing new for the API.
2. Merging `mvp` → `release` (fast-forward, reviewed) becomes "cut a release"; it's the only thing that triggers a rebuild.
3. In hPanel: SPA keeps Build script empty / Output `dist`; API's Build script changes from empty to `build` (a one-field hPanel change, not a workflow change). Both Node apps' Git integration is re-pointed from `migration/backend-api` to `release` (owner, hPanel UI — not reachable from here).
4. First release also needs the DB brought current — see "Fresh database" below (simpler now that the owner confirmed the current production DB holds nothing worth keeping), then USERS-02 (below).

## Fresh database (owner confirmed 2026-10-26: production DB is not in use, nothing to preserve)

This replaces the delta-import plan above. Instead of applying only the 10 missing migrations and worrying about `categories_divisions` reclassifying live rows, drop and recreate:

1. Back up anyway first (cheap insurance, one `mysqldump` or hPanel's own Backups button — even an empty/test DB is a 30-second safety net).
2. Empty the schema (`DROP DATABASE` + recreate, or drop every table) — same DB name/user (`u656468476_hys_sales` / `u656468476_hys_api`), no new MySQL resource needed.
3. Import `hostinger-schema-baseline.sql` (regenerated 2026-10-26, all 25 migrations in order) then `hostinger-bootstrap.sql`, exactly as the "Empty database (greenfield)" path above already documents. `hostinger-delta-20261026.sql` and its `categories_divisions` warning no longer apply — there is no existing data to reclassify.
4. This also means `hostinger-db-master.sql` (baseline + bootstrap in one file) is worth regenerating too before using it, since it predates several migrations — regenerate with the same concat-in-folder-order method as the baseline, or just use the two-file path (baseline, then bootstrap) which is already current.
5. Still a production write: back up, then apply, in one approved session, same as any other write per `CLAUDE.md` §3 — the "not operational" status lowers the stakes, it doesn't skip the step.

## USERS-02 still needs passwords

`config/users.passwords.local.json` (gitignored, read by `scripts/generate-users-sql.mjs --role`) is not present on this machine — confirmed 2026-10-26, nothing was read or printed. Without it the script can't hash passwords for Dennis, Giovanni, Elias or Estefany's rename to CONTABILIDAD. The owner creates that file locally (one password per new/changed user) or supplies passwords another way; the script dry-runs the SQL for review either way before anything touches production.
