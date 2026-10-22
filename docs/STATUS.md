# STATUS — master plan

The **only** progress tracker. Domain truth: `docs/domain/business-design.md` (its vocabulary wins). Rules: `docs/rules/*`. Mark `[x]` + date when done; update the board's *last verified* in the same commit.

Legend: 🔴 broken/blocking · 🟡 partial · 🟢 works · ❓ needs a decision · ⚪ not started
Base: branch `rebuild` = `origin/migration/backend-api` @ `899fac51` + ENV-02..05 + PocketBase removal (2026-10-12). All data is test data.

## Module board

Priority and scope from `business-design.md` §5. *S1\** = smoke S1 run on 2026-10-12 **with a temporary, uncommitted fix for PLAT-01** (without it every screen is blank).

| Module | P | Status | Next item | Last verified |
|---|---|---|---|---|
| Platform (build, CI, dist, knip) | – | 🟢 | MVP-5 | 2026-10-21 branch `mvp`: `pnpm check` green (api build, 22 unit, 15 e2e, web lint+build, knip); sweep 72/0 on the compose stack |
| Auth & users | – | 🟡 | AUTH-01 | 2026-10-21 branch `mvp`: policy moved to `domain/policy.ts` (unit green); new `GET /users/directory`, `GET /users/:id` |
| Clients | 1 | 🟡 | `docs/modules/clients.md` | S1*: loads admin/ventas/técnico |
| Quotations | 1 | 🟡 | `docs/modules/quotations.md` | S1*: loads admin/ventas |
| Projects (today: Schedule + Sale) | 1 | 🔴 | MVP-6 (API-02 money) | 2026-10-21 branch `mvp`: `/schedule` loads for 3 roles with no API errors (sweep) |
| Finance | 1 | ⚪ | `docs/modules/finance.md` | S1*: frozen stubs |
| Dashboard | 1 | 🟡 | `docs/modules/dashboard.md` | S1*: loads 3 roles |
| Cronograma (activities) | 2 | 🔴 | after PRO-01 | = `/schedule` (see Projects) |
| Asistencias | 2 | ⚪ | – | – |
| Relevamientos (surveys) | 2 | 🟡 | SUR-01 | S1*: `/surveys` loads 3 roles |
| Inventory | 2 | ⚪ | – | – |
| Internal orders | 2 | 🟡 | MVP-5 (full flow) | 2026-10-21 branch `mvp`: detail works; S6 admin + ventas (state change, comment); rules in `domain/pedidos-internos.ts`; e2e green |
| Direct sales | 2 | ⚪ | – | – |
| Vehicles | 3 | ⚪ (frozen stub) | – | S1*: stub |
| Reports | 3 | 🟡 | after FIN | S1*: `/reports`, `/admin/management` load (admin) |
| Accounting export | 3 | ⚪ | – | – |
| Marketing, automation | 4 | ⚪ (frozen stub) | – | S1*: stub |
| Web leads (`solicitudes-web`) | 4 | 🟡 | WEB-01 deploy | 2026-10-15: 6 unit + 4 e2e green; local WordPress form → list updates without reload (ventas) → convert opens the client file (with the PLAT-01 temporary fix) |
| Realtime (SSE) | – | 🟡 | RT-01 | S8 not run |

Module files exist only for priority 1 (`docs/modules/`). Others get one when their phase starts.

## Decisions log

