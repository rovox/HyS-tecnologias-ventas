# Finanzas

> Un solo libro de dinero (movimientos de ingreso, egreso y transferencia) que Gerencia valida en cajas; todo lo demás son vistas de ese libro · Ruta: `/finanzas` (Movimientos · Por validar · Cajas · Por cobrar · Gastos operativos · Reembolsos) · Estado: 🟢 FIN-01/02 (2026-10-23)

## Roles

| Rol | Ve | Hace |
|---|---|---|
| Administrador (Gerencia, valida mientras no exista el rol Contabilidad) | todo el libro, cajas, por cobrar | registrar, validar en caja, observar, anular, revertir, reembolsar, transferir |
| Ventas | todo el libro, cajas, por cobrar | registrar gastos y otros ingresos; cobrar en proyectos y trabajos; corregir y anular lo suyo antes de validar |
| Técnico | solo sus movimientos y las cajas | registrar sus gastos (p. ej. combustible pagado por él); cobrar en sus trabajos; corregir y anular lo suyo antes de validar |

## Estados

`por_validar → validado | observado | anulado` · `observado → por_validar` (al corregirlo) | `anulado` · validado es final.

| Transición | Quién | Condición | Confirmación |
|---|---|---|---|
| (registrar) → por_validar | todos | concepto válido para el tipo; monto > 0; en gastos, quién pagó | toast "queda por validar" |
| por_validar → validado | administrador | elegir la caja donde está el dinero | diálogo con la caja (sugiere la de la sucursal) |
| por_validar → observado | administrador | motivo | motivo en el diálogo |
| observado → por_validar | quien lo registró o administrador | corregirlo | toast "vuelve a validación" |
| por_validar / observado → anulado | quien lo registró o administrador | motivo | motivo en el diálogo |
| validado → (reverso) | administrador | motivo; una sola vez | se crea el movimiento inverso, validado en la misma caja |
| transferencia | administrador | dos cajas distintas | queda validada al registrarse |

## Vistas

| Vista | Tipo | Filtros y agrupaciones | Enlaces |
|---|---|---|---|
| Movimientos | lista (tarjetas en teléfono) | tipo, estado, de un proyecto · agrupar por concepto, caja, proyecto, quién registró · total neto · CSV | menú de acciones por fila |
| Por validar (administrador) | lista | por validar y observados | Validar… / Observar / Anular |
| Cajas | tarjetas | saldo validado por caja y total | — |
| Por cobrar (comercial) | lista | proyectos con saldo, mayor deuda primero | clic → proyecto |
| Gastos operativos | lista | egresos sin proyecto | — |
| Reembolsos | lista | gastos pagados por empleados sin reembolsar | Marcar reembolsado |

"Gastos operativos", "costos operativos" y "finanzas y contabilidad" que pidió el dueño son vistas del mismo libro (business-design §4.4); no hay tablas ni pantallas aparte.

## Flujos

| # | Tarea | Rol | Pasos (≤ 5) | Confirmación / notificación | Resultado y dónde se actualiza |
|---|---|---|---|---|---|
| 1 | Cobrar en un proyecto | comercial (técnico en proyectos con trabajos suyos) | 1. Proyecto 2. Registrar cobro 3. Adelanto / Cobro / Adicional, monto 4. Registrar | el formulario no deja superar el saldo | proyecto (cobrado, por validar), bandeja de validación |
| 2 | Cobrar en un trabajo suelto | todos (técnico en los suyos) | 1. Cronograma 2. trabajo 3. Registrar cobro | toast | saldo del trabajo, bandeja |
| 3 | Registrar gasto | todos | 1. Registrar gasto 2. concepto, monto, quién pagó, proyecto (opcional) 3. Registrar | toast | libro; si tiene proyecto, su costo y margen |
| 4 | Validar (rendición) | administrador | 1. Por validar 2. ⋯ Validar… 3. caja 4. Validar | toast | saldo de la caja |
| 5 | Observar y corregir | administrador → quien lo registró | 1. ⋯ Observar + motivo 2. el autor: ⋯ Corregir 3. Guardar | diálogos + toasts | vuelve a Por validar |
| 6 | Revertir un validado | administrador | 1. ⋯ Revertir 2. motivo | diálogo | movimiento inverso; la caja vuelve a su saldo |
| 7 | Reembolsar a un empleado | administrador | 1. Reembolsos 2. ⋯ Marcar reembolsado | diálogo | sale de Reembolsos |
| 8 | Transferir entre cajas | administrador | 1. Transferencia 2. desde, hacia, monto | toast | saldos de ambas cajas |

## Reglas (API)

| Regla | Archivo | Error que devuelve |
|---|---|---|
| Conceptos por tipo, monto > 0, transferencia con dos cajas distintas, gasto con quién pagó | `apps/api/src/modules/finance/domain/finance.rules.ts` (`movementError`) | 400 |
| Estados, caja para validar, motivo para observar/anular, validado no se edita | `checkMovementTransition`, `editMovementError` | 400 "Elige la caja…", "Indica el motivo", "…se corrige con un movimiento inverso" |
| Cobrado = adelantos + cobros por validar o validados; saldo; anulado o cancelado no debe | `incomeOf`, `balanceOf` | — |
| Un cobro no supera el saldo (el excedente es "adicional"); no se cobra en anulados ni cerrados | `incomeError` · `IncomeService` | 400 "…Registra el excedente como adicional." |
| Costo del proyecto = sus egresos; margen = monto + adicionales − costo | `expensesOf` · `projects/project.presenter.ts` | — |
| Saldo de caja = ingresos y transferencias entrantes − egresos y salientes, solo validados | `cashBoxBalance` | — |
| Validar, observar, revertir, reembolsar, transferir: solo Gerencia | `common/policy` `canValidateMovements` | 403 |
| Técnico: solo sus movimientos y cobros de sus trabajos | `canSeeLedger`, `IncomeService` | 403 |

## Eventos en tiempo real

| Acción | `entity` | `affects` | Qué se refresca en otras sesiones |
|---|---|---|---|
| cobro de proyecto o trabajo | `movement` | `project` / `schedule`, `client` | libro, bandeja, proyecto, cronograma |
| gasto, otro ingreso, transferencia | `movement` | `project` si es de un proyecto | libro, cajas, costo del proyecto |
| validar, observar, anular, revertir, reembolsar, corregir | `movement` | `project` / `schedule`, `client` | libro, bandeja, cajas |

## Pruebas

- Unit: `modules/finance/domain/finance.rules.spec.ts`.
- e2e: `apps/api/test/app.e2e-spec.ts` › "money ledger and rendición (FIN-01)".
- Smoke: `node scripts/smoke-finance.mjs` (técnico, administrador y ventas en paralelo).

## Pendientes

- [ ] Comprobante (foto de la factura) en cada movimiento (`comprobanteUrl` ya existe en el modelo).
- [ ] Rol CONTABILIDAD (AUTH-01): hoy valida el administrador.
- [ ] Exportación contable mensual (resultado del mes, flujo de caja) — prioridad 3.
- [ ] Borrar la tabla `schedule_payments` y las columnas `schedules.adelanto/saldo` (CLEAN-01, con aprobación).
