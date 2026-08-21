# Grupos operativos y permisos

## Roles del sistema

| Rol técnico | Etiqueta UI | Grupo |
|-------------|-------------|-------|
| `ADMINISTRADOR` | Administrador | Administración |
| `VENTAS / ADMINISTRACIÓN` | Ventas | Ventas |
| `SEGURIDAD ELECTRÓNICA` | Técnico | Técnicos |
| `Contadora` | Contadora | Finanzas |

Definidos en `apps/web/src/mocks/users.js` y validados en `ProtectedRoute` + `Sidebar`.

---

## Matriz de módulos

| Módulo | Ruta | Admin | Ventas | Técnicos | Finanzas |
|--------|------|:-----:|:------:|:--------:|:--------:|
| Dashboard | `/dashboard` | ✓ | ✓ | ✓ | ✓ |
| Cronograma instalaciones | `/schedule` | ✓ | ✓ | ✓ | ✓ |
| Relevamientos/asistencias | `/surveys` | ✓ | ✓ | ✓ | ✓ |
| Clientes | `/clientes` | ✓ | ✓ | ✓ | ✓ |
| Pedidos internos | `/pedidos-internos` | ✓ | ✓ | ✓ | ✓ |
| Gastos operativos | `/gastos-operativos` | ✓ | ✓ | ✓ | ✓ |
| Muro actividad | `/activity-wall` | ✓ | ✓ | ✓ | ✓ |
| Control vehicular | `/vehicle-control` | ✓ | ✓ | ✓ | ✓ |
| Marketing | `/marketing` | ✓ | ✓ | ✓ | — |
| Cotizaciones | `/quotations` | ✓ | ✓ | ✓ | ✓ |
| Reportes | `/reports` | ✓ | ✓ | — | ✓ |
| Costos operativos | `/accounting` | ✓ | ✓ | — | ✓ |
| Finanzas | `/finanzas` | ✓ | ✓ | — | ✓ |
| Panel de control | `/admin/management` | ✓ | — | — | — |
| Configuración | `/configuration` | ✓ | — | — | — |

---

## Quién mueve el cronograma

| Acción | Ventas | Admin | Técnicos | Finanzas |
|--------|:------:|:-----:|:--------:|:--------:|
| Crear entrada en cronograma | ✓ | ✓ | — | — |
| Reprogramar fecha | ✓ | ✓ | — | — |
| Asignar vendedor responsable | ✓ | ✓ | — | — |
| Asignar técnico | ✓ | ✓ | — | — |
| Cambiar estado operativo (`programado → en_proceso → terminado`) | ✓ | ✓ | ✓ | — |
| Registrar pagos en trabajo | ✓ | ✓ | — | ✓ |
| Cancelar trabajo | ✓ | ✓ | ✓ | — |

Regla de negocio: **planificación = ventas/admin**; **ejecución = técnicos** (con ventas/admin habilitados para supervisión).

Implementación: `StateFlowValidator.canUserChangeState` permite ADMINISTRADOR, VENTAS / ADMINISTRACIÓN y SEGURIDAD ELECTRÓNICA.

---

## Quién registra relevamientos

| Acción | Ventas | Técnicos |
|--------|:------:|:--------:|
| Crear visita / relevamiento | ✓ | ✓ |
| Marcar "requiere cotización" | ✓ | ✓ |
| Agendar relevamiento al cronograma | ✓ | ✓ |
| Resolver visita en campo | ✓ | ✓ |

**Definición operativa:** un **relevamiento** es la visita presencial al cliente para evaluar necesidades técnicas antes de cotizar. Lo registra quien visita (habitualmente ventas); el técnico puede registrar asistencias y relevamientos técnicos.

---

## Pedidos internos

| Acción | Ventas | Admin | Técnicos |
|--------|:------:|:-----:|:--------:|
| Solicitar pedido | ✓ | ✓ | ✓ |
| Aprobar / rechazar | ✓ | ✓ | — |
| Preparar / entregar | ✓ | ✓ | ✓ |

Flujo de estados: ver [state-machines.md](./state-machines.md).

---

## Finanzas vs ventas

- **Ventas** registra operaciones comerciales (cotizaciones, trabajos, adelantos)
- **Finanzas** consolida movimientos, cajas, costos y reportes contables
- **Contadora** tiene acceso a reportes y finanzas; no planifica cronograma

---

## Administrador — visión transversal

El administrador debe poder:

1. Ver actividad agregada de **todos** los grupos en dashboard y panel de control
2. Auditar cambios de estado (`/admin/management`)
3. Configurar metas, sucursales y parámetros globales
4. Exportar datos maestros (CSV en panel de gestión)

Ver [flows/administrador.md](./flows/administrador.md).