| Date | Decision |
|---|---|
| 2026-10-12 | Base is `origin/migration/backend-api` (`rebuild` branch). 46 of 48 local-only commits were already in origin; the 2 others were dropped (re-added the Contadora role, silent `catch`, fewer survey fields). The old local branch is untouched. |
| 2026-10-12 | `apps/pocketbase`, `apps/web/plugins` (Horizons) and their config are deleted. |
| 2026-10-12 | `apps/*/dist` stays tracked (Hostinger/CI). `pnpm dev` compiles to ignored `apps/api/.dev-dist`. |
| 2026-10-12 | `db:reset` = compose down -v + up --wait + `migrate deploy` + seed (Prisma blocks `migrate reset` for agents). |
| 2026-10-12 | "Sales" is not a module: sales = Proyectos + Ventas directas (`business-design.md`). Replaces the old open SALES-00. |
| owner | Técnico role is renamed TÉCNICO and covers the 4 divisions. |
| owner | Quotations expire (validity 15 days). Prices are final (no IVA handling for now). |
| owner | Cajas: one central in Cochabamba + a petty cash per sede. Quotation templates come later. |
| owner | An Asistencia is chargeable and does not need a quotation; a bigger need creates a relevamiento or quotation. |
| owner | Money is one ledger (Movimiento): validation = rendición; discounts exist only in a quotation. (Closes the old PAY-03 D1–D3.) |
| 2026-10-15 | WEB-01: the hstecnologias.com form lands in its own table `solicitudes_web` (Client untouched). Sales converts a request with `POST /solicitudes-web/:id/convertir`, which links an existing client (same email, phone or name) or creates one. Webhook auth = header `X-HS-Webhook-Key` vs env `WEB_LEADS_KEY`. |
| 2026-10-19 | hs-erp plan approved (D1–D14): prod DB read-only over SSH first; name `hs-erp` (rename deferred, RC-02); stabilize before migrating the data model; credentials out of scope (no rotation/purge, D4); `main` = current `rebuild`, `legacy/main` kept; no time estimates; local-first promotion gate (LOCAL-04); CRUD toolkit before feature migration; roles ADMINISTRADOR/VENTAS/CONTABILIDAD/TÉCNICO (open model rejected for the first release); Inventory P2-a = catalog + StockMovement + cost; first release = Phases 0–4 + P1-b/P1-c/P1-d + P2-a. Source: `~/.claude/plans/review-all-the-session-purrfect-avalanche.md`. |
| 2026-10-21 | **MVP focus** (owner): work only on local branch `mvp` (= `chore/local-env` + `analysis/modules`; `chore/phase0-safety` already included). No change to `main`, no push unless asked. Parked: Lighthouse, bundle budgets, promote-gate, P0-4 rename, Phase 3.0 CRUD toolkit, Phase 4 (prod DB), graphify. Rule: every module touched moves its business rules to `apps/api/src/domain/` (pure TS, no Nest/Prisma imports, unit-tested; enforced by `domain/purity.spec.ts`). |
| ❓ open | `business-design.md` §3 lists a CONTABILIDAD role and an open "everyone sees/edits everything + audit trail" model, but the Contadora role was just removed and `CLAUDE.md` forbids role strings outside `common/policy`. Decide in Phase C before touching roles. |

## Phases

