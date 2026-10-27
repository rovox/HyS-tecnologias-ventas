# Dashboard (Inicio) — priority 1

**Status:** 🟢 DASH-01/02 (2026-10-27): quick actions per role, the month's real money, today per branch, commercial metrics and (Gerencia) the latest activity. Panel de control and Reportes were merged here and removed (PLAT-07).

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
- [x] DASH-01 Quick-actions row (2026-10-27): Nueva venta · Cierre del día · Nueva cotización · Programar trabajo · Agregar material · Mover material (each opens its form at once: `?vender=1`, `?programar=1`, `?accion=`); técnico: Mis trabajos.
- [ ] DASH-02 "Requiere atención" block with API-computed counters (needs Projects + Finance + Inventory).
- [x] DASH-03 Recent-activity feed from the audit log for Gerencia (2026-10-27, `ActivityFeed`, refreshed every minute).
- [x] DASH-04 Month money (2026-10-27, `GET /finance/resumen`, `monthMoney`): Cobrado (waiting + validated), En caja (validated), Egresos validados, Neto; every box balance; today per branch: direct sales and whether its cash was closed. Commercial metrics (quotations, sales goal) kept.

## Smoke steps
1. Each role logs in and lands on `/dashboard` with no console errors (S1).
2. Creating a quotation/cobro in tab A updates the counters and feed in tab B (S8).
