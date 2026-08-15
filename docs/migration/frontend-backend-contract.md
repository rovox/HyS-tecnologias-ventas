# Frontend ↔ backend contract (future NestJS)

The frontend services are the contract. Mock implementations live under `apps/web/src/services`. REST repositories are not implemented.

Base URL: `VITE_API_URL` (POC production: `/api`).

Auth: `Authorization: Bearer <access>` (future). POC uses a fake `poc.*` token in localStorage.

## Resources (aligned with audited UI)

### Auth
- `POST /auth/login` `{ email, password }` → `{ user, accessToken }`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/forgot-password` `{ email }`

### Clients
- `GET /clients`
- `GET /clients/:id`
- `POST /clients`
- `PATCH /clients/:id`
- `DELETE /clients/:id`

### Quotations
- `GET /quotations`
- `POST /quotations`
- `PATCH /quotations/:id`
- `POST /quotations/:id/status` `{ estado }`
- `POST /quotations/:id/convert` → `{ quotation, schedule }`  *(POC extension; not in original PB app)*
- `GET/POST /quotation-categories`

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