### MVP focus (2026-10-21) · branch `mvp` — current priority
Goal: the core flow works locally (Docker MySQL) for admin, ventas and técnico. Everything not listed here is parked or post-MVP; the hs-erp phases below stay as reference.
- [x] MVP-1 Stack check 2026-10-21 (after the reboot): `pnpm local:reset` → db/api/web healthy, `health/db` OK, login 201 ×3 roles, sweep 72 cells / 0 failing / no API 4xx. Compose now builds one shared dev image (`hs-erp-dev:local`) and keeps `node_modules` in named volumes.
- [x] MVP-2 `domain/` layer: `domain/policy.ts` (roles, permissions, row scoping; `auth/roles.ts` is now a Nest adapter), `domain/pedidos-internos.ts` (flow, transitions, totals, delivery fields), specs + purity test. 2026-10-21: api typecheck clean, unit 6 suites / 22 tests green, web build + lint (0 errors) + knip clean.
- [x] MVP-3 `/pedidos-internos/:id` (admin, ventas): API returns `costoTotal` and `transicionesValidas`, rejects invalid transitions (400), role guard on every route (técnico 403), realtime on every mutation. The DTO now accepts `listo_para_entrega`/`rechazado` (before, the flow could never reach `entregado`). Web maps the API shape (`mapPedidoDetail`), offers only the API transitions, drops the fake `logStateChange` and the silent users catch. Verified 2026-10-21: e2e green; S6 in the browser as admin (`solicitado → aprobado`) and ventas (`aprobado → en_preparación`) with comment, no errors.
- [x] MVP-4 Técnico 403s: `GET /users/directory` (id, name, role; any role with access) and `GET /users/:id` (self or admin/ventas); `ScheduleView` uses the directory and asks for quotations only for admin/ventas; `UserProfilePage` uses `getUser`; `useTecnicosList`/`useVendedorList` (mounted by the schedule form) use the directory too. Verified 2026-10-21: e2e green, sweep shows no 403 for técnico.
- [x] USERS-01 One roster `config/users.json` (same emails as production) for the local seed, login chips, e2e fixtures and scripts; passwords from gitignored `config/users.passwords.local.json`, else lowercase first name. Stephany → Estefany Gonzales (`estefany@hscontrol.com`); Dennis, Giovanni and Elias added; Marcos is `localOnly` (técnico for tests, hidden from production chips). Verified 2026-10-21: `pnpm local:reset`, login 201 for every roster user, chips → `/dashboard` for Dennis/Estefany/Marcos in the browser, sweep 72/0, `pnpm check` green (22 unit, 15 e2e).
- [ ] USERS-02 Production users SQL (insert Dennis, Giovanni, Elias; rename stephany → estefany). 2026-10-21: `apps/api/scripts/generate-users-sql.mjs` reads the roster + local passwords (refuses `localOnly` users and missing passwords), dry-run output reviewed. Pending (owner): passwords in `config/users.passwords.local.json`, read-only prod check, one approved write session after a backup.
- [ ] MVP-5 Core flow smoke S1..S8 (`docs/rules/testing.md`) ×3 roles: client → quotation → accept → schedule → internal order → cobro.
- [x] MVP-6 Money and access on the flow. `domain/schedules.ts` (flow, balance from payments, payment checks: no cobro above the saldo or on a cancelled job, `descuento` = forgiven debt, legacy advance becomes a payment row, project amount fixed by the quotation) and `domain/quotations.ts` (flow, accept rules, project from quotation), unit-tested. `registerPayment`/`update` run in `$transaction`. One accept path: `POST /quotations/:id/accept` and status `aceptado` both create sale + project once, atomically (idempotent, realtime). Relevamientos: create/update/photo need a role with access, técnico sees the ones he made or is assigned, photos only for someone who can see the relevamiento (goals were already admin-only). Web: the payment modal used a non-existent `schedule-payments` endpoint behind a silent catch (showed success, saved nothing); now it posts `cobro` + `extra_asistencia`; cancel registers a `descuento`; balance is read from the API; accept is one call (the old flow could create duplicate jobs). Verified 2026-10-21: 35 unit, 19 e2e, `pnpm check` green; browser as ventas: accept → one project (2500), cobro 1000 + adicional 150 → saldo 1500, cancel forgiving 1500 → saldo 0, no API errors.
- [ ] MVP-7 Silent catches and missing realtime emits in every page/module the MVP touches.
- [ ] MVP-8 AUTH-01 role rename (needs owner approval: schema/roles).
- Parked until after the MVP: Lighthouse, bundle budgets, promote-gate (LOCAL-03/04 follow-ups), P0-4, Phase 3.0, Phase 4, graphify. Técnico requesting internal orders stays out (`docs/operations/flows/pedidos-internos.md`: admin and ventas in this phase).

