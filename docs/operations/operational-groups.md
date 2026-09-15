# Grupos operativos y permisos

## Roles del sistema

| Rol técnico | Etiqueta UI | Grupo |
|-------------|-------------|-------|
| `ADMINISTRADOR` | Administrador | Administración |
| `VENTAS / ADMINISTRACIÓN` | Ventas | Ventas |
| `SEGURIDAD ELECTRÓNICA` | Técnico | Técnicos |
| `Contadora` | Contadora | Finanzas |

Definidos in `apps/web/src/config/nav.js` + `ProtectedRoute` + `Sidebar`.

---

## Menú unificado (OPERACIONES primero)

All roles share the same operational spine (`operationalMenuSections`):

| Section | Items |
|---------|-------|
| **PRINCIPAL** | Dashboard |
| **OPERACIONES** | Cotizaciones, Clientes, Relevamientos, **Cronograma**, Pedidos (role-gated) |
| **ADMINISTRACIÓN** | Reportes (Admin + Contadora) |
| **ADMIN EXTRA** (Admin only) | Gastos, Costos, Finanzas, Vehicular, Marketing, Panel, Configuración |

Tasks open via `TasksFloatingPanel` (FAB), not the sidebar. Activity opens via header → `ActivityOverlay`.

---

## Matriz de módulos

| Módulo | Ruta | Admin | Ventas | Técnicos | Finanzas |
|--------|------|:-----:|:------:|:--------:|:--------:|
| Dashboard | `/dashboard` | ✓ | ✓ | ✓ | ✓ |
| Cotizaciones | `/quotations` | ✓ | ✓ | — | ✓* |
| Clientes | `/clientes` | ✓ | ✓ | ✓ | ✓ |
| Relevamientos | `/surveys` | ✓ | ✓ | ✓ | — |
| Cronograma | `/schedule` | ✓ | ✓ | ✓ | — |
| Pedidos internos | `/pedidos-internos` | ✓ | ✓ | ✓ | — |
| Reportes | `/reports` | ✓ | — | — | ✓ |
| Finanzas / Costos / Gastos | `/finanzas` etc. | ✓ | — | — | ✓ |
| Panel / Config | `/admin/management`, `/configuration` | ✓ | — | — | — |
| Perfil usuario | `/usuarios/:id` | ✓ (all) | own | own | own |

\* Contadora: consultative access where `routeRoles` allows.

---

## Quién mueve el cronograma

| Acción | Ventas | Admin | Técnicos | Finanzas |
|--------|:------:|:-----:|:--------:|:--------:|
| Crear trabajo (`Schedule`) | ✓ | ✓ | — | — |
| Reprogramar fecha | ✓ | ✓ | — | — |
| Cambiar estado operativo | ✓ | ✓ | ✓ | — |
| Registrar pagos (`adelanto`/`cobro`/`extra_asistencia`) | ✓ | ✓ | ✓ | ✓ |
| Cancelar trabajo | ✓ | ✓ | ✓ | — |

**Calendar rule:** day **events** = jobs only. Pending visits = **subtle indicator** → `/surveys?fecha=`.

---

## Quién registra relevamientos

| Acción | Ventas | Técnicos |
|--------|:------:|:--------:|
| Crear/editar en `/surveys` | ✓ | ✓ |
| Resolver (requires ≥1 photo) | ✓ | ✓ |
| Priority / estado chips | ✓ | ✓ |

Visits are **not** created from the calendar quick modal.

---

## Pedidos internos

| Acción | Ventas | Admin | Técnicos |
|--------|:------:|:-----:|:--------:|
| Solicitar pedido | ✓ | ✓ | ✓ |
| Aprobar / rechazar | ✓ | ✓ | — |
| Preparar / entregar | ✓ | ✓ | ✓ |

Flujo de estados: ver [state-machines.md](./state-machines.md).

---

## Realtime

Authenticated sessions subscribe to `GET /api/realtime/events` (short-lived ticket). Mutations on schedules, relevamientos, tasks, quotations, and payments emit SSE events; the SPA refetches the affected domain without F5.
