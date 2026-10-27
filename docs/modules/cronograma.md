# Cronograma

> Quién va dónde, cuándo y en qué estado está cada trabajo; lo puede leer cualquier empleado · Ruta: `/schedule` (Semana · Mes · Lista) · Estado: 🟢 SCH-04 (2026-10-27)

## Roles

| Rol | Ve | Hace |
|---|---|---|
| Administración y Contabilidad (Gerencia) | todos los trabajos | programar trabajos sueltos, editar (Editar trabajo), asignar técnico, iniciar, terminar, cancelar, cobrar, registrar material, notas |
| Ventas | todos los trabajos | lo mismo que Administrador |
| Técnico | sus trabajos (API) | iniciar y terminar (no cancela), cobrar, registrar el material usado en un trabajo de proyecto, notas, horario — solo en sus trabajos |

El panel de cada trabajo dice en una línea qué puede hacer quien lo mira ("Puedes: …"); los botones que no le corresponden no aparecen (`features/schedule/permissions.js`).

## Estados

`programado → en_proceso → terminado` · `cancelado` desde programado o en_proceso.

| Transición | Quién | Condición | Confirmación |
|---|---|---|---|
| programado → en_proceso | todos | — | "¿Iniciar el trabajo?" |
| en_proceso → terminado | todos | guarda la fecha de finalización | "¿Marcar el trabajo como terminado?" |
| → cancelado | comercial (no el técnico, SCH-04) | motivo (queda en las notas); un trabajo cancelado no debe nada | motivo en el diálogo |

## Vistas

| Vista | Tipo | Filtros y agrupaciones | Enlaces |
|---|---|---|---|
| Semana | 7 columnas; en teléfono, lista por día (días con trabajos y hoy); "+" en cada día programa un trabajo ese día; Iniciar / Terminar (verde) debajo de cada tarjeta para quien puede | **pestañas de estado arriba** (Activos por defecto · Programados · En proceso · Terminados · Cancelados · Todos, con su número); mis trabajos, sin técnico (botón rojo "Sin técnico (N)"), categoría; búsqueda; Hoy / ← → | clic → panel del trabajo |
| Mes | cuadrícula de 6 semanas, hasta 3 trabajos por día y "+N más" (abre esa semana) | igual | clic → panel |
| Lista | lista; fila con borde rojo si está abierta y sin técnico | igual + agrupar por técnico, categoría, estado · CSV | clic → panel |
| Panel del trabajo | panel lateral: estado, Editar trabajo, Registrar cobro; Técnico se asigna ahí mismo (en rojo "Asignar técnico" si no tiene); monto, cobrado y saldo (rojo si debe) | — | Proyecto (si es de un proyecto), historial con nombres |

Cada trabajo es una tarjeta pintada con el color de su **estado** (fondo suave, borde fuerte e icono); la división es una etiqueta de texto con icono, sin color. Muestra hora, cliente, qué se hace y técnico ("Sin técnico" en rojo). La leyenda muestra solo estados. No hay dinero en las tarjetas.

## Flujos

| # | Tarea | Rol | Pasos (≤ 5) | Confirmación / notificación | Resultado y dónde se actualiza |
|---|---|---|---|---|---|
| 1 | Programar un trabajo suelto | comercial | "Programar trabajo" (o "+" en un día), tres pasos: 1. **Qué**: cliente, categoría, trabajo, lugar, monto 2. **Cuándo**: fecha, desde/hasta cada 30 min, con los trabajos ya programados ese día 3. **Quién**: técnico (con cuántos trabajos tiene ese día) y sucursal → Programar | toast | aparece en el cronograma de todos; el técnico lo ve en su teléfono |
| 2 | Iniciar / terminar | técnico (suyos) o comercial | 1. Iniciar o Terminar en la tarjeta, la fila o el panel 2. Confirmar | diálogo + toast | estado en todas las sesiones; el trabajo pasa de Activos a Terminados |
| 2b | Registrar material usado | técnico (suyos) o comercial, en un trabajo de proyecto | 1. panel › Registrar material 2. sucursal de la que sale, material, cantidad 3. Registrar | toast | sale del stock; costo y material del proyecto |
| 3 | Cobrar en el trabajo | técnico (suyos) o comercial | 1. Registrar cobro 2. tipo y monto 3. Registrar | toast "queda por validar" | saldo del trabajo o del proyecto; bandeja de Finanzas |
| 4 | Asignar técnico | comercial | 1. panel 2. "Asignar técnico" (buscador) | toast "Asignado a X" | el técnico lo ve en su teléfono al instante |
| 4b | Editar o reprogramar | comercial | 1. panel › Editar trabajo 2. categoría, trabajo, fecha, horario, técnico, vendedor, lugar y link, monto (solo trabajo suelto) 3. Guardar cambios | toast | el trabajo cambia en todas las sesiones; cada cambio en el historial |
| 5 | Cancelar | comercial | 1. Cancelar 2. motivo 3. Confirmar | diálogo con motivo | estado cancelado; deja de deber |
| 6 | Notas | todos | 1. escribir 2. Guardar notas | toast | panel e historial |

Los trabajos de un proyecto se agregan desde el proyecto (`/projects/:id` › Nuevo trabajo) y su dinero es el del proyecto: el panel lo dice y enlaza al proyecto.

## Reglas (API)

| Regla | Archivo | Error que devuelve |
|---|---|---|
| Flujo de estados | `apps/api/src/modules/schedules/domain/schedules.rules.ts` (`checkScheduleTransition`) | 400 "Transición inválida…" |
| Categoría = una de las 3 divisiones; la de un trabajo de cotización viene de ella | `categoryChangeError` + `CategoriesService.assertDivision` | 400 |
| Un trabajo de proyecto no tiene monto propio | `montoChangeError` | 400 "El monto es del proyecto…" |
| Saldo de un trabajo suelto = monto − cobros (libro); cancelado = 0 | `finance` `incomeOf`, `balanceOf` (en `SchedulesService.present`) | — |
| Técnico: solo estado, notas, horario de sus trabajos; no cancela | `SchedulesService.update` | 403 |
| Técnico: material (`salida_proyecto`) solo a un proyecto donde tiene un trabajo | `InventoryService.registerMovement` (`usesMaterialOnOwnJobs`) | 403 |
| Al editar, `''` borra técnico, vendedor, lugar, link, horario o notas | `UpdateScheduleDto` (`clearable`) | — |

## Eventos en tiempo real

| Acción | `entity` | `affects` | Qué se refresca en otras sesiones |
|---|---|---|---|
| crear, mover, cambiar estado | `schedule` | `project` si es de un proyecto | cronograma, panel, proyecto |
| cobro | `movement` | `schedule` / `project`, `client` | panel, proyecto, Finanzas |

## Pruebas

- Unit: `modules/schedules/domain/schedules.rules.spec.ts`.
- e2e: `apps/api/test/app.e2e-spec.ts` › "money ledger and rendición (FIN-01)" (trabajo suelto; "edits a job… (SCH-03)"), "projects from approved quotations (PRO-01)".
- Smoke: `node scripts/smoke-schedule.mjs` (ventas en escritorio + técnico en teléfono, en paralelo).

## Pendientes

- [ ] Arrastrar un trabajo a otro día (hoy se reprograma con Editar trabajo).
- [ ] Asistencias con su bandeja propia (business-design §4.2): hoy son trabajos sueltos.
- [ ] El formulario anterior (`ScheduleFormModal`) sigue solo en la ficha del cliente hasta CLI-01.
