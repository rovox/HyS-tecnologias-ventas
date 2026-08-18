# Backend agent notes (`apps/api`)

Placeholder for NestJS microservices. **Do not implement Nest/Prisma in the frontend-POC milestone.** Model first; see `docs/migration/microservice-model.md`.

## Target

- NestJS + Prisma + **MySQL** (Hostinger allows MySQL only).
- One Hostinger Node app and **one MySQL database per microservice**.
- pnpm workspace. No npm/yarn. No Next.js backend.

## First service (sales)

Manual user accounts, login sessions + activity, clients, quotations, sales, jobs for the calendar, sales-goal metrics.

Not in this service: finance/caja, operational costs, egresos/ingresos, full schedule ownership (jobs are created so they can appear on the calendar).

## Layout (when implementation starts)

```
apps/api/
  sales/          # first NestJS service + its Prisma/MySQL schema
  operations/     # later, own DB
```

Frontend keeps `apps/web/src/services/*` method names. REST adapters come after the schema is agreed.

## Language

Documentation: English. Code comments: Spanish.
