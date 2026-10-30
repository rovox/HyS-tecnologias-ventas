# CLAUDE.md

Entry point for any AI agent working in this repository. Keep this file short; details live in `docs/rules/`, `docs/modules/` and `docs/domain/business-design.md`.

## 1. What this is

Internal ERP for **H&S Tecnologías** (electronic security and networking, Cochabamba).
Core flow (see `docs/domain/business-design.md`): **client → relevamiento → quotation → Proyecto (accepted quotation) → Actividades in the Cronograma, internal orders, Movimientos (cobros/gastos) → reports.**
Use the vocabulary of `business-design.md` (Proyecto, Actividad, Asistencia, Movimiento, Caja, Venta directa). The current code still uses older names (Schedule, SchedulePayment, Sale); the target model is Phase C of `docs/STATUS.md`.

| Path | Stack |
|---|---|
| `apps/api` | NestJS 11, Prisma 6, MariaDB 11.8 (Hostinger; local and CI use the same) |
| `apps/web` | React 18 (JS, migrating to TS), Vite, Tailwind 3, shadcn/ui |

## 2. Read before working

| When you… | Read |
|---|---|
| start any task | `docs/domain/business-design.md` (source of truth: vocabulary, flows, roles, priorities), then `docs/STATUS.md` (module board, decisions, phases, the only progress tracker) |
| work on a priority-1 module | its file in `docs/modules/` (clients, quotations, projects, finance, dashboard) |
| design or move code | `docs/rules/architecture.md` |
| touch the API | `docs/rules/backend.md`, `docs/rules/database.md` |
| touch the UI | `docs/rules/frontend.md`, `docs/rules/theme.md` |
| add/remove a package | `docs/rules/libraries.md`, `docs/rules/performance.md` |
| run or test anything | `docs/rules/testing.md` |
| are asked about Sales | There is no "Sales" module: sales = **Proyectos** + **Ventas directas** (`business-design.md` §2, §4.3) |

## 3. Environment

**Local first.** All development and testing happens on the local stack (`docs/rules/testing.md`). Never point the app, a script or a migration at the Hostinger database or API, and nothing reaches Hostinger before the local promotion gate (`docs/STATUS.md`, LOCAL-04) passes.

**Production database, the only exception:** read-only inspection through `ssh hostinger-hs` (backup, `information_schema`, row counts, `SHOW CREATE TABLE`) in a single session, with credentials read on the server and never printed or copied. Any write is a reviewed SQL script applied only after explicit approval, in one session, after a backup (`docs/rules/database.md`, "Reading production safely"). Do not use the Hostinger MCP connector for database work (it refuses connections under many requests).

```bash
pnpm install
pnpm db:up && pnpm db:reset      # local MySQL in Docker + migrations + seed
pnpm dev                          # api :3001 + web :3000
pnpm check                        # lint + build + unit + e2e + knip
```

See `docs/rules/testing.md` for details.

## 4. Workflow

1. Pick an item from `docs/STATUS.md` (module board → next item). Work on **one item per branch** (`feat/<id>`, `fix/<id>`).
2. For changes touching >3 files: post a plan (files, risk, how you will verify). **Wait for approval** if it changes the DB schema, auth/roles, or deletes >300 lines.
3. Search before creating: a helper, hook, constant or endpoint may already exist.
4. Keep diffs small (target <400 lines). Never mix refactor and new behavior in one commit.
5. Verify (see §6). If you could not verify something, say so explicitly.
6. Update the item (and the board row's *last verified*) in `docs/STATUS.md` in the same commit (`[x]` + date). A module without a file in `docs/modules/` gets one only when its phase starts. Do not create new status or report files.

## 5. Hard rules

- No direct HTTP calls from pages/components; only through `features/<x>/api.js` hooks.
- No Prisma in controllers. No role strings outside `common/policy` / `constants/roles`.
- Business rules (balances, totals, state transitions) live in the **API**, never only in the UI.
- Every mutation emits a realtime event; every list reacts to it (`docs/rules/frontend.md#realtime`).
- No silent fallbacks: never `catch(() => [])` or fake a success. Show the error.
- No new dependency without a written reason in the plan.
- Never edit `dist/`, `.github/workflows`, Hostinger settings or the production branch without explicit approval.
- No secrets in code, committed `.env` files or logs.

## 6. Definition of done

- `pnpm check` passes (paste the summary).
- The affected smoke-test step in `docs/rules/testing.md` was run locally, per role.
- No new orphans reported by `knip`.
- `docs/STATUS.md` updated.
- Final message: what changed, how it was verified, what is pending.
