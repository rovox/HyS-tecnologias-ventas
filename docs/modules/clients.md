# Clientes

> Ficha de cada cliente: qué contrató, qué debe, qué garantías tiene, sus cotizaciones, cobros y visitas · Rutas: `/clientes`, `/clientes/:id` · Estado: 🟢 CLI-01 (2026-10-23) · equipos INV-01 (2026-10-23)

## Roles

| Rol | Ve | Hace |
|---|---|---|
| Administrador | todos | registrar, editar, empezar una cotización desde la ficha |
| Ventas | todos | lo mismo que Administrador |
| Técnico | todos (lectura) | — |

Los clientes no se borran.

## Estados

Sin etiquetas "Activo", "Inactivo" ni "Contratado" (decisión del dueño, 2026-10-22). "Servicio en curso" es un **filtro** y una marca discreta en la ficha: el cliente tiene un proyecto o trabajo abierto, o todavía debe algo.

## Vistas

| Vista | Tipo | Filtros y agrupaciones | Smart buttons / enlaces |
|---|---|---|---|
| Clientes (`/clientes`) | lista (tarjetas en teléfono) | con servicio en curso, con saldo pendiente, sucursal · agrupar por sucursal o rubro · total adeudado · CSV | clic → ficha |
| Ficha (`/clientes/:id`) | formulario Odoo | — | Cotizaciones, Proyectos (en curso), En garantía, Saldo pendiente · pestañas Proyectos y garantías, Equipos, Trabajos, Cotizaciones, Cobros, Relevamientos · historial |

## Flujos

| # | Tarea | Rol | Pasos (≤ 5) | Confirmación / notificación | Resultado y dónde se actualiza |
|---|---|---|---|---|---|
| 1 | Registrar cliente | comercial | 1. Nuevo cliente 2. nombre (y lo demás) 3. Registrar | toast | abre la ficha; aparece en la lista de todas las sesiones y en los selectores |
| 2 | Registrar cliente desde otro formulario | comercial | 1. "+" junto al selector de cliente 2. Registrar | toast | queda elegido en la cotización, tarea o trabajo |
| 3 | Editar | comercial | 1. Editar 2. cambiar 3. Guardar | toast | ficha e historial |
| 4 | Ver qué debe y sus garantías | todos | 1. ficha 2. Proyectos y garantías | — | saldo por proyecto, garantía vigente o vencida |
| 4b | Ver qué equipos tiene | todos | 1. ficha 2. Equipos | — | equipos entregados a sus proyectos (inventario) con la garantía del proyecto |
| 5 | Nueva cotización para el cliente | comercial | 1. Nueva cotización (con el cliente) 2. completar 3. Guardar | toast | abre la cotización |
| 6 | Encontrar a quién cobrar | comercial | 1. Filtros › Con saldo pendiente | — | lista con el total adeudado |

## Reglas (API)

| Regla | Archivo | Error que devuelve |
|---|---|---|
| Servicio en curso = proyecto (planificado, en ejecución, entregado) o trabajo (programado, en proceso) abierto, o saldo > 0 | `apps/api/src/modules/reporting/domain/clients.report.ts` (`clientStatus`) | — |
| Saldo pendiente = saldos de sus proyectos + trabajos sueltos, desde el libro | `clientStatus` + `finance` `incomeOf`/`balanceOf` | — |
| Total contratado = proyectos no anulados + trabajos no cancelados | `clientStatus` | — |
| Nombre único; solo comerciales editan | `modules/clients/clients.service.ts` | 400 / 403 |

El modelo de lectura vive en el módulo `reporting` (`GET /reporting/clients`, `GET /reporting/clients/:id`): lee clientes, cotizaciones, proyectos, trabajos y el libro, y no escribe nada. `GET /clients` queda como lista simple para los selectores.

## Eventos en tiempo real

| Acción | `entity` | `affects` | Qué se refresca en otras sesiones |
|---|---|---|---|
| registrar, editar cliente | `client` | — | lista, ficha, selectores |
| aprobar cotización, mover proyecto, cobrar, mover trabajo | (su entidad) | `client` | saldo y listas de la ficha |
| salida de inventario a un proyecto, entregar pedido | `stock` / `pedido_interno` | `client` | pestaña Equipos |

## Pruebas

- Unit: `modules/reporting/domain/clients.report.spec.ts`.
- e2e: `apps/api/test/app.e2e-spec.ts` › "client read model (CLI-01)".
- Smoke: `node scripts/smoke-clients.mjs`.

## Pendientes

- [ ] El formulario de relevamientos todavía usa el servicio anterior de clientes (`services/clients`).
