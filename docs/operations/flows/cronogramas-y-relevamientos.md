# Flujo — Cronograma y relevamientos

Modules: Activity overlay calendar, `/schedule`, `/surveys`  
Planning: **Ventas / Admin** · Execution: **Técnicos** (and Ventas for visits)

API: Nest `GET/POST/PATCH /api/schedules`, `POST /api/schedules/:id/status`, `GET/POST /api/schedules/:id/payments`. SPA uses `schedulesService` (`VITE_API_MODE=api`). Realtime: `GET /api/realtime/events` (SSE).

---

## Concepts

| Term | Meaning |
|------|---------|
| **Cronograma** | Calendar of **jobs only** (`Schedule` type `seguridad` \| `proyectos`), plus task deadlines / quotation `plazoFinal` |
| **Trabajo** | Installation/project row, optional `quotationId` — primary visual events |
| **Relevamiento / Asistencia** | Visit on `/surveys` (`/api/relevamientos`); **not** calendar cards. Pending visits show as a **subtle day indicator** (icon/count) that links to `/surveys?fecha=` |
| **Tarea** | Internal follow-up (`/api/tasks`), optional `cotizacionId` / `scheduleId` |

Urgency chips (`apps/web/src/lib/deadline.js`): overdue, or due within 48 hours.

From a calendar day (`CronogramaQuickModal`): program **trabajo**, **tarea**, or set quotation `plazoFinal`. Visits are managed on `/surveys` only.

---

## Who moves what

| Action | Ventas | Admin | Técnicos |
|--------|:------:|:-----:|:--------:|
| Create schedule job | ✓ | ✓ | — |
| Set date/time | ✓ | ✓ | — |
| Assign seller/technician | ✓ | ✓ | — |
| Change execution status | ✓ | ✓ | ✓ |
| Create/edit relevamiento or asistencia | ✓ | ✓ | ✓ |
| Resolve visit (requires photo) | ✓ | ✓ | ✓ |
| Register payment (adelanto/cobro/extra_asistencia) | ✓ | ✓ | ✓ |
| Observations | ✓ | ✓ | ✓ |

---

## Job states

```
programado → en_proceso → terminado
         ↘ cancelado
```

No DELETE on Nest schedules — cancel instead.

Money: `monto`, payments ledger (`adelanto` \| `cobro` update saldo; `extra_asistencia` is outside installation budget).

Filters: `estado`, `sucursalId`, `from`, `to`, `tecnicoId`, **`quotationId`**, **`clienteId`**.

---

## Relevamientos y asistencias

Both **Ventas** and **Técnico** may create and edit **both** types. UI default:

- Ventas → Relevamiento
- Técnico → Asistencia

Fields: `fecha`, `fechaFin`, `vendedorId`, `tecnicoId`, `tipoVisita`, `cotizacionId` (required), `estado`, `prioridad`, lugar, notas, `fotosUrl`.

**Resolve gate:** transition to `resuelto` requires ≥1 photo (`POST /api/relevamientos/:id/files`).

Contadora: no access.

Related: [clientes-y-cotizaciones.md](./clientes-y-cotizaciones.md), [state-machines.md](../state-machines.md), [dashboards-by-role.md](../dashboards-by-role.md).
