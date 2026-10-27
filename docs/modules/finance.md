# Finanzas

> Un solo libro de dinero (ingresos, egresos y transferencias) que Contabilidad y Gerencia validan en cajas; todo lo demás son vistas de ese libro · Ruta: `/finanzas` (Libro · Bandeja de rendición · Por rendir · Cajas · Por cobrar · Reembolsos) · Estado: 🟢 FIN-03 (2026-10-25)

## Roles

| Rol | Ve | Hace |
|---|---|---|
| Contabilidad y Administrador (Gerencia) | todo el libro, bandeja, por rendir, cajas, por cobrar | registrar, validar (✓ en la caja de la sucursal o en otra), observar (✗), editar cualquier movimiento (también validado), anular (también validado), reembolsar, transferir |
| Ventas | todo el libro, por rendir, cajas, por cobrar | registrar gastos y otros ingresos; cobrar en proyectos y trabajos indicando quién recibió el dinero; corregir y anular lo suyo antes de validar |
| Técnico | sus movimientos (registrados o cuyo dinero tiene) y las cajas | registrar sus gastos; cobrar en sus trabajos (el dinero lo tiene él); corregir y anular lo suyo antes de validar |

## Estados

`por_validar → validado | observado | anulado` · `observado → por_validar` (al corregirlo) | `anulado` · `validado → anulado` (sale de su caja) · anulado es final.

| Transición | Quién | Condición | Confirmación |
|---|---|---|---|
| (registrar) → por_validar | todos | concepto válido; monto > 0; en gastos, quién pagó; en cobros, quién recibió el dinero | aviso "queda por validar" + "Ver por rendir" |
| por_validar → validado | Contabilidad, Gerencia | caja | ✓ valida en la caja de la sucursal (el aviso ofrece "Cambiar caja"); "Validar en otra caja…" muestra cómo queda la caja |
| por_validar → observado | Contabilidad, Gerencia | motivo (opciones rápidas) | ✗ con el detalle del movimiento |
| observado → por_validar | quien lo registró, Contabilidad, Gerencia | corregirlo | aviso "vuelve a validación" |
| → anulado | quien lo registró (antes de validar), Contabilidad, Gerencia | motivo | diálogo con el detalle y el **efecto** (caja que baja o sube, saldo que vuelve a deberse, costo que baja) |
| editar un validado | Contabilidad, Gerencia | el saldo se respeta si cambia el monto | aviso; queda en el historial con el valor anterior |
| transferencia | Contabilidad, Gerencia | dos cajas distintas | queda validada al registrarse |

## Vistas

| Vista | Tipo | Filtros y agrupaciones | Enlaces |
|---|---|---|---|
| Libro | lista con filas numeradas y alternadas; borde ámbar si espera, rojo si está observado | estado (con contador), tipo, gastos operativos (sin proyecto), de un proyecto · agrupar por concepto, caja, proyecto, quién registró, quién tiene el dinero · total neto · CSV | clic → panel del movimiento |
| Bandeja de rendición | lista con ✓ ✗ ✎ y ⋯ en cada fila; contador en la pestaña | por validar y observados | panel |
| Por rendir | una tabla por persona con el total que tiene sin rendir | — | ✓ registra que lo entregó en caja |
| Panel del movimiento | panel lateral | — | proyecto, acciones, historial (quién cambió qué) |
| Cajas | tarjetas | saldo validado por caja y total | — |
| Por cobrar | lista | proyectos con saldo, mayor deuda primero | clic → proyecto |
| Reembolsos | lista | gastos pagados por empleados sin reembolsar | Marcar reembolsado |

"Gastos operativos", "costos operativos" y "finanzas y contabilidad" son vistas del mismo libro (business-design §4.4).

## Flujos

