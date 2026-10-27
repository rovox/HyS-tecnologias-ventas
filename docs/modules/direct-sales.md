# Ventas directas

> Productos vendidos desde el stock de una sucursal y cobrados en el momento, con su nota de venta guardada · Ruta: `/ventas-directas` (y "Vender" en Inventario) · Estado: 🟢 VD-01/02/03 (2026-10-27)

Vocabulario de `docs/domain/business-design.md` §4.3. Decisiones del dueño (2026-10-27): Central abastece a todas las sucursales; el cobro de una venta se valida al instante; la nota (hoja carta, correlativo global) se guarda como respaldo y no se vuelve a generar; un error se corrige anulando y emitiendo una venta nueva vinculada.

## Roles

| Rol | Ve | Hace |
|---|---|---|
| Administración y Contabilidad (Gerencia) | todas las ventas | vender desde cualquier sucursal, anular con motivo, corregir |
| Ventas | todas las ventas (empieza en su sucursal) | vender desde su sucursal o desde Central |
| Técnico | — | no vende |

## Estados

`registrada` (se muestra "Cancelada": pagada) `→ anulada`

| Transición | Quién | Condición | Confirmación |
|---|---|---|---|
| registrada → anulada | Gerencia | motivo obligatorio (motivos rápidos) | diálogo con el efecto: el stock vuelve, los cobros salen de sus cajas, la nota se marca ANULADA |

## Vistas

| Vista | Tipo | Filtros y agrupaciones | Enlaces |
|---|---|---|---|
| Ventas directas | lista del día (◀ día ▶, Hoy) por sucursal o de toda la empresa; totales arriba: ventas, efectivo, QR, transferencia, anuladas | canceladas / anuladas; agrupar por vendedor o sucursal; buscar nota, cliente, NIT, producto | clic o 📄 → nota en el visor; "Ver el libro de este día" |
| Nueva venta | diálogo | — | sale de (mi sucursal o Central), productos con su stock, cliente opcional, pagos por medio |
| Nota | visor PDF en la app | — | Imprimir, Descargar |

## Flujos

| # | Tarea | Rol | Pasos (≤ 5) | Confirmación / notificación | Resultado y dónde se actualiza |
|---|---|---|---|---|---|
| 1 | Vender | Ventas, Gerencia | 1. Nueva venta (o Inventario › Vender) 2. productos y cantidades 3. cliente (opcional) 4. "Todo en efectivo" u otros medios hasta que cuadre 5. Vender | toast "Venta NV-0445 registrada"; se abre la nota | stock de la sucursal, libro (cobros validados en su caja), cajas, lista de ventas — en vivo |
| 2 | Anular | Gerencia | 1. 🗑 en la fila 2. motivo 3. Anular | diálogo con el efecto | stock devuelto, cobros anulados, nota con copia ANULADA |
| 3 | Corregir | Gerencia | 1. ✏️ en la fila 2. motivo (anula) 3. la venta nueva se abre con lo mismo 4. ajustar y Vender | toasts | la anulada dice "Corregida en NV-…", la nueva "Corrige NV-…" |

## Reglas (API)

| Regla | Archivo | Error que devuelve |
|---|---|---|
| Al menos una línea; cantidad > 0; descuento de línea ≤ su importe; descuento de la venta ≤ subtotal | `apps/api/src/modules/direct-sales/domain/direct-sales.rules.ts` (`saleError`) | 400 |
| Stock suficiente en la sucursal de la que sale (sumando líneas del mismo producto) | `saleError` | 400 "Stock insuficiente…" |
| Los pagos suman el total; medios: efectivo, QR, transferencia | `saleError` | 400 "Los pagos … no suman el total" |
| Ventas vende desde su sucursal o Central; Gerencia desde cualquiera; el técnico no vende | `canSellFromBranch`, `DirectSalesService.assertSeller` | 403 |
| Cada pago va validado a la caja de su medio: efectivo → caja de la sucursal; QR → caja QR; transferencia → banco; sin caja no se vende | `boxForPayment` | 400 "No hay caja para cobros por …" |
| Número global de nota (`doc_counters.nota_venta`), NV-0445 | `saleNumber`, `DirectSalesService.createIn` | — |
| La nota se genera y guarda en la misma transacción; si no se puede guardar, la venta no queda | `sale-note.ts`, `createIn` | 500 |
| Anular: solo Gerencia, con motivo, una vez | `annulError` | 403 / 400 |
| Corregir: solo una venta anulada y una sola vez | `createIn` | 400 |
| El cobro de una venta no se edita ni se anula desde el libro | `LedgerService.update` / `transition` | 400 "se corrige anulando la venta" |

## Eventos en tiempo real

`directSale.create` y `directSale.annul` (entidad `directSale`) afectan `product`, `stock`, `movement` y `client`: la lista de ventas, el inventario, el libro y las cajas se actualizan en todas las sesiones.

## Pruebas

- Unit: `direct-sales.rules.spec.ts`, `sale-note.spec.ts`, `common/domain/monto-en-letras.spec.ts`.
- e2e: "direct sales per branch (VD-01)" en `apps/api/test/app.e2e-spec.ts`.
- Navegador: `node scripts/smoke-direct-sales.mjs` (vendedor de Punata + Contabilidad, en vivo).

## Pendientes

- [ ] El cierre de caja diario (FIN-04) suma las ventas en efectivo de la sucursal.
- [ ] Datos de la empresa en la nota (NIT 4416960, direcciones por sucursal) se cambian hoy en la migración/BD; sin pantalla de edición (AUTH-03 fuera de alcance).
- [ ] El correlativo empieza en 1; si se quiere continuar la numeración anterior (p. ej. desde 445), se ajusta `doc_counters` antes de la primera venta real.
