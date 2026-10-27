# Inventario

> Productos básicos con su stock por sucursal, calculado siempre desde los movimientos; los pedidos internos mueven stock al entregarse · Ruta: `/inventario` (Productos, Pedidos internos, Historial) y `/inventario/pedidos/:id` · Estado: 🟢 INV-03 (2026-10-27)

## Roles

| Rol | Ve | Hace |
|---|---|---|
| Administración y Contabilidad (Gerencia) | todo | lo de Ventas en **cualquier sucursal** + **ajustes** (con motivo) |
| Ventas | todo (empieza en su sucursal: solo su columna y lo que hay en ella) | crear y editar productos, archivar; **comprar a Central**; mover y sacar a proyecto **desde su sucursal o Central**; **quitar material solo de su sucursal**; vender; pedidos internos con productos |
| Técnico | productos e historial (lectura); **no** ve pedidos internos | registrar el material usado en sus trabajos de proyecto (SCH-04) |

Central abastece a todas las sucursales (dueño, 2026-10-27): las compras entran a Central y las sucursales reciben por transferencia o pedido interno.

Los productos no se borran: se **archivan** (dejan de ofrecerse en pedidos, su historial queda). El chip "Archivados (N)" los muestra; en la lista van atenuados con la etiqueta "Archivado", y no cuentan para el stock bajo.

## Estados

Producto: activo ↔ archivado. Movimientos: no tienen estados; un error se corrige con otro movimiento (ajuste).

| Movimiento | De → a | Quién | Condición |
|---|---|---|---|
| `entrada` | — → sucursal | comercial | cantidad > 0; costo unitario (actualiza el costo del producto) |
| `transferencia` | sucursal → otra sucursal | comercial | hay stock en el origen |
| `salida_proyecto` | sucursal → proyecto | comercial | hay stock; proyecto abierto; suma al **costo del proyecto** |
| `ajuste` | sucursal ± | Gerencia | motivo obligatorio; faltante no deja stock negativo |
| `baja` ("Quitar material") | sucursal → fuera | comercial (el vendedor, de su sucursal) | motivo obligatorio (dañado, perdido, uso interno…); hay stock |
| `salida_venta_directa` / `devolucion_venta` | sucursal → cliente / de vuelta | los hace la venta directa y su anulación | ver `direct-sales.md` |

Los servicios (p. ej. "Instalación por punto de red") no llevan stock.

## Vistas

| Vista | Tipo | Filtros y agrupaciones | Acciones |
|---|---|---|---|
| Acciones rápidas (arriba) | botones | — | **Vender** · **Agregar material** (compra a Central) · **Mover a otra sucursal** · **Quitar material**: varios productos en un diálogo, todos o ninguno |
| Productos | lista (tarjetas en teléfono): con una sucursal elegida, su columna "En X" + toda la empresa y "Solo lo que hay en esta sucursal" (los recién creados, sin stock en ninguna, se siguen viendo); con "Toda la empresa", una columna por sucursal + total; rojo si está bajo el mínimo | sucursal; stock bajo (N, rojo), archivados (N), tipo, categoría · agrupar por categoría, tipo, marca · CSV | Nuevo producto · 🕘 **Kardex** · menú por fila: Entrada, Transferir, Salida a proyecto, Quitar material, Ajustar (Gerencia), Editar, Archivar |
| Kardex | diálogo | sucursal o toda la empresa | entradas, salidas y saldo corrido, del más antiguo al más reciente, con el detalle (venta NV-…, proyecto, pedido, motivo) |
| Pedidos internos | lista: código `PED-…`, estado, destino en palabras (cliente, trabajo y proyecto, o la sucursal), lo pide / lo recibe, ítems y costo, prioridad, fecha; fila roja si está atrasado, ámbar si espera aprobación | abiertos, cada estado, atrasados, para trabajo / sucursal (con contadores) · agrupar por estado, quien recibe, origen · CSV | Nuevo pedido · el siguiente paso en la fila (Aprobar, Rechazar, Preparar, Listo para entregar, Entregar) |
| Pedido interno (ficha) | `FormView` con barra de estado | — | transiciones con confirmación (rechazar y cancelar piden motivo, entregar muestra qué stock sale y a dónde), Editar mientras está abierto, comentarios, botones a Proyecto y Trabajo, **historial** (quién cambió qué, con nombres) |
| Historial | lista; "Origen" enlaza al pedido `PED-…`, la venta `NV-…` o el proyecto | sucursal (entra o sale de ella), desde/hasta (30 días por defecto), tipo en palabras (Entradas, Ventas, Ventas anuladas, Movidos entre sucursales, Salidas a proyecto, Quitados, Ajustes) · agrupar por producto, tipo, quien registró · CSV | — |
| Proyecto › Material | pestaña de la ficha del proyecto | — | costo = Σ cantidad × costo unitario |
| Cliente › Equipos | pestaña de la ficha del cliente | — | equipos entregados a sus proyectos, con la garantía del proyecto |
| Pedido interno (formulario) | diálogo | — | "Destino del pedido" (trabajo o sucursal), "Lo recibe" (quien lo pide queda automático), "Se necesita el"; cada ítem: producto del inventario (muestra el stock del origen) o texto libre (no mueve stock) |

## Flujos

