# Cotizaciones

> Propuesta técnico-económica al cliente; al aprobarse crea el Proyecto · Rutas: `/quotations` (Cotizaciones · Cerradas), `/quotations/:id` · Estado: 🟢 flujo completo (QUO-02, 2026-10-23); ítems, descuento y plantillas pendientes

## Roles

| Rol | Ve | Hace |
|---|---|---|
| Administrador | todas | crear, editar, enviar, aprobar, rechazar, reabrir, eliminar, restaurar |
| Ventas | todas | lo mismo que Administrador |
| Técnico | — (redirige al dashboard, API 403) | — |

## Estados

`borrador → enviado → aprobado | rechazado | vencido` · `eliminada` es una marca aparte (oculta, restaurable).

| Transición | Quién | Condición | Confirmación |
|---|---|---|---|
| borrador → enviado | comercial | PDF adjunto; guarda la fecha de envío | "¿Enviar …?" (vence en 15 días) |
| enviado / vencido → aprobado | comercial | tiene cliente; crea el proyecto una sola vez | "Aprobar y crear proyecto" |
| enviado → rechazado | comercial | motivo obligatorio | motivo en el diálogo |
| enviado / rechazado / vencido → borrador | comercial | — (reabrir) | "¿Reabrir …?" |
| enviado → vencido | sistema | 15 días después del envío (al arrancar, cada hora y antes de cada lista) | — |
| cualquiera salvo aprobado → eliminada | comercial | motivo obligatorio | motivo en el diálogo |
| eliminada → (su estado) | comercial | — | "¿Restaurar …?" |

Aprobado es final: se deshace cancelando el proyecto. En una aprobada el monto, el cliente y la categoría quedan fijos.

## Vistas

| Vista | Tipo | Filtros y agrupaciones | Smart buttons / enlaces |
|---|---|---|---|
| Cotizaciones (`?vista=abiertas`) | lista + kanban (Borrador · Enviada) | estado, categoría, mis cotizaciones, vencen en ≤ 3 días · agrupar por estado, categoría, vendedor, cliente · total en Bs al pie · exportar CSV | clic → ficha · **acciones rápidas por fila** (QUO-03): Enviar, Aprobar → Proyecto (verde), Rechazar con motivos rápidos (rojo), Duplicar (formulario prellenado), Tarea (ligada a la cotización) |
| Cerradas (`?vista=cerradas`) | lista | aprobada, rechazada, vencida, eliminada, categoría, mis cotizaciones | clic → ficha |
| Ficha (`/quotations/:id`) | formulario Odoo | barra de estado con las transiciones de la API | Cliente, Relevamientos, Tareas, Proyecto · historial (chatter) |

Búsqueda, filtros y agrupación viven en la URL (`q`, `f`, `g`): se comparten y sobreviven a recargas.

## Flujos

| # | Tarea | Rol | Pasos (≤ 5) | Confirmación / notificación | Resultado y dónde se actualiza |
|---|---|---|---|---|---|
| 1 | Crear cotización | comercial | 1. Nueva 2. título, cliente (o "+" nuevo cliente), categoría, monto 3. PDF opcional 4. Guardar borrador o Guardar y enviar | toast "Borrador guardado" / "creada y enviada" | abre la ficha; aparece en Cotizaciones de todas las sesiones |
| 2 | Enviar | comercial | 1. Adjuntar PDF 2. Enviar 3. Confirmar | diálogo + toast | estado Enviada, "vence en N d" en la lista |
| 3 | Aprobar | comercial | 1. Aprobar 2. Confirmar | diálogo + toast "proyecto creado" | pasa a Cerradas; proyecto en el cronograma; smart button Proyecto |
| 4 | Rechazar | comercial | 1. Rechazar 2. escribir motivo 3. Confirmar | diálogo con motivo + toast | Cerradas › Rechazada; motivo visible en la ficha |
| 5 | Reabrir | comercial | 1. Reabrir 2. Confirmar | diálogo + toast | vuelve a borrador en Cotizaciones |
| 6 | Eliminar / restaurar | comercial | 1. Eliminar 2. motivo 3. Confirmar (luego Restaurar) | diálogo + toast | Cerradas › Eliminada con quién/cuándo/motivo; solo lectura hasta restaurar |
| 7 | Editar | comercial | 1. Editar 2. cambiar 3. Guardar | toast | campos y historial actualizados |

## Reglas (API)

| Regla | Archivo | Error que devuelve |
|---|---|---|
| Flujo de estados, PDF para enviar, motivo para rechazar | `apps/api/src/modules/quotations/domain/quotations.rules.ts` (`checkQuotationTransition`) | 400 "Transición inválida…", "Adjunta el PDF…", "Indica el motivo del rechazo" |
| Aprobar: enviada o vencida, con cliente; idempotente | `acceptError` | 400 "Solo se aprueba una cotización enviada", "Asigna un cliente…" |
| Vence a los 15 días | `isExpired`, `expiryCutoff` · `QuotationFlowService.expireOverdue` | — |
| Eliminar con motivo, nunca una aprobada; restaurar | `deleteError`, `restoreError` | 400 "…cancela su proyecto", "Indica el motivo…" |
| Editable salvo eliminada; en aprobada no cambian monto, cliente, categoría | `editError` | 400 "Restaura la cotización…", "…son los del proyecto" |
| Categoría = una de las 3 divisiones; monto > 0 | `modules/categories` `assertDivision`, DTO | 400 |

Cada respuesta trae `transicionesValidas`, `venceEl`, `puedeEliminar`, `proyectoId`: la UI no decide nada de esto.

## Eventos en tiempo real

| Acción | `entity` | `affects` | Qué se refresca en otras sesiones |
|---|---|---|---|
| crear, editar, archivo, estado, eliminar, restaurar, vencer | `quotation` | — | listas, kanban, ficha, historial |
| aprobar | `quotation` | `schedule`, `client` | además cronograma y clientes |

## Pruebas

- Unit: `modules/quotations/domain/quotations.rules.spec.ts` (10 casos).
- e2e: `apps/api/test/app.e2e-spec.ts` › "quotation states, expiry, delete and restore (QUO-02)", "mandatory division (CAT-01)", "quotation → project → payments".
- Smoke: S2, S3, S7, S8 (`docs/rules/testing.md`).

## Pendientes

- [ ] COT-01 Ítems del catálogo (`QuotationItem`) con totales en la API (necesita Inventario).
- [ ] COT-02 Descuento (solo en la cotización), PDF con marca H&S generado por el sistema.
- [ ] COT-05 Plantillas por tipo de trabajo; revisión de Contabilidad.
- [ ] Vistas Proyectos e Informes (PRO-01).
