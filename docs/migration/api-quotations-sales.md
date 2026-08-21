# API phase 1 — quotations and sales

PocketBase → **NestJS + Prisma + MySQL** on Hostinger. One sales microservice. The rest of the ERP stays on the frontend mock until later services exist.

Implemented in [`apps/api`](../../apps/api). Hostinger production: [hostinger-api.md](../deployment/hostinger-api.md). Model: [microservice-model.md](./microservice-model.md).

## Scope

Includes: manual users + JWT + sessions, clients, commercial quotations + real PDF files, relevamientos, monthly seller goals, accept → sale (frozen jobs/payments), activity metrics.

Does not include: public signup, finance, biblioteca documents, TypeORM, calendar owner service.

## Business flow

```
borrador → enviado → aceptado | rechazado
                 └── accept once → Sale (quotation stays aceptado)
```

Rules:

1. Create as `borrador` or `enviado`. Code `COT-MMDDYY` (+ suffix on collision).
2. No line-items. Detail lives in the PDF.
3. Creator commission = 100% if they are the only seller; else sum must be 100.
4. `enviado` requires `archivoPdfUrl`. Multipart `POST /quotations/:id/files`.
5. `POST /quotations/:id/accept` creates the sale once; estado stays `aceptado`.
6. No `DELETE /quotations`. Rejecting does not create a sale.

## Endpoints

- Auth/users/sessions: unchanged
- `GET /sucursales`
- Clients CRUD (delete blocked if any quotations exist)
- Quotations list/create/status/accept + multipart files
- `GET /files/quotations/:name`
- Relevamientos `GET/POST/PATCH`
- `GET/PUT /goals?month=`
- `GET /metrics/sales?month=`
- `GET /metrics/activity?month=`
- Sales/jobs/payments frozen

See [backend-status.md](./backend-status.md) and [frontend-backend-contract.md](./frontend-backend-contract.md).
