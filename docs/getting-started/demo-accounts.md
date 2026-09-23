# Demo accounts and roles

Each demo user has a **simple personal password** (first name, lowercase) and also accepts the shared mock password `Demo1234!`. Local seed only — not production secrets.

| Email | Password | Role | Name |
|-------|----------|------|------|
| `julio.admin@demo.hs.local` | `julio` | ADMINISTRADOR | Julio |
| `elias.ops@demo.hs.local` | `elias` | ADMINISTRADOR | Elias |
| `estefany.admin@demo.hs.local` | `estefany` | ADMINISTRADOR | Estefany |
| `mabel.admin@demo.hs.local` | `mabel` | ADMINISTRADOR | Mabel |
| `dennis.ventas@demo.hs.local` | `dennis` | VENTAS / ADMINISTRACIÓN | Dennis |
| `wilson.ventas@demo.hs.local` | `wilson` | VENTAS / ADMINISTRACIÓN | Wilson |
| `vanesa.ventas@demo.hs.local` | `vanesa` | VENTAS / ADMINISTRACIÓN | Vanesa |
| `giovanni.ventas@demo.hs.local` | `giovanni` | VENTAS / ADMINISTRACIÓN | Giovanni |

There are **four** administrators: Julio, Elias, Estefany and Mabel. The role **Contadora** was removed from the system — Estefany (previously the accounting demo user) is now a full administrator and validates income/expense movements like any other admin. Sales users only see their own quotations and their branch clients.

## Auth

- Mock (`VITE_API_MODE=mock`): `poc.*` tokens. **Remember me** uses `localStorage`; unchecked uses `sessionStorage`.
- Nest (`VITE_API_MODE=api`): JWT 8h with required `sessionId`. Logout ends the session row; the guard rejects ended sessions or tokens without `sessionId`.
- Defined in `apps/api/prisma/seed.ts` and `apps/web/src/services/auth/`.

Do **not** run `prisma seed` on Hostinger (it overwrites password hashes). Apply additive migrations only.

## What to try by role

| Role | Sidebar |
|------|---------|
| Sales | Dashboard, Cotizaciones, Clientes, Relevamientos |
| Technician | Dashboard, Relevamientos |
| Admin | All of the above plus Reportes, Panel de Control, Configuración, Finanzas y Contabilidad |

Movimientos de ingresos/egresos y cobros registrados por Ventas quedan en estado **pendiente** hasta que un Administrador los valida desde Finanzas; solo los movimientos validados cuentan en los reportes.

Cronograma lives in the **Actividad** overlay and `/schedule`. The old floating "Tareas" button was removed (replicative with Cronograma/Actividad); quick tasks are created from the day quick-add modal in the schedule view.

Logout is in the sidebar footer.

Suggested dashboards: [operations/dashboards-by-role.md](../operations/dashboards-by-role.md).
