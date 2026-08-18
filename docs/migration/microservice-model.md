# Microservice model (MySQL, NestJS later)

Model-only. No Prisma schema or NestJS code in this milestone. Hostinger provides **MySQL** only. Each NestJS microservice will use its own database when implementation starts.

Frontend contract stays `apps/web/src/services/*`.

## First service: sales

Users (manual), sessions/activity, clients, quotations, sales, jobs for the calendar, sales-goal metrics.

Out of scope: finance module, operational costs, egresos/ingresos, cash registers.

```
User ──< Session ──< Activity
  │
  ├── monthlyGoalBs (sales role)
  │
Client ──< Quotation ──< Sale ──< Job (calendar)
                 │           └──< Payment (against sale total only)
                 └── files (attachments, no line-items)
```

### users

Created **manually** by an administrator. No public signup.

| Field | Notes |
|-------|--------|
| id | UUID |
| email | unique |
| passwordHash | later; POC uses demo passwords |
| name | |
| role | `ADMINISTRADOR`, `VENTAS / ADMINISTRACIÓN`, `SEGURIDAD ELECTRÓNICA`, `Contadora` |
| monthlyGoalBs | sales users; monthly economic target |
| active | |

### sessions and activity

Opened on login so an admin can see what an account did and when.

| Entity | Fields |
|--------|--------|
| Session | userId, startedAt, endedAt, ip?, userAgent? |
| Activity | sessionId, userId, action, entityType?, entityId?, at |

Not a BI product. Enough to control user activity.

### clients

Same three commercial categories as quotations.

| id | UI label |
|----|----------|
| `seguridad_electronica` | Seguridad Electrónica |
| `insumos_tecnologicos` | Equipos y tecnología (panels, PCs, laptops, routers, printers, 3D, etc.) |
| `proyectos` | Proyectos |

`ClientFormModal` shows all three (same labels as quotations). Subcategories: SE Instalaciones / Asistencias; Proyectos Redes/Datos / Eléctrico; Equipos y tecnología optional free text.

Minimum fields: name (required), category, contact, email, phone, address, notes.

### quotations → sales → jobs

```
Client
  └── Quotation (enviada → aceptada | rechazada)
        └── accepted → Sale
              └── Jobs → calendar
```

- New quotation starts as `enviada`. Code `COT-MMDDYY` (+ suffix same day).
- No line-items. `amount` is declared; detail lives in attachments.
- Accept once → Sale (`total` = quotation amount).
- Jobs belong to the sale so they appear on the schedule. Job states: `programado`, `en_proceso`, `terminado`, `cancelado`.
- Payments against the sale must not exceed `sale.total`. Not a general ledger.

### metrics (not a finance module)

Dashboard numbers only:

- Accumulated quotations (e.g. month, by sales user).
- Accumulated sales.
- Each sales user’s monthly goal (`monthlyGoalBs`).
- Remaining: `goal − sales` for the month.

No P&amp;L, no cost intelligence.

## Later services (own MySQL each)

1. Operations / calendar owner (visits, field schedule)
2. Internal orders
3. Vehicles
4. Finance (deferred)

See [backend-status.md](./backend-status.md) and [api-quotations-sales.md](./api-quotations-sales.md).
