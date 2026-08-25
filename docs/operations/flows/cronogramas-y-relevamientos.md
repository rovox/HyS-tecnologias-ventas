# Flujo — Cronograma y relevamientos

Modules: Activity overlay calendar, `/schedule`, `/surveys`  
Planning: **Ventas / Admin** · Execution: **Técnicos** (and Ventas for visits)

API: Nest `GET/POST/PATCH /api/schedules`, `POST /api/schedules/:id/status`. SPA uses `schedulesService` (`VITE_API_MODE=api`).

---

## Concepts

| Term | Meaning |
|------|---------|
| **Cronograma** | Operational calendar of jobs (`Schedule`) plus overlay of task deadlines, quotation `plazoFinal`, and muted visitas |
| **Trabajo** | Installation/project row (`type`: seguridad \| proyectos), optional `quotationId` |
| **Relevamiento / Asistencia** | Visit tied to a quotation (`/api/relevamientos`); secondary visual weight on the calendar |
| **Tarea** | Internal follow-up (`/api/tasks`), optional `cotizacionId` / `scheduleId` |

Urgency chips (`apps/web/src/lib/deadline.js`): overdue, or due within 48 hours. Visitas stay muted.

From a calendar day (`CronogramaQuickModal`): program trabajo (optional existing quotation), tarea (optional quotation), set quotation `plazoFinal`, or move an existing visita.

---

## Who moves what

| Action | Ventas | Admin | Técnicos |
|--------|:------:|:-----:|:--------:|
| Create schedule job | ✓ | ✓ | — |
| Set date/time | ✓ | ✓ | — |
| Assign seller/technician | ✓ | ✓ | — |
| Change execution status | ✓ | ✓ | ✓ |
| Create/edit relevamiento or asistencia | ✓ | ✓ | ✓ |
| Observations | ✓ | ✓ | ✓ |

---

## Job states

```
programado → en_proceso → terminado
         ↘ cancelado
```

No DELETE on Nest schedules — cancel instead.

Money on each job: `monto`, `adelanto`, `saldo` (adeudo). Shown on quotation and client detail.

Filters: `estado`, `sucursalId`, `from`, `to`, `tecnicoId`, **`quotationId`**, **`clienteId`**.

---

## Relevamientos y asistencias

Both **Ventas** and **Técnico** may create and edit **both** types. UI default:

- Ventas → Relevamiento
- Técnico → Asistencia

Fields: `fecha` (atención / start), `fechaFin` (end), `vendedorId`, `tecnicoId`, `tipoVisita`, `cotizacionId` (required on Nest), lugar, notas.

Contadora: no access.

Related: [clientes-y-cotizaciones.md](./clientes-y-cotizaciones.md), [state-machines.md](../state-machines.md), [dashboards-by-role.md](../dashboards-by-role.md).
