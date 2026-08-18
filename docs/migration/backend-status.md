# Backend status

```
Backend re-engineering: PENDING
Target: NestJS + Prisma + MySQL
PocketBase: legacy/reference only
Horizons: target dependency removed
```

## Intentionally not done in this phase

- PocketBase collection migration
- MySQL schema / Prisma migrations for the ERP
- JWT production authentication
- File storage migration (`pb_data/storage`)
- Financial transaction integrity
- NestJS production API
- Removal of `apps/pocketbase/`
- Mechanical rewrite of remaining `pb.collection(...)` calls to HTTP

`apps/pocketbase` remains in the repo as the audited legacy system. The frontend POC does not start it (`pnpm dev:web`).

## Future migration order (do not start from this document)

```
Auth (mínimo)
  ↓
Clients + Quotations + Sales   ← FASE 1 (microservicio Hostinger)
  ↓
Operations / cronograma (otro servicio o módulo)
  ↓
Internal Orders
  ↓
Vehicles
  ↓
Finance
  ↓
Reports
  ↓
PocketBase removal
```

Plan detallado de la fase 1: [api-quotations-sales.md](./api-quotations-sales.md).

Intended NestJS layout (empty — documentation only):

```
apps/api/
├── src/
│   ├── auth/
│   ├── users/
│   ├── roles/
│   ├── organization/
│   ├── clients/
│   ├── operations/
│   ├── internal-orders/
│   ├── vehicles/
│   ├── quotations/
│   ├── marketing/
│   ├── finance/
│   ├── accounting/
│   ├── files/
│   ├── audit/
│   └── reports/
└── prisma/
```
