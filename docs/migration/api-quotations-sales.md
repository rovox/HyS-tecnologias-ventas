# API phase 1 — quotations and sales (sketch)

PocketBase → **NestJS + Prisma + MySQL** on Hostinger. First delivery: one microservice for the commercial domain. The rest of the ERP stays on the frontend mock until later services exist.

**This file is a sketch.** Do not implement Nest/Prisma in the frontend-POC pass. Canonical model: [microservice-model.md](./microservice-model.md).

UI contract today: `apps/web/src/services/quotations` and `clients`. Do not reimplement the full calendar here; jobs are stored so they can show on the schedule.

## Scope

| Includes | Does not include |
|----------|------------------|
| Manual users + login JWT + sessions/activity | Public signup |
| Clients (short CRUD, three categories) | Finance, cajas, costos, egresos/ingresos |
| Commercial quotations + attachments | Internal orders, marketing |
| Accept quotation → **sale** | Nest monolith of every module |
| Jobs **on the sale** (calendar rows) | PocketBase removal |
| Payments against the sale total | Field visits / relevamientos |
| Sales-goal metrics (month, remaining) | BI / P&amp;L |

## Business flow

```
Client
  └── Quotation (enviada)  amount, sellers+%, attachments
        └── accepted
              └── Sale
                    ├── total = quotation.amount
                    ├── collected = Σ payments
                    ├── balance = total − collected
                    └── Jobs → calendar
```

Rules:

1. New quotation = `enviada`. Code `COT-MMDDYY` (+ suffix on collision).
2. No line-items. `amount` is declared; detail is in files.
3. Creator commission = 100% if they are the only seller.
4. `POST /quotations/:id/accept` creates the sale once.
5. Job amounts must not exceed `sale.total` (warn or block).
6. Payments must not exceed `sale.total`.
7. Rejecting a quotation does not create a sale.

## Hostinger service (when implementation starts)

One Node 22 Web App + one MySQL database:

```
apps/api/sales/
  src/
    auth/            # login + sessions + activity
    users/           # manual accounts, monthlyGoalBs
    clients/
    quotations/
    sales/           # sales + jobs + payments
    files/
  prisma/
```

App name suggestion: `hys-sales-api`. Base path: `/api`. Frontend: `VITE_API_MODE=api` and `VITE_API_URL`.

## Implementation order (later)

1. Scaffold Nest + Prisma + MySQL on Hostinger.
2. Users (manual) + `POST /auth/login` + session/activity rows. Same four POC roles. JWT.
3. Clients CRUD with three categories (`seguridad_electronica`, `equipos_tecnologia`, `proyectos`).
4. Quotations: create (`enviada`), list/filter, status, files.
5. Sales: `accept` → sale; jobs; payments.
6. Metrics: month quotations/sales totals, goal, remaining.
7. Frontend HTTP adapters behind existing services. Do not rewrite screens.

## Endpoints (sketch)

### Auth / users

- `POST /auth/login` `{ email, password }` → `{ user, accessToken }` (opens a session)
- `GET /auth/me`
- `POST /auth/logout` (closes session)
- `GET /sessions` / `GET /sessions/:id/activity` (admin)

### Clients

- `GET /clients?q=`
- `POST /clients`
- `GET /clients/:id`
- `PATCH /clients/:id`

### Quotations

- `GET /quotations?estado=&vendedorId=&sucursalId=`
- `POST /quotations` `{ titulo, clienteId, categoria, subcategoria, sucursalId, monto, vendedores[], observacion }`
- `GET /quotations/:id`
- `POST /quotations/:id/files`
- `POST /quotations/:id/status` `{ estado: aceptada | rechazada }`
- `POST /quotations/:id/accept` → `{ quotation, sale }`

### Sales

- `GET /sales`
- `GET /sales/:id`
- `POST /sales/:id/jobs` `{ titulo, asignadoId?, monto? }`
- `PATCH /sales/:id/jobs/:jobId` `{ estado }`
- `POST /sales/:id/payments` `{ monto, metodo, nota }`

Job states: `programado | en_proceso | terminado | cancelado`.

### Metrics

- `GET /metrics/sales?month=` → `{ quotationsTotal, salesTotal, goalBs, remainingBs }` per current user (or `?userId=` for admin)

See [backend-status.md](./backend-status.md) and [frontend-backend-contract.md](./frontend-backend-contract.md).