| # | Tarea | Rol | Pasos (≤ 5) | Confirmación / notificación | Resultado y dónde se actualiza |
|---|---|---|---|---|---|
| 1 | Registrar producto | comercial | 1. Nuevo producto 2. código, nombre, categoría (división), tipo, unidad, costo, precio, mínimo 3. Crear | toast | lista de todas las sesiones; selector de productos del pedido |
| 2 | Registrar una compra | comercial | 1. ⋯ Entrada 2. sucursal, cantidad, costo 3. Registrar | toast | stock de la sucursal |
| 3 | Mover entre sucursales | comercial | 1. ⋯ Transferir 2. de, hacia, cantidad 3. Registrar | aviso si supera el stock; toast | stock de ambas sucursales |
| 4 | Pedido interno con productos | comercial | 1. Inventario › Pedidos internos › Nuevo pedido 2. para un trabajo o una sucursal 3. ítems del inventario 4. Crear pedido | toast | pedido solicitado; no mueve stock todavía |
| 5 | Entregar el pedido | comercial | 1. botón Entregar en la fila o la ficha | confirmación con el pedido y "Salen N … de X a Y" | **en la misma transacción**: a una sucursal → transferencia; a un trabajo de proyecto → salida al proyecto (costo y margen del proyecto, equipos del cliente) |
| 6 | Salida directa a un proyecto | comercial | 1. ⋯ Salida a proyecto 2. sucursal, proyecto, cantidad 3. Registrar | toast | material y costo del proyecto; equipos del cliente |
| 7 | Corregir un conteo | administrador o contabilidad | 1. ⋯ Ajustar 2. faltante o sobrante, sucursal, cantidad, motivo 3. Registrar | toast | stock; queda en Movimientos con el motivo |
| 8 | Ver qué reponer | todos | 1. Filtros › Stock bajo | — | productos bajo su mínimo |

## Reglas (API)

| Regla | Archivo | Error que devuelve |
|---|---|---|
| Stock por sucursal = entradas y transferencias entrantes − salidas y transferencias salientes (nunca guardado) | `apps/api/src/modules/inventory/domain/inventory.rules.ts` (`stockBySede`) | — |
| Stock bajo = total < mínimo (mínimo > 0) | `isLowStock` | — |
| Cantidad > 0, origen y destino según el tipo, sin stock negativo, ajuste solo admin con motivo, servicios sin stock | `stockMovementError` | 400 "Solo hay N … en esa sucursal", 403 |
| Entregar un pedido: ítems con producto → transferencia o salida a proyecto; un trabajo sin proyecto no descuenta producto | `movementsForDelivery` · `InventoryService.deliverOrder` (en la transacción del cambio de estado) | 400 "El trabajo no es de un proyecto…" |
| Costo de material del proyecto = Σ salidas × costo unitario; costo = gastos + material | `materialCost` · `projects/project.presenter.ts` | — |
| Código único; categoría = una de las 3 divisiones | `InventoryService` + `CategoriesService.assertDivision` | 409 / 400 |
| Un pedido entregado no se borra | `pedidos-internos.rules.ts` `deleteError` | 400 |
| Rechazar o cancelar un pedido pide motivo (queda como comentario) | `transitionNeedsReason` | 400 |
| Quien pide = quien crea (`solicitanteId`, automático); `responsableId` = quien lo recibe | `PedidosInternosService.create` | — |
| Gestionar: comerciales; ajustar: Gerencia (403 para los demás) | `common/policy` `canManageInventory`, `canAdjustInventory` | 403 |
| Vendedor: compra a Central; mueve y saca a proyecto desde su sucursal o Central; quita solo de la suya. Gerencia: cualquier sucursal | `branchMoveError` | 403 |
| Quitar material: origen y motivo | `stockMovementError` | 400 |
| Lote: todas las líneas en una transacción; el error nombra el producto | `InventoryService.registerBatch` | 400 "DVR…: Stock insuficiente" |
| Kardex con saldo corrido por sucursal o empresa (en la empresa las transferencias no cuentan) | `kardex` | — |

API: `GET/POST /inventory/products`, `PATCH /inventory/products/:id`, `GET /inventory/products/:id/kardex?sucursalId=`, `GET /inventory/movements?sucursalId&tipos&desde&hasta&productoId`, `POST /inventory/movements`, `POST /inventory/movements/lote`; `GET/POST /pedidos-internos`, `GET/PATCH/DELETE /pedidos-internos/:id`, `PATCH /pedidos-internos/:id/status`, `POST /pedidos-internos/:id/comments`. El pedido sale con `codigo`, `destino`, `solicitante`, `entregadoPor`, `costoTotal` y `transicionesValidas` (`pedido.presenter.ts`); la ficha suma `comentarios` y `movimientos`. Cada cambio se guarda en el historial (`/activity`, entidad `pedido_interno`).

## Eventos en tiempo real

| Acción | `entity` | `affects` | Qué se refresca en otras sesiones |
|---|---|---|---|
| crear, editar, archivar producto | `product` | — | lista de productos, formulario de pedido |
| movimiento | `stock` | `product`; `project`, `client` si es salida a proyecto | stock por sucursal, Movimientos, material del proyecto, equipos del cliente |
| crear, editar, cambiar estado, comentar pedido | `pedido_interno` | — | lista y ficha de pedidos, historial |
| entregar pedido | `pedido_interno` | `stock`, `product`, `project`, `client` | lo mismo + stock |

## Pruebas

- Unit: `modules/inventory/domain/inventory.rules.spec.ts`.
- e2e: `apps/api/test/app.e2e-spec.ts` › "inventory and internal orders (INV-01)" y el caso INV-02 (quién pide, código, destino, motivo, historial).
- Smoke: `node scripts/smoke-inventory.mjs` (ventas + admin en paralelo, técnico lectura).

## Pendientes

- [ ] Fotos en los comentarios del pedido (FILE-01).
- [ ] Números de serie por equipo (garantía por unidad) — si el dueño lo pide.
- [ ] Costo promedio ponderado: hoy la salida usa el costo vigente del producto.
