# Tareas

> Pendientes cortas (llamar, enviar un PDF, visitar) siempre a la vista; una tarea puede convertirse en cotización · Ruta: botón **Tareas** en la cabecera de todas las páginas (panel lateral) · Estado: 🟢 TSK-01 (2026-10-23)

## Roles

| Rol | Ve | Hace |
|---|---|---|
| Administrador | todas | crear, tomar, asignar, completar, descartar, convertir en cotización |
| Ventas | todas | lo mismo que Administrador |
| Técnico | las suyas (creadas o asignadas) y las sin asignar que creó | crear, tomar, completar, descartar (no convierte en cotización) |

## Estados

`pendiente → completada | descartada`

| Transición | Quién | Condición | Confirmación |
|---|---|---|---|
| pendiente → completada | creador, responsable o comercial | — | casilla + toast "Completada: …" |
| pendiente → descartada | creador, responsable o comercial | — | "¿Descartar la tarea?" |
| pendiente → completada (convertida) | comercial | sin cotización previa; al guardar la cotización | formulario de cotización + toast |

## Vistas

| Vista | Tipo | Filtros y agrupaciones | Smart buttons / enlaces |
|---|---|---|---|
| Botón Tareas (cabecera) | contador | número = mis pendientes; rojo si alguna está vencida; tooltip con sin asignar y vencidas | abre el panel |
| Panel Tareas | lista en panel lateral | secciones Mías · Sin asignar · Del equipo (comercial); urgentes primero, luego por fecha | número de cotización cuando se convirtió |

## Flujos

| # | Tarea | Rol | Pasos (≤ 5) | Confirmación / notificación | Resultado y dónde se actualiza |
|---|---|---|---|---|---|
| 1 | Crear tarea | todos | 1. Tareas 2. escribir y Enter (opcional: cliente, responsable, fecha) | toast "Tarea creada" | aparece en el panel; el contador cambia en todas las sesiones |
| 2 | Tomar una tarea sin asignar | todos | 1. ⋯ 2. Tomar | toast | pasa a Mías |
| 3 | Completar | todos | 1. marcar la casilla | toast | queda tachada 24 h y sale del contador |
| 4 | Convertir en cotización | comercial | 1. ⋯ 2. Convertir 3. completar categoría y monto (título, cliente y nota vienen de la tarea) 4. Guardar | toast | cotización en borrador; la tarea queda completada y enlazada |
| 5 | Descartar | todos | 1. ⋯ 2. Descartar 3. Confirmar | diálogo + toast | sale de la lista |

## Reglas (API)

| Regla | Archivo | Error que devuelve |
|---|---|---|
| Estados y prioridades válidos | `apps/api/src/modules/tasks/domain/tasks.rules.ts`, DTO | 400 "Estado de tarea no válido" |
| Vencida = día de vencimiento anterior a hoy en Bolivia | `isOverdue` + `common/domain/calendar.ts` | — |
| Contador: mías, sin asignar, vencidas | `pendingSummary` · `GET /tasks/resumen` | — |
| Se convierte una sola vez y solo si está pendiente | `convertError` · `POST /quotations` con `tareaId` | 400 "Esta tarea ya tiene una cotización" |
| Editar: creador, responsable o comercial | `TasksService.update` | 403 |

## Eventos en tiempo real

| Acción | `entity` | `affects` | Qué se refresca en otras sesiones |
|---|---|---|---|
| crear, editar, completar, descartar, tomar | `task` | — | contador y panel |
| convertir | `task` | `quotation` | contador, panel y listas de cotizaciones |

## Pruebas

- Unit: `modules/tasks/domain/tasks.rules.spec.ts`, `common/domain/calendar.spec.ts`.
- e2e: `apps/api/test/app.e2e-spec.ts` › "minimal tasks and conversion to a quotation (TSK-01)".
- Smoke: S8 (contador en otra sesión).

## Pendientes

- [ ] Quitar del modelo los campos del pool anterior (`tipo`, `horario`, `prioridadMotivo`, `asignadoPor*`, `archivosUrl`) en CLEAN-01.
- [ ] Las tareas con fecha que hoy muestra el cronograma pasan a la vista "Hoy y esta semana" del dashboard (DASH-01).
