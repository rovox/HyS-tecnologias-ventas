# Demo accounts and roles

The single roster is [`config/users.json`](../../config/users.json): the same emails as production, used by the local seed, the login chips, the e2e fixtures and the production users SQL. `localOnly` users (Marcos, técnico) exist only in the local seed and are hidden from the production chips.

Passwords never go to git. Locally, `config/users.passwords.local.json` (gitignored, `{ "email": "password" }`) sets the real ones; any user missing there gets the lowercase first name (`julio`, `dennis`, `marcos`…), which is what CI uses. There is no shared fallback password.

| Role | Users |
|------|-------|
| ADMINISTRADOR | Julio, Mavel, Elias, Estefany Gonzales |
| VENTAS / ADMINISTRACIÓN | Dennis, Giovanni, Vanessa, Wilson |
| SIN ACCESO | Marcelo, Ronald, Rodrigo |
| SEGURIDAD ELECTRÓNICA | Marcos (local only) |

There are **four** administrators: Julio, Mavel, Elias and Estefany. The role **Contadora** was removed from the system — Estefany (previously the accounting demo user) is now a full administrator and validates income/expense movements like any other admin. Sales users only see their own quotations and their branch clients.

## Auth

- Mock (`VITE_API_MODE=mock`): `poc.*` tokens. **Remember me** uses `localStorage`; unchecked uses `sessionStorage`.
- Nest (`VITE_API_MODE=api`): JWT 8h with required `sessionId`. Logout ends the session row; the guard rejects ended sessions or tokens without `sessionId`.
- Users in `config/users.json` (seeded by `apps/api/prisma/seed.ts`); client in `apps/web/src/services/auth/`.

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
