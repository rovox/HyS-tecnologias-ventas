# Backend status

```
Backend re-engineering: sales NestJS + Prisma aligned to registration (3 sucursales, PDF, states, relevamientos, goals).
Hostinger API deploy: documented, not started.
Target: NestJS + Prisma + MySQL (Hostinger Node Web App, not the SPA instance)
PocketBase: legacy/reference only
```

The sales API lives in [`apps/api`](../../apps/api). Local MySQL: `apps/api/docker-compose.yml`. The SPA still defaults to `VITE_API_MODE=mock`.

## Intentionally not done

- Hostinger production deploy of this API (see [hostinger-api.md](../deployment/hostinger-api.md))
- Finance module (costos, egresos, ingresos, cajas)
- Removal of `apps/pocketbase/`
- Rewrite of remaining `pb.collection(...)` UI to HTTP

## Layout

```
apps/api/
├── prisma/schema.prisma
└── src/   auth, clients, quotations, sucursales, relevamientos, goals, sales, metrics
```

Phase 1: [api-quotations-sales.md](./api-quotations-sales.md). Contract: [frontend-backend-contract.md](./frontend-backend-contract.md).
