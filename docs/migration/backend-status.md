# Backend status

```
Backend re-engineering: PENDING (model only)
Target: NestJS + Prisma + MySQL (Hostinger)
PocketBase: legacy/reference only
Horizons: target dependency removed
```

This milestone does **not** scaffold NestJS or run Prisma. Schema intent: [microservice-model.md](./microservice-model.md).

## Intentionally not done in this phase

- NestJS production API / Prisma migrations
- PocketBase collection migration
- JWT production authentication
- File storage migration (`pb_data/storage`)
- Finance module (costos, egresos, ingresos, cajas)
- Removal of `apps/pocketbase/`
- Mechanical rewrite of remaining `pb.collection(...)` calls to HTTP

`apps/pocketbase` remains as the audited legacy system. The frontend POC does not start it (`pnpm dev:web`).

## Migration order

```
Model (this pass)
  ↓
Users (manual) + sessions/activity
  ↓
Clients + Quotations + Sales + Jobs   ← first Hostinger MySQL service
  ↓
Operations / calendar owner
  ↓
Internal orders
  ↓
Vehicles
  ↓
Finance (later)
  ↓
PocketBase removal
```

Phase 1 API sketch: [api-quotations-sales.md](./api-quotations-sales.md). Frontend contract: [frontend-backend-contract.md](./frontend-backend-contract.md).

Intended layout when implementation starts (empty until then):

```
apps/api/
├── agent.md
└── sales/          # first NestJS microservice + its MySQL schema
    ├── src/
    └── prisma/
```
