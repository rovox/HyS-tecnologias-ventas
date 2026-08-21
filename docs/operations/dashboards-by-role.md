# Dashboards by role

The live `/dashboard` is commercial (quotations, sales, monthly goal, surveys). Finance, vehicles, marketing and internal orders are not loaded.

## Sales (`VENTAS / ADMINISTRACIÓN`)

Sees **own** quotations, sales and goal. Charts: grouped bars for quotations (navy), sales (green), relevamientos (blue), plus a monthly goal point. Category chart for Seguridad electrónica, Tecnología and Proyectos.

Shortcuts: `/quotations`, `/clientes`, `/surveys`. **Tareas**: floating button (not sidebar). **Actividad**: header toggle overlay (calendar + feed), not a separate route. Cronograma jobs come from Nest `/api/schedules` when `VITE_API_MODE=api`.

## Technician (`SEGURIDAD ELECTRÓNICA`)

Dashboard shortcuts to relevamientos and tasks. No quotation metrics. Can update schedule status/observaciones.

## Accountant (`Contadora`)

Read-only commercial metrics and reports. Cannot create or accept quotations. No tasks / schedule mutations.

## Administrator (`ADMINISTRADOR`)

Company-wide metrics, all sellers and branches, reports, control panel and configuration. Julio is the only admin user. Frozen sales job/payment writes are admin-only.

Activity feed is in the header overlay. Logout is in the sidebar footer.
