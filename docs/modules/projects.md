# Proyectos

> Una cotización aprobada es un Proyecto: monto oficial, trabajos en el cronograma, cobros, saldo y garantía · Rutas: `/projects` (pestaña Proyectos dentro de Cotizaciones), `/projects/:id` · Estado: 🟢 PRO-01 (2026-10-23) · costo y margen FIN-01 + INV-01 (2026-10-23)

## Roles

| Rol | Ve | Hace |
|---|---|---|
| Administrador | todos | cobrar, agregar trabajos, iniciar, entregar, cerrar, **anular**, editar |
| Ventas | todos | lo mismo salvo anular |
| Técnico | — (API 403); sus trabajos del proyecto en el cronograma | iniciar y terminar sus trabajos |

## Estados

`planificado → en_ejecucion → entregado → cerrado` · `anulado` desde cualquier estado abierto · `entregado → en_ejecucion` (volver).

| Transición | Quién | Condición | Confirmación |
|---|---|---|---|
| (aprobar cotización) → planificado | comercial | crea el proyecto y su primer trabajo en una transacción, una sola vez | la de aprobar |
| planificado → en_ejecucion | comercial | — | "¿Iniciar la ejecución…?" |
| en_ejecucion → entregado | comercial | todos los trabajos terminados o cancelados; empieza la garantía | "Empieza la garantía de N meses" |
| entregado → cerrado | comercial | saldo 0 | "Un proyecto cerrado ya no admite cambios" |
| abierto → anulado | administrador | motivo; cancela los trabajos pendientes; el saldo deja de cobrarse | motivo en el diálogo |

## Vistas

| Vista | Tipo | Filtros y agrupaciones | Smart buttons / enlaces |
|---|---|---|---|
| Proyectos (`/projects`) | lista (tarjetas en teléfono) | estado, categoría, con saldo, en garantía · agrupar por estado, categoría, cliente, responsable · totales de monto, cobrado y saldo · exportar CSV | clic → ficha |
| Ficha (`/projects/:id`) | formulario Odoo | barra de estado con las transiciones de la API | Cotización, Cliente, Trabajos, Cobrado % · pestañas Trabajos, Cobros, Gastos, Material · historial |

La lista con totales es el informe transparente de lo cotizado y aprobado frente a lo cobrado y lo adeudado: no hay una pestaña Informes aparte que lo repita.

## Flujos

| # | Tarea | Rol | Pasos (≤ 5) | Confirmación / notificación | Resultado y dónde se actualiza |
|---|---|---|---|---|---|
| 1 | Abrir el proyecto | comercial | 1. Cotización aprobada 2. smart button Proyecto | — | ficha del proyecto |
| 2 | Registrar cobro | comercial | 1. Registrar cobro 2. Adelanto / Cobro / Adicional 3. monto, método 4. Registrar | el formulario impide superar el saldo; toast | cobrado, % y saldo en ficha, lista y otras sesiones |
| 3 | Agregar trabajo | comercial | 1. Nuevo trabajo 2. trabajo, fecha, técnico 3. Agregar | toast | aparece en el cronograma con la categoría del proyecto |
| 4 | Entregar | comercial | 1. Iniciar ejecución 2. (técnicos terminan los trabajos) 3. Marcar entregado | diálogo; error si hay trabajos pendientes | garantía "hasta …" |
| 5 | Cerrar | comercial | 1. Cerrar 2. Confirmar | diálogo; error con el saldo si se debe | estado Cerrado, sin acciones |
| 6 | Anular | administrador | 1. Anular 2. motivo 3. Confirmar | diálogo con motivo | trabajos pendientes cancelados, saldo 0 |
| 7 | Editar | comercial | 1. Editar 2. título, responsable, meses de garantía 3. Guardar | toast | ficha e historial |

## Reglas (API)

| Regla | Archivo | Error que devuelve |
|---|---|---|
| Flujo de estados, entregar sin trabajos pendientes, cerrar sin saldo, anular solo admin con motivo | `apps/api/src/modules/projects/domain/projects.rules.ts` (`checkProjectTransition`) | 400 "Termina o cancela los trabajos pendientes…", "No se cierra un proyecto con saldo pendiente (Bs …)", "Solo Gerencia anula…", "Indica el motivo…" |
| Cobrado = adelantos + cobros; saldo = monto − cobrado − condonado (anulado = 0); % cobrado | `projectMoney` | — |
| Garantía desde la entrega por `garantiaMeses` (12 por defecto) | `warranty` | — |
| Cobro no supera el saldo (el excedente es "adicional") | `modules/finance/domain/finance.rules.ts` `incomeError` (libro) | 400 "…Registra el excedente como adicional." |
| Costo = egresos del proyecto + material (salidas de inventario × costo); margen = monto + adicionales − costo | `finance` `expensesOf` + `inventory` `materialCost` · `project.presenter.ts` | — |
| Trabajos nuevos solo en proyectos abiertos | `newJobError` | 400 |
| Solo comerciales | `common/policy` `canManageProjects` | 403 |

## Eventos en tiempo real

| Acción | `entity` | `affects` | Qué se refresca en otras sesiones |
|---|---|---|---|
| aprobar cotización | `quotation` | `project`, `schedule`, `client` | listas de proyectos, cronograma, clientes |
| cambiar estado, editar | `project` | `schedule`, `client` | lista, ficha, cronograma |
| cobro de un trabajo del proyecto | `payment` | `schedule`, `client`, `project` | cobrado y saldo |
| crear o mover un trabajo del proyecto | `schedule` | `project` | pestaña Trabajos |

## Pruebas

- Unit: `modules/projects/domain/projects.rules.spec.ts`.
- e2e: `apps/api/test/app.e2e-spec.ts` › "projects from approved quotations (PRO-01)".
- Smoke: `node scripts/smoke-projects.mjs` (dos sesiones).

## Pendientes

- [ ] Iniciar ejecución automáticamente cuando empieza el primer trabajo (hoy es manual).
