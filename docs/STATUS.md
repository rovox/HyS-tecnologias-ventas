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
| Web leads (`solicitudes-web`) | 4 | 🟡 | WEB-01 UI | API: 6 unit + 4 e2e green (2026-10-15) |
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
| ❓ open | `business-design.md` §3 lists a CONTABILIDAD role and an open "everyone sees/edits everything + audit trail" model, but the Contadora role was just removed and `CLAUDE.md` forbids role strings outside `common/policy`. Decide in Phase C before touching roles. |

## Phases

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
- [ ] WEB-01 Web leads from hstecnologias.com (`business-design.md` §6 "Formulario web"): table + webhook + list/convert API ✅ 2026-10-15 · ERP page `/solicitudes-web` · production deploy (migration + `WEB_LEADS_KEY`).
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
