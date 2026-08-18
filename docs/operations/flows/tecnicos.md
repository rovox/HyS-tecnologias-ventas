# Flujo operativo — Técnicos

Grupo: **SEGURIDAD ELECTRÓNICA**  
Rol en el sistema: ejecución en campo, visitas técnicas, solicitud de materiales.

---

## Misión del área

1. Ejecutar trabajos planificados en cronograma
2. Atender relevamientos y asistencias asignadas
3. Registrar evidencia (fotos, observaciones)
4. Solicitar materiales vía pedidos internos
5. Avanzar estados operativos del trabajo

---

## Rutas principales

| Ruta | Función |
|------|---------|
| `/dashboard` | Carga de trabajo hoy/semana |
| `/schedule` | Calendario de instalaciones — **vista principal** |
| `/surveys` | Bandeja de visitas/relevamientos/asistencias |
| `/pedidos-internos` | Solicitud de materiales |
| `/clientes` | Consulta de datos de sitio |
| `/gastos-operativos` | Gastos de campo (si aplica) |

---

## Cronograma — qué ve y qué hace el técnico

### Ve

- Trabajos donde `tecnico_responsable_id` = su usuario
- Fecha, cliente, lugar, descripción, estado
- Vista calendario mensual/semanal (`ScheduleWorkPage`, `ScheduleView`)

### Hace

| Acción | Detalle |
|--------|---------|
| Iniciar trabajo | `programado` → `en_proceso` |
| Registrar observaciones | Modal en detalle de job |
| Subir fotografías | Galería en detalle |
| Completar | `en_proceso` → `terminado` |
| Solicitar materiales | Pedido interno vinculado a `cronograma_id` |

### No hace (reservado ventas/admin)

- Crear entradas comerciales nuevas en cronograma sin visita/trabajo previo
- Reasignar vendedor responsable comercial
- Convertir cotizaciones

---

## Flujo de ejecución típico

```
1. Abrir /schedule → filtrar "mis trabajos"
2. Revisar detalle del job (cliente, dirección, maps)
3. Si faltan materiales → /pedidos-internos (tipo "Para trabajo")
4. En sitio: cambiar a en_proceso
5. Registrar observaciones y fotos
6. Finalizar → terminado
7. Si es visita/relevamiento → flujo en /surveys
```

---

## Relevamientos y asistencias

El técnico comparte bandeja `/surveys` con ventas.

| Tipo | Responsable habitual |
|------|---------------------|
| Relevamiento comercial | Ventas |
| Relevamiento técnico | Técnico |
| Asistencia | Técnico |

Estados de visita: ver [state-machines.md](../state-machines.md).

Al resolver:

- Registrar si se cobra la visita (`FinalizeAssistanceModal`)
- Indicar si requiere volver
- Opcional: agregar al cronograma

---

## Pedidos internos

1. Desde detalle de trabajo o listado → nuevo pedido
2. Tipo **Para trabajo** → obligatorio `cronograma_id`
3. Estados: `solicitado` → espera aprobación admin/ventas
4. Seguimiento hasta `entregado`

Ver [pedidos-internos.md](./pedidos-internos.md).

---

## Dashboard técnico (objetivo)

| Widget | Contenido |
|--------|-----------|
| Trabajos hoy | Schedules del día filtrados por técnico |
| Semana | Mini cronograma 7 días |
| Visitas activas | Tab activos en surveys |
| Pedidos abiertos | Últimos pedidos solicitados |

---

## Interacción con ventas

```
Ventas planifica (fecha, cliente, monto)
        ↓
Técnico ejecuta (estado, evidencia)
        ↓
Ventas/Finanzas cierran cobros
```

Si el técnico detecta alcance adicional → observación + muro de actividad → ventas genera nueva cotización.

---

## Código de referencia

- `apps/web/src/pages/ScheduleWorkPage.jsx`
- `apps/web/src/pages/JobDetailPage.jsx`
- `apps/web/src/components/CompleteWorkModal.jsx`
- `apps/web/src/hooks/useSchedules.js`
- `apps/web/src/hooks/useTecnicosList.js`
