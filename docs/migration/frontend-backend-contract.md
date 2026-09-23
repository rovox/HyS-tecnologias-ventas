# Frontend ↔ backend contract (future NestJS + MySQL)

The frontend services are the contract. Mock implementations live under `apps/web/src/services`. REST is implemented in `apps/api` when `VITE_API_MODE=api`.

Base URL: `VITE_API_URL` (POC production: `/api`).

Auth: `Authorization: Bearer <access>`. Mock mode uses a fake `poc.*` token in localStorage.

## Resources (aligned with audited UI)

### Auth
- `POST /auth/login` `{ email, password }` → `{ user, accessToken }` (opens a session)
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/forgot-password` `{ email }`
- `GET /users` (active accounts for vendor pickers; no password)
- `GET /sessions` / `GET /sessions/:id/activity` (admin; activity control)

Accounts are created manually. No public signup. Schema: [microservice-model.md](./microservice-model.md).

### Clients
- `GET /clients`
- `GET /clients/:id`
- `POST /clients`
- `PATCH /clients/:id`
- `DELETE /clients/:id`

### Quotations
- `GET /quotations`
- `POST /quotations` `{ titulo, clienteId, categoria, sucursalId, monto, vendedores[], observacion, estado? }` — default `borrador`
- `POST /quotations/:id/files` multipart field `file` → `archivoPdfUrl`
- `POST /quotations/:id/status` `{ estado, motivoRechazo? }`  `borrador` → `enviado` → `aceptado` | `rechazado`
- `POST /quotations/:id/accept` → `{ quotation, sale }` (quotation stays `aceptado`)
- No `DELETE /quotations`. No biblioteca documents.

### Sucursales / relevamientos / goals
- `GET /sucursales` — Central, Punata, Quillacollo
- `GET/POST /relevamientos` `PATCH /relevamientos/:id` (require `cotizacionId`)
- `GET/PUT /goals?month=YYYY-MM`

### Sales (frozen)
- `GET /sales`
- `GET /sales/:id`
- `POST /sales/:id/jobs`
- `PATCH /sales/:id/jobs/:jobId` `{ estado }`
- `POST /sales/:id/payments`

### Metrics (not a finance module)
- `GET /metrics/sales?month=&userId=` → quotations total, sales total, monthly goal, remaining
- `GET /metrics/activity?month=&userId=` → `{ byVendedor, bySucursal, byCategoria, schedules }`
- `GET /metrics/feed` → recent cotizaciones / relevamientos / tareas / cronograma

### Schedules / cronograma (Nest live)
- `GET /schedules?estado=&sucursalId=&from=&to=&tecnicoId=`
- `GET /schedules/:id`
- `POST /schedules` (ADMIN + VENTAS)
- `PATCH /schedules/:id` (ADMIN + VENTAS + TEC limited)
- `POST /schedules/:id/status` `{ estado }`  allowed: programado → en_proceso → terminado | cancelado
- Payments/observations of jobs remain out of Nest (frozen finance / mock only)

### Tasks
- `GET/POST /tasks`, `PATCH /tasks/:id` — optional `horario`, `cotizacionId`, `scheduleId`

### Internal orders
- `GET /internal-orders`
- `POST /internal-orders`
- `POST /internal-orders/:id/status`  solicitado → aprobado → en_preparación → entregado

### Vehicles / finance / reports pages
Still mock / PocketBase-shaped adapter. Sales widgets use `reportsService` → Nest metrics.
