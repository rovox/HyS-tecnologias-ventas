# STATUS — master plan

The **only** progress tracker. Domain truth: `docs/domain/business-design.md` (its vocabulary wins). Rules: `docs/rules/*`. Mark `[x]` + date when done; update the board's *last verified* in the same commit.

Legend: 🔴 broken/blocking · 🟡 partial · 🟢 works · ❓ needs a decision · ⚪ not started
Base: branch `rebuild` = `origin/migration/backend-api` @ `899fac51` + ENV-02..05 + PocketBase removal (2026-10-12). All data is test data.

## Module board

Priority and scope from `business-design.md` §5. *S1\** = smoke S1 run on 2026-10-12 **with a temporary, uncommitted fix for PLAT-01** (without it every screen is blank).

| Module | P | Status | Next item | Last verified |
|---|---|---|---|---|
| Platform (build, CI, dist, knip) | – | 🔴 | PLAT-01 | `pnpm check` red (PLAT-01, PLAT-02) |
| Auth & users | – | 🟡 | AUTH-01 | S1*: login OK for 3 roles |
| Clients | 1 | 🟡 | `docs/modules/clients.md` | S1*: loads admin/ventas/técnico |
| Quotations | 1 | 🟡 | `docs/modules/quotations.md` | S1*: loads admin/ventas |
| Projects (today: Schedule + Sale) | 1 | 🔴 | `docs/modules/projects.md` | S1*: `/schedule` loads, técnico gets 403 |
| Finance | 1 | ⚪ | `docs/modules/finance.md` | S1*: frozen stubs |
| Dashboard | 1 | 🟡 | `docs/modules/dashboard.md` | S1*: loads 3 roles |
| Cronograma (activities) | 2 | 🔴 | after PRO-01 | = `/schedule` (see Projects) |
| Asistencias | 2 | ⚪ | – | – |
| Relevamientos (surveys) | 2 | 🟡 | SUR-01 | S1*: `/surveys` loads 3 roles |
| Inventory | 2 | ⚪ | – | – |
| Internal orders | 2 | 🟡 | ORD-01 | S1*: `/pedidos-internos` loads admin/ventas; S6 not run |
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
| ❓ open | `business-design.md` §3 lists a CONTABILIDAD role and an open "everyone sees/edits everything + audit trail" model, but the Contadora role was just removed and `CLAUDE.md` forbids role strings outside `common/policy`. Decide in Phase C before touching roles. |

## Phases

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
| C | `fix/plat-baseline` | Phase 1 PLAT-01/02/03 + CI. Documented exception: the four mechanical items share one PR | started |
| D | `chore/local-env` | Phase 1.5 LOCAL-01..04 | started |

### A — Safety and inventory ✅ 2026-10-12
- [x] Origin at `899fac51` with `pedidos-internos`; local-only work inventoried (nothing needed beyond ENV-02..05).

### B — Clean base ✅ except the blockers below
- [x] `rebuild` from origin; `business-design.md` committed.
- [x] ENV-02 root scripts · ENV-03 web env · ENV-04 seed (+technician, all statuses, pedidos) · ENV-05 `API_STRICT_DTO` (2026-10-12)
- [x] PocketBase, Horizons plugins, zips and logs removed; `pnpm dev` leaves `git status` clean.
- [x] Docs restructured (this file, `docs/modules/*`).
- [ ] PLAT-01 🔴 `apps/web/src/components/ScheduleFormModal.jsx`: two JSX siblings in `return (…)` with no fragment (lines 358/784) → Vite 500 → **every screen blank on all roles**. Fix = wrap in `<>…</>` (verified locally, not committed).
- [ ] PLAT-02 🔴 `apps/api/src/tasks/tasks.service.spec.ts:18` uses removed `ROLES.CONT` → unit suite fails to compile → `pnpm check` stops there.
- [ ] PLAT-03 `knip` is not clean: 36 unused files, 5 unused deps + 3 devDeps, 1 unlisted, 19 unused exports, 35 config hints. Target 0.
- [ ] PLAT-04 ❓ Make `rebuild` the default branch (was ENV-01), create `develop`, freeze cloud deploys until staging.
- [ ] PLAT-05 Back up production once via SSH and compare with `schema.prisma` (was ENV-07). **Blocked: no SSH from this device.**
- [ ] PLAT-06 Tracked `apps/api/dist` and `apps/web/dist` are stale (api dist lacks `pedidos-internos`); `pnpm check` rewrites them. Decide who refreshes them (CI).

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