### 0 — Safety and decisions (hs-erp plan, 2026-10-19)
Documented exception to *one item per branch*: `chore/phase0-safety` groups P0-1 + P0-2 (two small docs-only changes, one commit each). Not a violation.
- [x] P0-1 `docs/deployment/hostinger-users-hscontrol.sql` retired without touching any credential; replaced by `hostinger-users.md` + `scripts/generate-users-sql.mjs` (hashes from env, `INSERT IGNORE`). Re-importing the old file would reset a user to the removed Contadora role. 2026-10-19
- [x] P0-2 `CLAUDE.md` §3 amended: read-only prod inspection via `ssh hostinger-hs`; one approved write session per migration. 2026-10-19
- [ ] P0-3 Branch restructure. Done 2026-10-20: `legacy/main` pushed (= old `origin/main` `743cf62b`); the existing annotated tag `horizons-original` (`5dcbbc55`, the original Horizons export) is kept as is, not moved. **Pending**: push of the tag and of `chore/phase0-safety` (blocked by the permission classifier, needs the owner); force-push of `main` (owner picks the target SHA); `develop`; freeze of Hostinger auto-deploy of `migration/backend-api` (owner, hPanel).
- [ ] P0-3b Repo-level `.claude/settings.json` allowing `git branch|push|tag` (owner: the agent may not edit its own permissions).

### Deferred — after Phase 1.5 (RC-02)
- [ ] P0-4 Rename to `hs-erp` (D2). Needs LOCAL-02 (local Playwright on three roles) for the functional-equivalence proof, so it runs after Phase 1.5.

### In progress (parallel local branches from `chore/phase0-safety`, no PRs until `develop` exists)
| Track | Branch | Scope | State |
|---|---|---|---|
| B | `analysis/modules` | Phase 0.5 AN-01..AN-06 → `docs/analysis/2026-10-20-modules.md`, `scripts/blank-view-sweep.mjs` | delivered, AN-05 and UI-04 `N` need the owner |
| C | `fix/plat-baseline` | Phase 1 PLAT-01/02/03/06 + CI. Documented exception to one-item-per-branch: the mechanical items share one PR | delivered locally; RC-01 sweep (PLAT-01b) pending the Phase 1.5 stack |
| D | `chore/local-env` | Phase 1.5 LOCAL-01..04 | delivered locally (rebased on `fix/plat-baseline`); Lighthouse baseline missing, gate not wired to CI |

### 1.5 — Local reproducible environment (RC-03) · `chore/local-env`
- [x] LOCAL-01 `docker-compose.yml` (db + api + web, healthchecks, project `hs-erp`) and `pnpm local:up` / `local:down` / `local:reset`. Verified 2026-10-20: all three services healthy, web 200, técnico login OK, `GET /api/health/db` OK. `pnpm db:*` use the same compose file.
- [x] LOCAL-02 `playwright.config.ts` + `e2e/fixtures/auth.ts` (admin/ventas/técnico `loginAs`). No route specs yet: the first suite is the route sweep (`scripts/blank-view-sweep.mjs`, on `analysis/modules`) once both branches are in `develop`, then S1..S8 from `docs/rules/testing.md`. `pnpm local:test` passes with no specs.
- [x] LOCAL-03 baseline recorded 2026-10-20 (local stack, seed data). Scripts: `scripts/measure-bundle.mjs`, `scripts/measure-api.mjs`, `scripts/lighthouse-local.mjs`.
  - Bundle (`pnpm local:bundle`): entry JS (index + shell/Layout) **577.9 kB** vs budget 300 (index chain 259.4 + Layout 286.6 + Helmet 21 + 11); CSS **79.6 kB** vs 60; 0 of 25 route chunks over 100 kB (largest `QuotationsLibraryPage` 77.6 kB); largest chunk `BarChart` 383.5 kB (recharts). Both budgets fail today; they are the FE-09 target, so `local:gate` fails until then.
  - API p50/p95 ms, 200 requests, concurrency 5 (`node scripts/measure-api.mjs`): `GET /clients` 38/58, `GET /quotations` 35/52, `GET /schedules` 38/46, `GET /metrics/sales` 29/47, `POST /auth/login` 655/857 (bcrypt cost). All 200/201.
  - Lighthouse: **not measured**. `pnpm dlx lighthouse` fails on this machine (`MODULE_NOT_FOUND`, then a timeout inside the script). Needs a fix or a pinned devDependency decision (new dependency = owner approval).