| # | Tarea | Rol | Pasos (≤ 5) | Confirmación / notificación | Resultado y dónde se actualiza |
|---|---|---|---|---|---|
| 1 | Cobrar en un proyecto o trabajo | comercial, técnico (suyos), Contabilidad | 1. Registrar cobro 2. tipo, monto 3. quién recibió el dinero 4. Registrar cobro | el formulario no deja superar el saldo | proyecto o trabajo, Por rendir, bandeja |
| 2 | Registrar gasto | todos | 1. Registrar gasto (o desde la pestaña Gastos del proyecto) 2. concepto, monto, quién pagó 3. Registrar | aviso | libro; costo del proyecto |
| 3 | Validar (rendición) | Contabilidad, Gerencia | 1. Bandeja 2. ✓ | aviso con "Cambiar caja" | caja, Por rendir |
| 4 | Observar y corregir | Contabilidad → autor | 1. ✗ + motivo rápido 2. el autor: ⋯ Corregir 3. Guardar | diálogos + avisos | vuelve a la bandeja |
| 5 | Corregir un validado | Contabilidad, Gerencia | 1. panel o ⋯ Editar 2. cambiar 3. Guardar | aviso | historial con antes → después |
| 6 | Anular | Contabilidad, Gerencia (o el autor antes de validar) | 1. ⋯ Anular 2. revisar el efecto 3. motivo | diálogo con detalle y efecto | caja, saldo o costo |
| 7 | Reembolsar a un empleado | Contabilidad, Gerencia | 1. Reembolsos 2. ⋯ Marcar reembolsado | diálogo | sale de Reembolsos |
| 8 | Transferir entre cajas | Contabilidad, Gerencia | 1. Transferencia 2. desde, hacia, monto | aviso | saldos de ambas cajas |

## Reglas (API)

| Regla | Archivo | Error que devuelve |
|---|---|---|
| Conceptos por tipo, monto > 0, transferencia con dos cajas distintas, gasto con quién pagó | `apps/api/src/modules/finance/domain/finance.rules.ts` (`movementError`) | 400 |
| Estados, caja para validar, motivo para observar/anular | `checkMovementTransition` | 400 "Elige la caja…", "Indica el motivo" |
| Editar: el autor mientras espera; Contabilidad y Gerencia siempre; nunca un anulado | `editMovementError` | 400 |
| Cobrado = adelantos + cobros por validar o validados; saldo; anulado o cancelado no debe | `incomeOf`, `balanceOf` | — |
| Un cobro (o su corrección) no supera el saldo; el excedente es "adicional" | `incomeError` · `IncomeService`, `LedgerService.update` | 400 |
| Quién tiene el dinero por rendir, por persona | `custody` · `GET /finance/por-rendir` | — |
| Efecto de validar o anular (cajas, saldo, costo) | `movementImpact` · `GET /finance/movements/:id/impacto` | — |
| Saldo de caja = solo validados | `cashBoxBalance` | — |
| Validar, observar, editar validados, anular validados, reembolsar, transferir: Contabilidad y Gerencia | `common/policy` `canValidateMovements` | 403 |
| Técnico: solo sus movimientos, cobros de sus trabajos, el dinero lo recibe él | `canSeeLedger`, `IncomeService` | 403 |

## Eventos en tiempo real

| Acción | `entity` | `affects` | Qué se refresca en otras sesiones |
|---|---|---|---|
| cobro de proyecto o trabajo | `movement` | `project` / `schedule`, `client` | libro, bandeja, por rendir, proyecto, cronograma |
| gasto, otro ingreso, transferencia | `movement` | `project` si es de un proyecto | libro, cajas, costo del proyecto |
| validar, observar, anular, editar, reembolsar | `movement` | `project` / `schedule`, `client` | libro, bandeja, por rendir, cajas, panel e historial |

## Pruebas

- Unit: `modules/finance/domain/finance.rules.spec.ts` (incluye custodia y efecto).
- e2e: `apps/api/test/app.e2e-spec.ts` › "money ledger and rendición (FIN-01)" (editar validado con historial, anular validado, sin "revertir", por rendir).
- Smoke: `node scripts/smoke-finance.mjs` (técnico, Contabilidad y ventas en paralelo, 9 pasos).

## Pendientes

- [ ] Comprobante (foto de la factura) en cada movimiento (FILE-01).
- [ ] Exportación contable mensual (resultado del mes, flujo de caja) — prioridad 3.
- [x] Borrar la tabla `schedule_payments` y las columnas `schedules.adelanto/saldo` (CLEAN-01, 2026-10-27).
