# Dashboards by role

The live `/dashboard` is commercial (quotations, sales, monthly goal, surveys). Finance, vehicles, marketing and internal orders are not loaded.

## Sales (`VENTAS / ADMINISTRACIÓN`)

Sees **own** quotations, sales and goal. Charts: grouped bars for quotations (navy), sales (green), relevamientos (blue), plus a monthly goal point. Category chart for Seguridad electrónica, Tecnología and Proyectos.

**Histogram hover:** each bar cluster tooltip lists **per-record** items (`cotizacionesItems`, `ventasItems`, `relevamientosItems`) with monto when available, plus the bucket total. Relevamiento monto comes from the linked quotation when present.

Shortcuts: `/quotations`, `/clientes`, `/surveys`, `/pedidos-internos`. **Tareas operativas**: floating button. **Tareas de cotización** (borrador rápido / reprogramar / fecha de envío): band on `/quotations`. **Actividad**: header overlay.

## Technician (`SEGURIDAD ELECTRÓNICA`)

Dashboard shortcuts to relevamientos and tasks. No quotation metrics. Can update schedule status/observaciones.

## Accountant (`Contadora`)

Read commercial metrics and reports. On `/quotations` may **edit** quotations (same view access). Cannot create schedule jobs. No tasks FAB / schedule mutations beyond quote edits.

## Administrator (`ADMINISTRADOR`)

Company-wide metrics, all sellers and branches, reports, control panel and configuration. Julio is the only admin user. Frozen sales job/payment writes are admin-only.

Activity feed is in the header overlay. Logout is in the sidebar footer.
