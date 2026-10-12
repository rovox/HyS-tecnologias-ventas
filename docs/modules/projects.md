# Projects (Proyectos) — priority 1

**Status:** 🔴 the concept does not exist yet. Today it is split between `Schedule` (jobs) and the unused `Sale`/`SaleJob`/`SalePayment`. Nothing renders on the committed branch until PLAT-01 is fixed.

## Purpose
A Proyecto is an accepted quotation: official amount, **Actividades** (the only thing shown in the Cronograma), material (internal orders), costs and **cobros**. It shows **% cobrado, saldo, costo acumulado and margen = monto oficial − costo**, all computed from Movimientos. States: `planificado → en_ejecucion → entregado → cerrado | anulado`. Nothing is deleted, only annulled with a reason. Only gerencia changes the official amount or annuls.

## Today's behavior (to be replaced)
- API: `POST /schedules/:id/payments` stores a `SchedulePayment` and recomputes `adelanto`/`saldo`. Types `adelanto`, `cobro`, `extra_asistencia`. Job flow `programado → en_proceso → terminado`, any → `cancelado`; técnico only changes status and notes on own jobs.
- Web: `PaymentModal`, `CompleteWorkModal`, `FinalizeAssistanceModal`, `ScheduleFormModal` still go through `utils/cobrosRendicion.js` (fake success on 404) and compute balance in the browser. The `sales` API module duplicates Schedule and is unused.

## Health (S1, 2026-10-12, with the PLAT-01 temporary fix)
| Screen | admin | ventas | técnico |
|---|---|---|---|
| `/schedule` | ✅ | ✅ | ⚠ loads, but 403 on `/api/quotations` and `/api/users` + 2 console errors |
| Payment/status modals | not run | not run | not run |

## Checklist
- [ ] PLAT-01 Fix `ScheduleFormModal.jsx` (blocks everything).
- [ ] PRO-01 Project, Activity, Assistance model (Phase C, needs approval); remove `sales` API module and its tables.
- [ ] PRO-02 Accept quotation → Project; official amount immutable.
- [ ] PRO-03 Project view: % cobrado, saldo, costo, margen, from the API.
- [ ] PRO-04 Annul with reason (no delete); state machine in the API.
- [ ] SCH-01 Técnico sees only own activities without 403 (Phase E).

## Smoke steps
1. Ventas accepts a quotation → Project appears (S3).
2. Técnico moves own activity `en_proceso → terminado`; admin sees it live (S4).
3. Cobro on a project updates saldo/% in the API response, lists and reports without reload (S5).
