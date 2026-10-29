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

- [x] DASH-05 Readable commercial charts, 2026-10-29 (owner: keep the charts, fix them): no goal line (it joined each seller's goal into a curve on a second axis); counts on a readable left axis; the goal in numbers under the chart ("Bs X de Bs Y (Z%)", green ≥ 100 %, amber ≥ 50 %, red below) with "ver ventas"; the tooltip shows the whole group (cotizaciones, aprobadas, relevamientos, meta and the approved ones); a bar opens Cotizaciones searched by that seller or branch (`?q=`, approved ones `?vista=cerradas&f=aprobado`), a category bar filters by it. Cards: "Vendido en el mes = cotizaciones aprobadas", "% alcanzado", "Meta superada por" when it is met. Pending: the components still fetch through `services/reports` without realtime (move to `features/dashboard/api.js`, a separate refactor).

## Smoke steps
1. Each role logs in and lands on `/dashboard` with no console errors (S1).
2. Creating a quotation/cobro in tab A updates the counters and feed in tab B (S8).
3. Contabilidad: the goal reads in numbers and "ver ventas" opens Cotizaciones searched by that seller (`smoke-dashboard.mjs`).
