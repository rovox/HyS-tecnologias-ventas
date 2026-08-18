# Frontend ↔ backend contract (future NestJS + MySQL)

The frontend services are the contract. Mock implementations live under `apps/web/src/services`. REST repositories are not implemented.

Base URL: `VITE_API_URL` (POC production: `/api`).

Auth: `Authorization: Bearer <access>` (future). POC uses a fake `poc.*` token in localStorage.

## Resources (aligned with audited UI)

### Auth
- `POST /auth/login` `{ email, password }` → `{ user, accessToken }` (opens a session)
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/forgot-password` `{ email }`
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
- `POST /quotations`  `{ titulo, clienteId, categoria, subcategoria, sucursalId, monto, vendedores[], observacion }` — estado inicial `enviada`
- `POST /quotations/:id/files`
- `POST /quotations/:id/status` `{ estado }`  enviada → aceptada | rechazada
- `POST /quotations/:id/accept` → `{ quotation, sale }`

### Sales (fase 1 API)
- `GET /sales/:id`
- `POST /sales/:id/jobs`
- `POST /sales/:id/payments`

### Metrics (not a finance module)
- `GET /metrics/sales?month=` → quotations total, sales total, monthly goal, remaining

Detalle: [api-quotations-sales.md](./api-quotations-sales.md). Schema: [microservice-model.md](./microservice-model.md).

### Schedules / jobs
- `GET /schedules`
- `GET /schedules/:id`
- `POST /schedules`
- `PATCH /schedules/:id`
- `POST /schedules/:id/status` `{ estado }`  allowed: programado → en_proceso → terminado | cancelado
- `POST /schedules/:id/payments`
- `POST /schedules/:id/observations`

### Internal orders
- `GET /internal-orders`
- `POST /internal-orders`
- `POST /internal-orders/:id/status`  solicitado → aprobado → en_preparación → entregado

### Vehicles / finance / reports
Mirror `vehiclesService`, `financeService`, `reportsService`.

Roles stay the four audited strings until a permissions table exists.
