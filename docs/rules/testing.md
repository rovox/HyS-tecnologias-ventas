# Local environment and testing

## Run locally

Requirements: Node 22, pnpm 11 (`corepack enable`), Docker.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env          # DATABASE_URL → 127.0.0.1:3307
cp apps/web/.env.example apps/web/.env.local    # VITE_API_URL=http://localhost:3001/api
pnpm db:up        # MySQL in Docker
pnpm db:reset     # drop + migrate + seed (local only)
pnpm dev          # api :3001 + web :3000
```

Root scripts `db:up`, `db:reset`, `dev` (api + web) and `check` exist (item `ENV-02`). `JWT_SECRET` in `apps/api/.env` must not be the `cambiar-en-hostinger` placeholder or the API refuses to start.

Seed accounts come from `config/users.json` (`ROLE_ACCOUNTS` in `config/users.js`): admin `julio@hscontrol.com`, ventas `denis.palacios@hys.com`, contabilidad `estefany.gonzales@hscontrol.com`, técnico `marcos.tec@demo.hs.local`. Password: `config/users.passwords.local.json` if present, else the lowercase first name (`julio`, `denis`, `marcos`). Uploads go to `apps/api/uploads/` (git-ignored).

With the Docker stack (`pnpm local:up`) the api container runs `nest start --watch`. When many files change at once the watcher can restart while the old process still holds port 3001 (`EADDRINUSE` in `docker compose logs api`) and the old code keeps serving: run `docker compose restart api`. Every api container start also re-runs the seed (upserts).

## Checks

```bash
pnpm check
# = pnpm --filter @hs-erp/api build && pnpm --filter @hs-erp/api test && pnpm --filter @hs-erp/api test:e2e
#   && pnpm --filter @hs-erp/web lint && pnpm --filter @hs-erp/web build && npx knip
```

In local dev (`pnpm dev` sets `API_STRICT_DTO=1`) the API runs with `forbidNonWhitelisted: true`: if the UI sends a field the API does not know, you get a 400 instead of a silent drop. This is how "works only in the frontend" bugs are found.

## Smoke test (run per role after each change to a flow)

| # | Role | Steps | Expected |
|---|---|---|---|
| S1 | all | Login, open each menu item | Every screen loads, no console errors, no 404/400 in Network |
| S2 | ventas | Create client → survey with photo → quotation with PDF | Appears in lists without reload |
| S3 | ventas | Quotation flow: send (PDF) → reject (reason) → reopen → delete (reason) → restore → approve | Each step confirmed and notified; approved one moves to Cerradas and creates the project; other tab updates live (`node scripts/smoke-quotations.mjs`) |
| S4 | técnico | Own job on the phone: start → payment → finish | Status and balance change live for ventas (`node scripts/smoke-schedule.mjs`) |
| S5 | ventas | Project: advance + payment, new job, deliver (jobs done), close (no debt) | Balance from the API, refused transitions explain why, other tab updates live (`node scripts/smoke-projects.mjs`) |
| S6 | técnico/admin | Create internal order → approve → deliver | Status flow respected |
| S7 | técnico | Try `/quotations`, `/ventas-directas` | Redirected; API returns 403 |
| S9 | técnico, admin, ventas | Expense paid by the técnico → observed → corrected → validated into a box → refunded; a project payment reaches the admin inbox live | `node scripts/smoke-finance.mjs` |
| S10 | ventas, admin, técnico | Client list without tags, filters, create/edit (live in another session), client page with balance and warranty, quotation from the client | `node scripts/smoke-clients.mjs` |
| S11 | contabilidad | Libro: totals above the rows, header stuck under the app header while scrolling, hide/move a column (kept after reload, reset), fold/unfold groups keeping subtotals | `node scripts/smoke-lists.mjs` |
| S12 | ventas, admin | Tasks in Cotizaciones: red counter for tasks nobody is in charge of, Tomar (live for the other session), hand over with a deadline, green Completar → Archivadas → Reabrir; green ✓ with no tasks of my own | `node scripts/smoke-tasks.mjs` |
| S13 | ventas (Punata), contabilidad | Direct sale from Inventario › Vender (own branch or Central), note opens, stock and ledger move live; annul with reason (stock back, note ANULADA); Corregir linked | `node scripts/smoke-direct-sales.mjs` |
| S14 | ventas (Punata) | Inventario on his branch; Agregar material only into Central; move two products Central → Punata at once; Quitar material with reason; Historial "Quitados"; kardex ends on the branch stock | `node scripts/smoke-inventory-branch.mjs` |
| S15 | ventas (Punata), contabilidad | Cierre del día: count notes and coins, red light until a reason, close (read-only); Contabilidad reviews it in Cierres; an advance late in Anticipos, marked rendido | `node scripts/smoke-cierre-caja.mjs` |
| S16 | ventas | Tienda Digicorp: catalog with photos and last update, search, brand, a product with "Ver en Digicorp" (needs one load by Gerencia) | `node scripts/smoke-digicorp.mjs` |
| S17 | ventas, contabilidad | Dashboard money and today per branch; quick actions open their form; /reports → dashboard; activity for Gerencia; quotation row Duplicar and Tarea | `node scripts/smoke-dashboard.mjs` |
| S18 | admin, ventas, contabilidad, técnico | Session closed elsewhere (or expired) while a screen is open → next screen goes to `/login` with "Tu sesión venció", storage cleared, never a blank page; a "Recordarme" off session survives a reload | `node scripts/smoke-session.mjs` |
| S8 | all | Edit in tab A | Tab B updates with no reload, also after going offline and back (`node scripts/realtime-check.mjs`) |

## Automated (target)

- API: unit tests for policy, state machine, payment math; e2e per endpoint used by the web.
- Web: Playwright for S2–S8 against the local stack, in CI before merge.

## Staging

Only after local is green: a separate Hostinger Node app + separate MySQL, deployed from `develop`. Production deploys only from `main`.
