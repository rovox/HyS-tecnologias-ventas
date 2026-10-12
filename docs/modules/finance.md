# Finance (Finanzas) — priority 1

**Status:** ⚪ not built. Routes `/finanzas`, `/accounting`, `/gastos-operativos` are frozen stubs; there is no ledger API. Payments exist only as `SchedulePayment` on jobs.

## Purpose
**One ledger of Movimientos.** Every peso in or out is a Movimiento, created `por_validar`; Contabilidad moves it to `validado` (assigning a Caja) or `observado` (with a reason, then corrected). A validated movement is never edited: a correction is an opposite movement.
- Types: ingreso (adelanto, cobro, venta directa, asistencia, otro), egreso (material, combustible, mantenimiento, viáticos, servicios, sueldos, alquiler, impuestos, marketing, otro), transferencia between cajas.
- Egresos carry *pagado por* (`empresa`/`empleado`, with pending reembolso) and an optional receipt photo.
- Cajas: one central in Cochabamba + a petty cash per sede.
- The owner's screens are views of the same ledger: Gastos operativos (egresos without project), Costos operativos (cost per project/vehicle/general), Finanzas y contabilidad (cajas, rendición inbox, cuentas por cobrar, cash flow, monthly result).
- Business rules (balances, totals, states) live in the API only. Realtime event on every mutation.

## Health (S1, 2026-10-12)
| Screen | admin |
|---|---|
| `/finanzas`, `/accounting`, `/gastos-operativos` | renders the under-construction stub (no data), no errors |

## Checklist
- [ ] FIN-01 `CashMovement`/`CashBox` schema and API (Phase C, needs approval); `POST` creates `por_validar`.
- [ ] FIN-02 Rendición inbox: validate/observe, assign caja (Contabilidad, gerencia only).
- [ ] FIN-03 "Registrar cobro" and "Registrar gasto" quick actions, one reusable form; delete `utils/cobrosRendicion.js` and `calculateBalance` (was PAY-01/02).
- [ ] FIN-04 Payment history in the project; cuentas por cobrar; reports read the ledger (was PAY-04).
- [ ] FIN-05 Reembolso flow for empleado-paid egresos; export to Excel/CSV (priority 3).

## Smoke steps
1. Ventas registers a cobro on a project → state `por_validar`; project saldo updates from the API (S5).
2. Contabilidad/admin validates it into a caja; a second tab updates live.
3. A validated movement cannot be edited; the correction is an opposite movement.
