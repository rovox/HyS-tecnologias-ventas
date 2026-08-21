# Flujo — Cronograma y relevamientos

Modules: Activity overlay calendar, `/schedule`, `/surveys`  
Planning: **Ventas / Admin** · Execution: **Técnicos**

API: Nest `GET/POST/PATCH /api/schedules`, `POST /api/schedules/:id/status`. SPA uses `schedulesService` (`VITE_API_MODE=api`).

---

## Concepts

| Term | Meaning |
|------|---------|
| **Cronograma** | Operational calendar of jobs (`Schedule`) |
| **Trabajo** | Installation/project row (`type`: seguridad \| proyectos) |
| **Relevamiento** | Field survey tied to a quotation (`/api/relevamientos`) |
| **Tarea** | Internal follow-up (`/api/tasks`), optional `scheduleId` |

---

## Who moves what

| Action | Ventas | Admin | Técnicos |
|--------|:------:|:-----:|:--------:|
| Create schedule job | ✓ | ✓ | — |
| Set date/time | ✓ | ✓ | — |
| Assign seller/technician | ✓ | ✓ | — |
| Change execution status | ✓ | ✓ | ✓ |
| Observations | ✓ | ✓ | ✓ |

---

## Job states

```
programado → en_proceso → terminado
         ↘ cancelado
```

No DELETE on Nest schedules — cancel instead.

---

## Data

- Seed creates `sch_andina` (en_proceso) and `sch_mall` (programado) plus a linked task.
- Filters: `estado`, `sucursalId`, `from`, `to`, `tecnicoId`.
- Metrics activity includes `schedules.total` / `byEstado` for the month.

---

## Relevamientos

Still require `cotizacionId`. See [clientes-y-cotizaciones.md](./clientes-y-cotizaciones.md).

Related: [state-machines.md](../state-machines.md), [dashboards-by-role.md](../dashboards-by-role.md).
