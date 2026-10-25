# Inventario

> Productos básicos con su stock por sucursal, calculado siempre desde los movimientos; los pedidos internos mueven stock al entregarse · Ruta: `/inventario` (Productos · Movimientos) · Estado: 🟢 INV-01 (2026-10-23)

## Roles

| Rol | Ve | Hace |
|---|---|---|
| Administrador | todo | lo de Ventas + **ajustes** (con motivo) |
| Ventas | todo | crear y editar productos, archivar, entrada (compra), transferir, salida a proyecto; pedidos internos con productos |
| Técnico | todo (lectura) | — |

Los productos no se borran: se **archivan** (dejan de ofrecerse en pedidos, su historial queda).

## Estados

Producto: activo ↔ archivado. Movimientos: no tienen estados; un error se corrige con otro movimiento (ajuste).

| Movimiento | De → a | Quién | Condición |
|---|---|---|---|
| `entrada` | — → sucursal | comercial | cantidad > 0; costo unitario (actualiza el costo del producto) |
| `transferencia` | sucursal → otra sucursal | comercial | hay stock en el origen |
| `salida_proyecto` | sucursal → proyecto | comercial | hay stock; proyecto abierto; suma al **costo del proyecto** |
| `ajuste` | sucursal ± | administrador | motivo obligatorio; faltante no deja stock negativo |

Los servicios (p. ej. "Instalación por punto de red") no llevan stock.

## Vistas

| Vista | Tipo | Filtros y agrupaciones | Acciones |
|---|---|---|---|
| Productos | lista (tarjetas en teléfono): una columna por sucursal + total, en rojo si está bajo el mínimo | stock bajo, archivados, tipo, categoría · agrupar por categoría, tipo, marca · CSV | Nuevo producto · menú por fila: Entrada, Transferir, Salida a proyecto, Ajustar (Gerencia y Contabilidad), Editar, Archivar |
| Movimientos | lista | búsqueda por producto, nota, motivo, proyecto | — |
| Proyecto › Material | pestaña de la ficha del proyecto | — | costo = Σ cantidad × costo unitario |
| Cliente › Equipos | pestaña de la ficha del cliente | — | equipos entregados a sus proyectos, con la garantía del proyecto |
| Pedido interno (formulario) | diálogo | — | cada ítem: producto del inventario (muestra el stock del origen) o texto libre (no mueve stock) |

## Flujos

| # | Tarea | Rol | Pasos (≤ 5) | Confirmación / notificación | Resultado y dónde se actualiza |
|---|---|---|---|---|---|
| 1 | Registrar producto | comercial | 1. Nuevo producto 2. código, nombre, categoría (división), tipo, unidad, costo, precio, mínimo 3. Crear | toast | lista de todas las sesiones; selector de productos del pedido |
| 2 | Registrar una compra | comercial | 1. ⋯ Entrada 2. sucursal, cantidad, costo 3. Registrar | toast | stock de la sucursal |
| 3 | Mover entre sucursales | comercial | 1. ⋯ Transferir 2. de, hacia, cantidad 3. Registrar | aviso si supera el stock; toast | stock de ambas sucursales |
| 4 | Pedido interno con productos | comercial o técnico | 1. Pedidos internos › Crear pedido 2. para un trabajo o una sucursal 3. ítems del inventario 4. Crear pedido | toast | pedido solicitado; no mueve stock todavía |
| 5 | Entregar el pedido | comercial | 1. pedido 2. estado › Entregado | confirmación | **en la misma transacción**: a una sucursal → transferencia; a un trabajo de proyecto → salida al proyecto (costo y margen del proyecto, equipos del cliente) |
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
| Gestionar: comerciales; ajustar: Gerencia y Contabilidad (403 para los demás) | `common/policy` `canManageInventory`, `canAdjustInventory` | 403 |

API: `GET/POST /inventory/products`, `PATCH /inventory/products/:id`, `GET/POST /inventory/movements`.

## Eventos en tiempo real

| Acción | `entity` | `affects` | Qué se refresca en otras sesiones |
|---|---|---|---|
| crear, editar, archivar producto | `product` | — | lista de productos, formulario de pedido |
| movimiento | `stock` | `product`; `project`, `client` si es salida a proyecto | stock por sucursal, Movimientos, material del proyecto, equipos del cliente |
| entregar pedido | `pedido_interno` | `stock`, `product`, `project`, `client` | lo mismo |

## Pruebas

- Unit: `modules/inventory/domain/inventory.rules.spec.ts`.
- e2e: `apps/api/test/app.e2e-spec.ts` › "inventory and internal orders (INV-01)".
- Smoke: `node scripts/smoke-inventory.mjs` (ventas + admin en paralelo, técnico lectura).

## Pendientes

- [ ] La lista y la ficha de pedidos internos siguen con las páginas anteriores (solo el formulario es nuevo): pasarlas al kit Odoo con barra de estado (CLEAN-01 / doc `pedidos-internos.md`).
- [ ] Números de serie por equipo (garantía por unidad) — si el dueño lo pide.
- [ ] Costo promedio ponderado: hoy la salida usa el costo vigente del producto.
