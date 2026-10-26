# Relevamientos y asistencias

> Visitas al cliente: **relevamiento** (ver qué necesita antes de cotizar) y **asistencia** (atender una falla, soporte o garantía) · Ruta: `/surveys` (`?visita=`, `?cliente=`, `?cotizacion=`) · Estado: 🟢 SUR-02 (2026-10-26)

## Roles

| Rol | Ve | Hace |
|---|---|---|
| Administrador, Ventas | todas | registrar, editar (también cerradas), asignar técnico y vendedor, cambiar estado, cobrar, fotos |
| Contabilidad | todas (lectura) | — (valida los cobros en Finanzas) |
| Técnico | las que creó o tiene asignadas | registrar (queda como técnico), editar las abiertas (no cambia quién atiende), cambiar estado, fotos, cobrar (el dinero lo tiene él) |

## Estados

`programado → en_camino → en_atencion → resuelto` · `pendiente` (esperando material, al cliente o una segunda visita) vuelve al trabajo · `cancelado` desde cualquier estado abierto. Resuelto y cancelado son finales: un problema nuevo es otra visita.

| Transición | Quién | Condición | Confirmación |
|---|---|---|---|
| → en_camino ("Salir a la visita"), → en_atencion ("Atender") | quien edita | — | la visita (tipo, cliente, lugar, técnico, fotos) |
| → resuelto ("Resolver") | quien edita | **al menos una foto**; si no tiene fecha de fin, queda la del día | aviso: queda cerrada |
| → pendiente / → programado | quien edita | — | la visita |
| → cancelado | quien edita | **motivo** (motivos rápidos) | motivo en el diálogo; se muestra "Cancelada: …" |

## Vistas

| Vista | Tipo | Filtros y agrupaciones | Enlaces |
|---|---|---|---|
| Lista | `ListView` (tarjetas en teléfono); abre con el filtro "Abiertas"; filas rojas si está atrasada, hay que volver o no tiene técnico; ámbar si es urgente | estado (con contadores), atrasadas, hay que volver, sin técnico, urgentes, cobro por rendir, tipo, en garantía, mis visitas · agrupar por estado, técnico, tipo, cliente · CSV | el siguiente paso en la fila (Salir, Atender, Resolver; sin foto abre la visita) |
| Panel de la visita | panel lateral | — | acciones, datos, garantía (verde/rojo), cobros, fotos, historial; cotización |
| Formulario | diálogo en partes: Visita · Asistencia **o** Relevamiento · Cierre | — | cliente con alta rápida, técnico y vendedor con buscador, lugar + link de ubicación, trabajo revisado |
| Cliente › Relevamientos | pestaña de la ficha | — | fila → la visita; "Ver y registrar visitas de este cliente" |
| Cotización › Relevamientos | smart button | — | `/surveys?cotizacion=` (la visita nueva toma el cliente de la cotización) |

## Flujos

| # | Tarea | Rol | Pasos (≤ 5) | Confirmación / notificación | Resultado y dónde se actualiza |
|---|---|---|---|---|---|
| 1 | Registrar una visita | comercial o técnico | 1. Nueva visita 2. tipo, cliente (el lugar y el link se copian del cliente), fecha, hora, técnico 3. datos de asistencia o relevamiento 4. Registrar visita | toast; abre la visita | lista de todas las sesiones; el técnico la ve en su teléfono |
| 2 | Atender y resolver | técnico | 1. Salir 2. Atender 3. Agregar foto (cámara del teléfono) 4. Resolver | diálogo; aviso si falta la foto | estado en todas las sesiones |
| 3 | Cobrar la asistencia | técnico o comercial | 1. Registrar cobro 2. monto, método, quién recibió | toast "queda por validar" | libro de caja (concepto Asistencia, por validar), Por rendir, bandeja de Contabilidad |
| 4 | Revisar un trabajo en garantía | comercial | 1. Editar 2. Trabajo que se revisa | toast | garantía calculada: verde "En garantía hasta …" o rojo "Venció el …" |
| 5 | Cancelar | quien edita | 1. Cancelar visita 2. motivo | diálogo con motivo | estado cancelado, motivo visible y en el historial |

## Reglas (API)

| Regla | Archivo | Error que devuelve |
|---|---|---|
| Flujo de estados; resolver pide foto; cancelar pide motivo | `apps/api/src/modules/relevamientos/domain/relevamientos.rules.ts` (`checkVisitTransition`) | 400 |
| Garantía = entrega del proyecto + sus meses, o 12 meses desde que terminó el trabajo suelto; sin entrega o sin terminar, no hay | `warrantyUntil`, `inWarranty` | — |
| El trabajo revisado es del mismo cliente | `RelevamientosService.relatedJob` | 400 "El trabajo relacionado es de otro cliente" |
| Cobrado y por rendir = cobros por validar + validados | `visitPayments` | — |
| Una visita se cobra como `asistencia` (sin saldo previo); `asistencia` solo en visitas; no en una visita cancelada | `finance.rules.ts` `incomeConceptError` · `IncomeService` | 400 |
| Técnico: solo sus visitas; no cambia técnico, vendedor ni sucursal; no edita cerradas | `common/policy` `relevamientoWhere` · `RelevamientosService.update` | 403 |
| Foto: solo imágenes, servida solo a quien ve la visita | `attachPhoto`, `filePath` | 400 / 403 |

API: `GET/POST /relevamientos` (filtros `cotizacionId`, `clienteId`), `GET/PATCH /relevamientos/:id`, `POST /relevamientos/:id/estado`, `POST /relevamientos/:id/cobros`, `POST /relevamientos/:id/files`, `GET /files/relevamientos/:name`. La visita sale con `tecnico`, `vendedor`, `fotos`, `enGarantia`, `cobrado`, `porRendir`, `movements`, `transicionesValidas` (`relevamiento.presenter.ts`). Campos en `relevamientos` (migración `20261026000000_visit_fields`); el dinero va al libro (`cash_movements.relevamientoId`), no a columnas.

## Eventos en tiempo real

| Acción | `entity` | `affects` | Qué se refresca en otras sesiones |
|---|---|---|---|
| crear, editar, cambiar estado, foto | `relevamiento` | `client` | lista, panel, historial, ficha del cliente |
| cobro | `movement` | `relevamiento`, `client` | panel (cobrado, por rendir), Finanzas, Por rendir |

## Pruebas

- Unit: `modules/relevamientos/domain/relevamientos.rules.spec.ts`; `finance.rules.spec.ts` (concepto asistencia).
- e2e: `apps/api/test/app.e2e-spec.ts` › "relevamientos y asistencias (SUR-02)".
- Smoke: `node scripts/smoke-surveys.mjs` (ventas en escritorio + técnico en teléfono, en paralelo).

## Pendientes

- [ ] Fotos en WebP y descarga en JPG, visor (FILE-01).
- [ ] Convertir un relevamiento en cotización desde el panel (hoy la cotización se crea aparte y la visita se enlaza desde la cotización).