- [x] LOCAL-04 `scripts/promote-gate.mjs` (`pnpm local:gate`): compose healthy + `local:test` + `local:bundle`. Not wired to CI (owner decision, with Phase 1.5 exit).
- Phase 1.5 exit still needs: the sweep merged and green (see AN-01 `/pedidos-internos/:id`), Lighthouse numbers, S1..S8 specs.

### A — Safety and inventory ✅ 2026-10-12
- [x] Origin at `899fac51` with `pedidos-internos`; local-only work inventoried (nothing needed beyond ENV-02..05).

### B — Clean base ✅ except the blockers below
- [x] `rebuild` from origin; `business-design.md` committed.
- [x] ENV-02 root scripts · ENV-03 web env · ENV-04 seed (+technician, all statuses, pedidos) · ENV-05 `API_STRICT_DTO` (2026-10-12)
- [x] PocketBase, Horizons plugins, zips and logs removed; `pnpm dev` leaves `git status` clean.
- [x] Docs restructured (this file, `docs/modules/*`).
- [x] PLAT-01 `ScheduleFormModal.jsx` return wrapped in a fragment; `esbuild` parses it, `pnpm check` builds the web. 2026-10-20
- [x] PLAT-02 `tasks.service.spec.ts` no longer uses `ROLES.CONT` (replaced by a técnico-claim test). 2026-10-20
- [x] PLAT-03 `knip` exits 0: `knip.json` rewritten, `vite.config.js` ESM `__dirname`, 76 unused web files deleted (incl. dead `ui/*`), 26 web deps + `mariadb`/`swagger-ui-express` removed, `tailwindcss-animate` → devDependencies, unused exports cleaned; `duplicates` rule off until FE-01. `react-hook-form`/`zod`/`@hookform/resolvers`/`framer-motion` were removed as unused; UI-03 may re-add them with a written reason. 2026-10-20
- [ ] PLAT-04 ❓ Make `rebuild` the default branch (was ENV-01), create `develop`, freeze cloud deploys until staging.
- [ ] PLAT-05 Back up production once via SSH and compare with `schema.prisma` (was ENV-07). **Blocked: no SSH from this device.**
- [x] PLAT-06 `apps/*/dist` untracked and ignored; `.github/workflows/ci.yml` replaces `api.yml`/`web.yml` (runs `pnpm check` on PRs and main/develop/feat/fix/chore/analysis, uploads `dist` as an artifact, never commits). Deploy from CI artifact is REL-01/02. 2026-10-20

### C — Data model (needs approval: schema, roles) — `business-design.md` §8, P1-a
- [ ] AUTH-01 ❓ Decide role model (see decisions log); rename técnico → TÉCNICO.
- [ ] PRO-01 New schema: Project, Activity, Assistance, Movimiento/Caja, QuotationItem, Product… replacing Sale/SaleJob/SalePayment/SchedulePayment/Schedule.
- [ ] RT-01 `AuditService` records who/when/field/old value for every mutation (missing: clients, orders, categories, goals, sucursales) and emits a realtime event.
- [ ] Seed covers every status; `pnpm check` green.

### D — Priority 1 modules (`docs/modules/*`)
- [ ] P1-b Clients + Quotations · P1-c Projects + Finance · P1-d Dashboard (checklists in each module file).
- [ ] RT-02 🔴 TanStack Query + one SSE listener → `invalidateQueries`; remove per-page listeners and manual reloads. RT-03 SSE filters by user scope and rejects inactive users.
- [ ] GAP-03 Remove the ~30 silent `catch(() => [] / null)`; surface errors.

