# <Módulo>

> <Propósito en una línea> · Ruta(s): `/ruta` · Estado: 🔴 / 🟡 / 🟢 (ver `docs/STATUS.md`)

Copia este archivo para cada módulo. Cada sección es corta y estructurada: tablas y listas, sin prosa larga.
Vocabulario de `docs/domain/business-design.md`.

## Roles

| Rol | Ve | Hace |
|---|---|---|
| Administrador | | |
| Ventas | | |
| Técnico | | |

## Estados

`estado_a → estado_b → estado_c | estado_d`

| Transición | Quién | Condición | Confirmación |
|---|---|---|---|
| a → b | | | |

## Vistas

| Vista | Tipo (lista / kanban / ficha / panel) | Filtros y agrupaciones | Smart buttons / enlaces |
|---|---|---|---|

## Flujos

| # | Tarea | Rol | Pasos (≤ 5) | Confirmación / notificación | Resultado y dónde se actualiza |
|---|---|---|---|---|---|
| 1 | | | 1. … 2. … | | |

## Reglas (API)

| Regla | Archivo | Error que devuelve |
|---|---|---|
| | `apps/api/src/modules/<x>/domain/<x>.rules.ts` | 400 "…" |

## Eventos en tiempo real

| Acción | `entity` | `affects` | Qué se refresca en otras sesiones |
|---|---|---|---|

## Pruebas

- Unit: `modules/<x>/domain/<x>.rules.spec.ts`
- e2e: `apps/api/test/app.e2e-spec.ts` › "<describe>"
- Smoke: S<n> (`docs/rules/testing.md`)

## Pendientes

- [ ] …
