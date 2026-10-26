# Dashboard (Inicio) — priority 1

**Status:** 🟡 `/dashboard` loads for all three roles; it does not follow the target layout yet.

## Purpose
Home, ordered from most to least urgent (`business-design.md` §6):
1. **Quick actions:** Nueva cotización · Registrar cobro · Registrar gasto · Nueva asistencia · Nuevo relevamiento.
2. **Requiere atención:** overdue/urgent asistencias, movimientos por validar, proyectos con saldo sin cobro en 30 días, cotizaciones enviadas sin respuesta en 7 días, stock bajo, reembolsos pendientes.
3. **Recent activity** (realtime), 4. **Hoy y esta semana**, 5. **Indicadores del mes** (cotizado, aceptado, cobrado, por cobrar, gastos, margen; gerencia sees all).

Each profile sees its own first (técnico: "Mis actividades y asistencias"). Numbers come from the API, never computed only in the UI.

## Health (S1, 2026-10-12, with the PLAT-01 temporary fix)
| Screen | admin | ventas | técnico |
|---|---|---|---|
| `/dashboard` | ✅ | ✅ | ✅ (very short: 228 chars) |

## Checklist
- [ ] DASH-01 Quick-actions row (depends on the forms of Quotations, Finance).
- [ ] DASH-02 "Requiere atención" block with API-computed counters (needs Projects + Finance + Inventory).
- [ ] DASH-03 Recent-activity feed from the audit log (RT-01) + SSE (RT-02).
- [ ] DASH-04 Month indicators per role; técnico home = own activities.

## Smoke steps
1. Each role logs in and lands on `/dashboard` with no console errors (S1).
2. Creating a quotation/cobro in tab A updates the counters and feed in tab B (S8).
