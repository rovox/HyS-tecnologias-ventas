# API vs frontend coverage (sales)

English ops note for Hostinger go-live. Health gates (`/api/health` + `/api/health/db`) succeeded; SPA production is `VITE_API_MODE=api` against lime-chamois.

## In schema and Nest (this branch)

Users + JWT sessions, sucursales, clients (no DELETE), quotations `borrador → enviado → aceptado|rechazado`, PDF + files, relevamientos (`estado`/`prioridad` + photo upload), seller goals, metrics, schedules + **`schedule_payments`**, tasks, **realtime SSE** (`POST /api/realtime/ticket`, `GET /api/realtime/events`).

**Quotation-task pool:** `Task.tipo=cotizacion`, claim, band UX opens **task detail** (not edit-quote modal).

**Payments:** `GET/POST /api/schedules/:id/payments` — tipos `adelanto` \| `cobro` \| `extra_asistencia` (extras do not reduce installation saldo).

**Relevamiento files:** `POST /api/relevamientos/:id/files` → `UPLOAD_DIR/relevamientos`; resolve to `resuelto` requires ≥1 photo.

## Frontend wired (mock + HTTP)

Clients, quotations + PDF, surveys (+ photo/priority), schedules (calendar jobs + visit indicators), payments, tasks (FAB + claim + detail sheet), goals, metrics/activity feed, quotation-task band, quotation jobs block (money summary), user profile `/usuarios/:id`, realtime refresh hook.

## Present in API, unused or partial in UI

`GET /auth/me`, `GET /sessions`, `GET /sucursales` (some lists still PocketBase), `GET/POST /categories` (UI chips are localStorage). Frozen `/sales/*` (admin writes).

## Out of scope

Finance, vehicles, internal orders, marketing, quotation biblioteca (`kind: library`).

## Hostinger phases

- **A (repo):** `migration/backend-api`, CI commits `apps/api/dist`, MariaDB adapter, phpMyAdmin SQL, no VPS, no seed.
- **B (manual):** Node health + DB health — **done**.
- **C (go-live):** SPA Git branch `migration/backend-api`, Actions builds with `VITE_API_MODE=api` and `VITE_API_URL=https://lime-chamois-337700.hostingersite.com/api`. Login uses Nest bootstrap admin (rotate password after first login). Swagger stays off unless `ENABLE_SWAGGER=1`.
