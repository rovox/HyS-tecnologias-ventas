# Cronograma

> Quién va dónde, cuándo y en qué estado está cada trabajo; lo puede leer cualquier empleado · Ruta: `/schedule` (Semana · Mes · Lista) · Estado: 🟢 SCH-02 (2026-10-23)

## Roles

| Rol | Ve | Hace |
|---|---|---|
| Administrador | todos los trabajos | programar trabajos sueltos, reprogramar, asignar técnico, iniciar, terminar, cancelar, cobrar, notas |
| Ventas | todos los trabajos | lo mismo que Administrador |
| Técnico | sus trabajos (API) | iniciar, terminar, cancelar, cobrar en sus trabajos, notas, horario |

## Estados

`programado → en_proceso → terminado` · `cancelado` desde programado o en_proceso.

| Transición | Quién | Condición | Confirmación |
|---|---|---|---|
| programado → en_proceso | todos | — | "¿Iniciar el trabajo?" |
| en_proceso → terminado | todos | guarda la fecha de finalización | "¿Marcar el trabajo como terminado?" |
| → cancelado | todos | motivo (queda en las notas); un trabajo cancelado no debe nada | motivo en el diálogo |

## Vistas

| Vista | Tipo | Filtros y agrupaciones | Enlaces |
|---|---|---|---|
| Semana | 7 columnas; en teléfono, lista por día (días con trabajos y hoy) | mis trabajos, sin técnico, categoría, estado; búsqueda; Hoy / ← → | clic → panel del trabajo |
| Mes | cuadrícula de 6 semanas, hasta 3 trabajos por día y "+N más" (abre esa semana) | igual | clic → panel |
| Lista | lista | igual + agrupar por técnico, categoría, estado · CSV | clic → panel |
| Panel del trabajo | panel lateral | — | Proyecto (si es de un proyecto), historial |

Cada trabajo es una etiqueta corta: color de la división (borde), punto del estado, hora, cliente, qué se hace y técnico. La leyenda está arriba. No hay dinero en las etiquetas.

## Flujos

| # | Tarea | Rol | Pasos (≤ 5) | Confirmación / notificación | Resultado y dónde se actualiza |
|---|---|---|---|---|---|
| 1 | Programar un trabajo suelto | comercial | 1. Nuevo trabajo 2. cliente, categoría, trabajo, fecha, técnico, monto 3. Programar | toast | aparece en el cronograma de todos; el técnico lo ve en su teléfono |
| 2 | Iniciar / terminar | técnico o comercial | 1. clic en el trabajo 2. Iniciar o Terminar 3. Confirmar | diálogo + toast | estado en todas las sesiones |
| 3 | Cobrar en el trabajo | técnico (suyos) o comercial | 1. Registrar cobro 2. tipo y monto 3. Registrar | toast "queda por validar" | saldo del trabajo o del proyecto; bandeja de Finanzas |
| 4 | Reprogramar o asignar | comercial | 1. panel 2. fecha, horario, técnico 3. Guardar | toast | el trabajo cambia de día o de técnico |
| 5 | Cancelar | todos | 1. Cancelar 2. motivo 3. Confirmar | diálogo con motivo | estado cancelado; deja de deber |
| 6 | Notas | todos | 1. escribir 2. Guardar notas | toast | panel e historial |

Los trabajos de un proyecto se agregan desde el proyecto (`/projects/:id` › Nuevo trabajo) y su dinero es el del proyecto: el panel lo dice y enlaza al proyecto.

## Reglas (API)

| Regla | Archivo | Error que devuelve |
|---|---|---|
| Flujo de estados | `apps/api/src/modules/schedules/domain/schedules.rules.ts` (`checkScheduleTransition`) | 400 "Transición inválida…" |
| Categoría = una de las 3 divisiones; la de un trabajo de cotización viene de ella | `categoryChangeError` + `CategoriesService.assertDivision` | 400 |
| Un trabajo de proyecto no tiene monto propio | `montoChangeError` | 400 "El monto es del proyecto…" |
| Saldo de un trabajo suelto = monto − cobros (libro); cancelado = 0 | `finance` `incomeOf`, `balanceOf` (en `SchedulesService.present`) | — |
| Técnico: solo estado, notas, horario de sus trabajos | `SchedulesService.update` | 403 |

## Eventos en tiempo real

| Acción | `entity` | `affects` | Qué se refresca en otras sesiones |
|---|---|---|---|
| crear, mover, cambiar estado | `schedule` | `project` si es de un proyecto | cronograma, panel, proyecto |
| cobro | `movement` | `schedule` / `project`, `client` | panel, proyecto, Finanzas |

## Pruebas

- Unit: `modules/schedules/domain/schedules.rules.spec.ts`.
- e2e: `apps/api/test/app.e2e-spec.ts` › "money ledger and rendición (FIN-01)" (trabajo suelto), "projects from approved quotations (PRO-01)".
- Smoke: `node scripts/smoke-schedule.mjs` (ventas en escritorio + técnico en teléfono, en paralelo).

## Pendientes

- [ ] Arrastrar un trabajo a otro día (hoy se reprograma desde el panel).
- [ ] Asistencias con su bandeja propia (business-design §4.2): hoy son trabajos sueltos.
- [ ] El formulario anterior (`ScheduleFormModal`) sigue solo en la ficha del cliente hasta CLI-01.