### E — Priority 2
- [ ] SCH-01 Cronograma shows only Activities; técnico must not trigger 403 on `/schedule` (`useTecnicosList`/`useVendedorList` call `/api/users`; the page also calls `/api/quotations`).
- [ ] SUR-01 `VisitaFormModal` `equipos_instalados` is stored nowhere: add to API or remove.
- [ ] ORD-01 Run S6 and align orders with Inventory (delivery → stock out → project cost).
- [ ] Asistencias, Inventory, Direct sales (`business-design.md` §4.2, §4.3, §4.5).
- [ ] AUTH-02 `forgot-password`: implement or remove endpoint + UI. AUTH-03 Branches `POST/PATCH/DELETE /sucursales` (admin) or remove the UI.

### F — Priority 3–4 and weight
- [ ] WEB-01 Web leads from hstecnologias.com (`business-design.md` §6 "Formulario web"): table + webhook + list/convert API ✅ 2026-10-15 · ERP page `/solicitudes-web` (admin, ventas) ✅ 2026-10-15 · production deploy (migration + `WEB_LEADS_KEY`) pending owner approval.
- [ ] Vehicles (`useVehicleControl.js` still calls `pb.collection(...)` with `pb` undefined: rewrite on the ledger), Reports, Accounting export, Marketing, automation.
- [ ] PLAT-07 Legacy inventory (~4.9k unreferenced lines: Schedules/Jobs/Surveys pages, Activity wall, Vehicles, Marketing, `services/orders`, `services/finance`): decide each (integrate/delete) and delete unused `components/ui/*` + packages (`docs/rules/libraries.md`).
- [ ] ARCH-01 API `common/` (policy, state machine, audit, storage, pagination) · ARCH-02 one HTTP client, no snake_case mapping · ARCH-03 `features/<x>` one at a time · ARCH-04 split components >250 lines · ARCH-05 `lib/format.js`, `constants/status.js`, `<StatusBadge>`, Bs everywhere.
- [ ] THEME-01/02 shadcn tokens, raw palette classes → 0 · PERF-01..03 replace `react-helmet`, lazy charts, bundle budget · TS-01 types from Swagger.

### G — Guardrails and release
- [ ] QA-01 unit tests (policy, state machine, ledger math) · QA-02 Playwright S2–S8 · QA-03 CI on PRs runs `pnpm check`.
- [ ] REL-01 staging from `develop` · REL-02 production from `main` after staging smoke.
- [ ] DOC-01 Delete superseded docs (`docs/migration/*`, `docs/architecture/frontend-poc.md`); move `docs/operations/*` to the new vocabulary; point `apps/*/agent.md` and `.cursor/rules/*` to `CLAUDE.md`.

## Closed on 2026-10-12 (no longer apply)

| Old item | Reason |
|---|---|
| ENV-02..06 | Done (ENV-06 = the S1 run above). |
| GAP-08, GAP-09, GAP-10 (mock/PocketBase/`QUOTATION_SUCURSALES` imports) | Fixed on origin; remaining blocker is PLAT-01. |
| GAP-11 `pnpm check` red | Replaced by PLAT-01, PLAT-02, PLAT-03. |
| GAP-12 no internal-orders API | Exists on origin (`pedidos-internos`). |
| GAP-13 diverged branches | Resolved by the `rebuild` base. |
| GAP-14 dev dirties tracked files | Fixed (`.dev-dist`, PocketBase gone from the lockfile). |
| GAP-02 `DELETE /schedules/:id` | Nothing is deleted; records are annulled with a reason (`business-design.md` §3). |
| LEG-03 delete PocketBase and plugins | Done. LEG-01/02/04/05 → PLAT-07. |
| SALES-00, PAY-03 | Decided by `business-design.md` (see log). PAY-01/02/04 → `finance.md`. |
| GAP-05, GAP-07 | → `quotations.md`. GAP-01 → AUTH-03. GAP-04 → SUR-01. GAP-06 → AUTH-02. |
