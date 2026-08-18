# Flujo operativo — Ventas

Grupo: **VENTAS / ADMINISTRACIÓN**  
Rol en el sistema: origen comercial de trabajos para técnicos, finanzas y operaciones.

---

## Misión del área

1. Prospección y relación con clientes
2. Relevamientos presenciales
3. Cotización y negociación
4. Planificación del cronograma (asignación de fechas y recursos)
5. Seguimiento hasta cierre comercial

---

## Rutas principales

| Ruta | Función |
|------|---------|
| `/dashboard` | KPIs personales y de equipo (metas, conversión) |
| `/clientes` | CRM — alta y seguimiento |
| `/surveys` | Relevamientos y asistencias |
| `/quotations` | Cotizaciones comerciales y biblioteca |
| `/schedule` | Cronograma de instalaciones/proyectos |
| `/marketing` | Campañas y ROI |
| `/activity-wall` | Comunicación interna |

---

## Flujo diario recomendado

```
1. Revisar dashboard → metas, cotizaciones pendientes, visitas del día
2. Registrar relevamientos (/surveys) tras visitas a clientes
3. Emitir/actualizar cotizaciones (/quotations)
4. Convertir aceptadas a trabajos (/quotations → convertToSchedule)
5. Programar en cronograma (/schedule) — fecha, técnico, sucursal
6. Dar seguimiento en muro de actividad
```

---

## Relevamiento (visita presencial)

**Definición:** visita del vendedor al cliente para relevar necesidades técnicas antes de cotizar.

### Pasos

1. **Crear** visita en `/surveys` → botón nueva visita
2. Tipo: **Relevamiento**
3. Completar: cliente, dirección, maps, necesidad del cliente
4. Marcar **Requiere cotización** si aplica
5. Estados: `pendiente` → `programado` → … → `resuelto`
6. Opcional: agregar al cronograma desde modal de schedule

### Datos mínimos

- Cliente vinculado (`cliente_id`)
- Fecha y hora programada
- Vendedor/técnico asignado
- Descripción de necesidad (`necesidad_cliente`)
- Flag `requiere_cotizacion`

### Cruce de datos

Relevamiento resuelto + `requiere_cotizacion` → nueva cotización comercial. Ver [data-crossing.md](../data-crossing.md).

---

## Cotizaciones

Ver detalle canónico: [clientes-y-cotizaciones.md](./clientes-y-cotizaciones.md).

- Registro comercial = **enviada** (ya hablada con el cliente).
- Código `COT-MMDDYY` + título resumido.
- Sin ítems: monto + adjuntos PDF/imagen.
- Creador = vendedor con comisión 100% (ajustable si hay más).

### De aceptada a venta

`aceptada` → se abre una **venta** con el monto de la cotización y se delegan **trabajos** dentro de esa venta. Los pagos se controlan contra el total de la venta. El cronograma de campo queda para un servicio posterior.

---

## Cronograma — reglas para ventas

| Permitido | No es foco de ventas |
|-----------|---------------------|
| Crear trabajo | Ejecutar en campo (técnico) |
| Asignar técnico y fecha | Registrar evidencia fotográfica |
| Reprogramar | Pedidos internos de materiales (puede solicitar) |
| Cambiar estados (supervisión) | Contabilidad detallada |

**Regla:** ventas **mueve el cronograma**; técnicos **ejecutan** lo planificado.

---

## Métricas de rendimiento (dashboard ventas)

| KPI | Cómo se calcula |
|-----|-----------------|
| Cotizaciones creadas | Count por `vendedor_id` en periodo |
| Cotizaciones enviadas | `estado = enviada` |
| Ventas cerradas | Schedules terminados atribuidos al vendedor |
| Tasa de conversión | (aceptadas + convertidas) / enviadas |
| Relevamientos | Visitas tipo relevamiento resueltas |
| Cumplimiento meta | Monto logrado / `monthly_goal` |

Detalle en [dashboards-by-role.md](../dashboards-by-role.md).

---

## Interacción con otros grupos

| Grupo | Handoff |
|-------|---------|
| **Técnicos** | Trabajo programado con técnico asignado |
| **Finanzas** | Montos, adelantos, saldos en schedule |
| **Admin** | Supervisión de metas globales y aprobaciones |

---

## Código de referencia

- `apps/web/src/pages/ScheduleSurveysPage.jsx`
- `apps/web/src/components/VisitaFormModal.jsx`
- `apps/web/src/services/quotations/index.js`
- `apps/web/src/pages/ScheduleWorkPage.jsx`
- `apps/web/src/hooks/useVendedorList.js`
