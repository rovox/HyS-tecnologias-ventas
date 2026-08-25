# API vs frontend coverage (sales)

English ops note for Hostinger go-live. SPA production stays `VITE_API_MODE=mock` until `/api/health` and `/api/health/db` succeed.

## In schema and Nest (this branch)

Users + JWT sessions, sucursales (Central, Punata, Quillacollo — data migration, not seed), clients (no DELETE), quotations `borrador → enviado → aceptado|rechazado` (cliente optional on quick-create), PDF + `licitacion`/`prerequisito` files, relevamientos, seller goals, metrics, schedules, tasks.

**Quotation-task pool:** `Task.tipo=cotizacion`, `prioridadMotivo`, `asignadoAt`/`asignadoPorId`, FK `cotizacionId`. `POST /api/tasks/:id/claim` (409 if taken). Ventas + Admin, any sucursal. Contadora and técnicos do not access quotations or this pool.

Quick create: **description is the only required field**. Title is the first line of that description. Client, plazo, priority, files, and assignee are optional. Completing a task hides it from the band.

## Frontend wired (mock + HTTP)

Clients, quotations + PDF, surveys, schedules, tasks (incl. claim), goals, metrics/activity feed, quotation-task band (`QuotationTasksBand` + `QuotationTaskCreateModal`).

## Present in API, unused or partial in UI

`GET /auth/me`, `GET /sessions`, `GET /sucursales` (some lists still PocketBase), `GET/POST /categories` (UI chips are localStorage). Frozen `/sales/*` (admin writes).

## Out of scope

Finance, vehicles, internal orders, marketing, quotation biblioteca (`kind: library`).

## Hostinger phases

- **A (repo):** `migration/backend-api`, CI commits `apps/api/dist`, MariaDB adapter, phpMyAdmin SQL, no VPS, no seed.
- **B (manual):** Node health + DB health.
- **C:** First admin (deferred), then `VITE_API_MODE=api`. SPA band UX can ship on mock first.
