# Microservice model (MySQL, NestJS)

Prisma schema: [`apps/api/prisma/schema.prisma`](../../apps/api/prisma/schema.prisma). Hostinger provides **MySQL** only. Later services get their own database.

Frontend contract stays `apps/web/src/services/*`.

## First service: sales

Users (manual), sessions/activity, clients, quotations (PDF on disk), relevamientos, monthly seller goals, sales, jobs, payments, activity metrics.

Out of scope: finance module, operational costs, egresos/ingresos, cash registers, quotation biblioteca, TypeORM.

```
Sucursal (Central | Punata | Quillacollo)
User ──< Session ──< Activity
  │
  ├── SellerGoal (month, metaMonto, metaCotiz)
  │
Client ──< Quotation ──< Sale ──< Job (frozen)
                 │           └──< Payment (frozen)
                 ├── QuotationSeller (commissionPct)
                 ├── archivoPdfUrl (file on UPLOAD_DIR)
                 └── Relevamiento (cotizacionId required)
```

IDs stay strings (`suc_central`, `usr_ventas`). No bigint rewrite.

### sucursales

Exactly three rows: `suc_central` Central, `suc_punata` Punata, `suc_quillacollo` Quillacollo.

### users

Created **manually**. No public signup. `sucursalId` FK. Roles unchanged.

### quotations

```
borrador → enviado → aceptado | rechazado
```

- **borrador:** PDF optional. **enviado:** PDF required.
- Sole seller = 100% commission. Several sellers: percentages sum to 100.
- No line-items. No hard delete. No biblioteca.
- `aceptado` may open a Sale once; quotation stays `aceptado`.
- PDF: multipart → `UPLOAD_DIR`; URL stored in `archivoPdfUrl`.

### relevamientos

Require `cotizacionId`. Photos may be URL/JSON for now.

### metas_vendedores (`SellerGoal`)

Unique `(usuarioId, mes)` — first day of month. `metaMonto` + `metaCotiz`.

### metrics

`GET /metrics/sales` and `GET /metrics/activity?month=` (by seller and by branch). Not a P&L.

Sales, jobs, payments stay frozen.

See [backend-status.md](./backend-status.md) and [api-quotations-sales.md](./api-quotations-sales.md).
