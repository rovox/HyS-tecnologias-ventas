# Clients (Clientes) — priority 1

**Status:** 🟡 screens load for admin, ventas and técnico; the client file lacks balance and full history.

## Purpose
The customer book. A Cliente is a company or person; "prospecto" is a state, not a separate thing. The file shows the full history (relevamientos, cotizaciones, proyectos, asistencias) and the **total saldo adeudado**.

## Health (S1, 2026-10-12, with the PLAT-01 temporary fix)
| Screen | admin | ventas | técnico |
|---|---|---|---|
| `/clientes` | ✅ | ✅ | ✅ (read) |
| `/clientes/:id`, create/edit modal | not run | not run | not run |

## Checklist
- [ ] CLI-01 Client file: history of relevamientos, quotations, projects, assistances.
- [ ] CLI-02 Saldo adeudado total, computed in the API from Movimientos (never stored).
- [ ] CLI-03 `prospecto` as a client state; every edit is audited (RT-01).
- [ ] CLI-04 Create/edit appears in lists without reload (RT-02).

## Smoke steps
1. Ventas: `/clientes` → create a client → it appears in the list; open its file.
2. Técnico: `/clientes` is readable and has no create/edit.
3. Second tab shows the new client without reload (S8).
