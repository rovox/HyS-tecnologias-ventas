# Demo accounts and roles

Each demo user has a **simple personal password** (first name, lowercase). Local seed only.

| Email | Password | Role | Name |
|-------|----------|------|------|
| `julio.admin@demo.hs.local` | `julio` | ADMINISTRADOR | Julio |
| `dennis.ventas@demo.hs.local` | `dennis` | VENTAS / ADMINISTRACIÓN | Dennis |
| `wilson.ventas@demo.hs.local` | `wilson` | VENTAS / ADMINISTRACIÓN | Wilson |
| `vanesa.ventas@demo.hs.local` | `vanesa` | VENTAS / ADMINISTRACIÓN | Vanesa |
| `elias.ops@demo.hs.local` | `elias` | SEGURIDAD ELECTRÓNICA | Elias |
| `elena.conta@demo.hs.local` | `elena` | Contadora | Elena Rojas |

There is **one** administrator: Julio. Sales users only see their own quotations and their branch clients.

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
| Accountant | Dashboard, Clientes, Cotizaciones (read), Reportes |
| Admin | All of the above plus Reportes, Panel de Control, Configuración |

**Tareas** open from the floating button (bottom-right), not the sidebar. Cronograma lives in the **Actividad** overlay and `/schedule`.

Logout is in the sidebar footer.

Suggested dashboards: [operations/dashboards-by-role.md](../operations/dashboards-by-role.md).
