# Cuentas demo y roles

Contraseña común para todas las cuentas POC: **`Demo1234!`**

| Email | Rol | Nombre | Grupo operativo |
|-------|-----|--------|-----------------|
| `julio.admin@demo.hs.local` | ADMINISTRADOR | Julio | Administración |
| `dennis.ventas@demo.hs.local` | VENTAS / ADMINISTRACIÓN | Dennis | Ventas |
| `wilson.ventas@demo.hs.local` | VENTAS / ADMINISTRACIÓN | Wilson | Ventas |
| `vanesa.ventas@demo.hs.local` | VENTAS / ADMINISTRACIÓN | Vanesa | Ventas |
| `elias.ops@demo.hs.local` | SEGURIDAD ELECTRÓNICA | Elias | Técnicos |
| `elena.conta@demo.hs.local` | Contadora | Elena Rojas | Finanzas |

## Grupos operativos

| Grupo | Roles incluidos | Enfoque principal |
|-------|-----------------|-------------------|
| **Ventas** | VENTAS / ADMINISTRACIÓN | Clientes, cotizaciones, relevamientos, cronograma (planificación), conversión comercial |
| **Técnicos** | SEGURIDAD ELECTRÓNICA | Ejecución en cronograma, visitas, pedidos internos, evidencia |
| **Finanzas** | Contadora (+ ventas/admin en módulos compartidos) | Reportes, costos, cajas, movimientos |
| **Administración** | ADMINISTRADOR | Visión transversal, panel de control, configuración, auditoría |

## Autenticación POC

- Tokens ficticios `poc.*` en `localStorage`
- **No** es JWT de producción
- Definido en `apps/web/src/mocks/users.js` y `apps/web/src/services/auth/`

## Qué probar por rol

| Rol | Rutas sugeridas |
|-----|-----------------|
| Ventas | `/dashboard`, `/clientes`, `/surveys`, `/quotations`, `/schedule` |
| Técnicos | `/schedule`, `/surveys`, `/pedidos-internos` |
| Finanzas | `/finanzas`, `/accounting`, `/reports` |
| Admin | `/admin/management`, `/configuration`, todas las anteriores |

Ver dashboards esperados por rol en [operations/dashboards-by-role.md](../operations/dashboards-by-role.md).
