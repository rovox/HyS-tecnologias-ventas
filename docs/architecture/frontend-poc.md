# Frontend POC architecture

The current milestone is a **frontend-first proof of concept**. It demonstrates the ERP UI and representative workflows with **in-memory mock data**. It does not use PocketBase at runtime and does not call NestJS.

## Data flow

```
React page / hook
      ↓
services/*          (typed methods matching future NestJS)
      ↓
mocks/store.js      (session-scoped in-memory DB)
```

Existing screens that still call `pb.collection(...)` do **not** talk to PocketBase. `apps/web/src/lib/pocketbaseClient.js` exports a **mock adapter** with a PocketBase-shaped API over the same store. That adapter is a compatibility shim so the audited UI keeps working without rewriting every call in this phase.

New and POC-critical code uses services:

| Service | Methods |
|---------|---------|
| `authService` | login, logout, listDemoAccounts |
| `clientsService` | getAll, getById, create, update, delete |
| `quotationsService` | getAll, create, update, updateStatus, convertToSchedule |
| `schedulesService` | getAll, getById, create, updateStatus, assignTechnician, registerPayment |
| `ordersService` | getAll, create, updateStatus |
| `vehiclesService` | getAll, getById, addFuel |
| `financeService` | movimientos, cajas, gastos, costos |
| `reportsService` | getDashboard (live aggregations) |

Future swap:

```
services/*  →  api/client.js  →  NestJS REST  →  Prisma  →  MySQL
```

Set `VITE_API_MODE=api` only after REST repositories exist. Until then the app stays on mock mode.

## Mock authentication

Fictional accounts, password `Demo1234!`:

| Email | Role | Name |
|-------|------|------|
| julio.admin@demo.hs.local | ADMINISTRADOR | Julio |
| dennis.ventas@demo.hs.local | VENTAS / ADMINISTRACIÓN | Dennis |
| wilson.ventas@demo.hs.local | VENTAS / ADMINISTRACIÓN | Wilson |
| vanesa.ventas@demo.hs.local | VENTAS / ADMINISTRACIÓN | Vanesa |
| elias.ops@demo.hs.local | SEGURIDAD ELECTRÓNICA | Elias |
| elena.conta@demo.hs.local | Contadora | Elena Rojas |

This is **not** production JWT. Tokens are `poc.*` strings in `localStorage`.

## Quotation workflow (mixed)

**Existing product behavior (keep):** biblioteca de documentos (`kind: library`, estado `documento`).

**POC-only extension:** cotización comercial con ítems, subtotal/total, estados:

```
borrador → enviada → aceptada → convertida
                ↘ rechazada
```

`convertToSchedule` creates a job in `schedules` (`programado`). That conversion **did not exist** in the audited PocketBase app.

## Canonical operational states

Jobs (`StateFlowValidator`): `programado → en_proceso → terminado` (+ `cancelado`).

Internal orders: `solicitado → aprobado → en_preparación → entregado` (+ `rechazado` / `cancelado`).

## Horizons

Production Vite config does **not** inject editor scripts, `/hcgi/platform` monkeypatches, or postMessage bridges.

Plugin files under `apps/web/plugins/` are **deferred** (not deleted) so a Horizons editor session can be re-enabled with `VITE_ENABLE_HORIZONS=true`. Default local and production builds ignore them.

CDN logos were replaced with `/branding/*.svg`.

## Local commands

```bash
npm run dev:web     # Vite only — no PocketBase
npm run build:web   # production static build → apps/web/dist
npm run start:web   # vite preview
```

`npm run dev` still starts PocketBase as well (legacy). The POC does not need it.
