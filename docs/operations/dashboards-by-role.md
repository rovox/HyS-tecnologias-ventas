# Dashboards por rol

Cada grupo operativo debe ver en su **panel principal** (`/dashboard`) la información que refleja **su trabajo registrado** y métricas para mejorar rendimiento. El dashboard actual es ejecutivo transversal; esta guía define el **objetivo por rol** y qué datos alimentan cada widget.

---

## Ventas — dashboard operativo comercial

### Objetivo

Reflejar cómo el vendedor **consigue y convierte trabajo** para el resto del personal, con KPIs accionables.

### KPIs requeridos

| Métrica | Definición | Fuente de datos |
|---------|------------|-----------------|
| **Cotizaciones del periodo** | Total creadas + desglose por estado | `quotations` (`kind: commercial`) |
| **Ventas cerradas** | Trabajos terminados con monto atribuido al vendedor | `schedules` donde `estado ∈ {terminado, completado}` y `vendedor_responsable_id` |
| **Tasa de conversión** | `aceptadas o convertidas / enviadas` por vendedor | `quotations` agrupado por `vendedor_id` |
| **Relevamientos realizados** | Visitas tipo relevamiento en el mes | `visitas_tecnicas` / `schedules` con `tipo_entrada = relevamiento` |
| **Pipeline activo** | Cotizaciones enviadas pendientes de respuesta | `quotations.estado = enviada` |
| **Cumplimiento de meta** | Monto logrado vs `salesperson_goals.monthly_goal` | `schedules` + `salesperson_goals` |

### Fórmula de conversión por vendedor

```
tasa_conversion = (cotizaciones_aceptadas + cotizaciones_convertidas) / cotizaciones_enviadas × 100
```

Si `enviadas = 0`, mostrar "Sin envíos en el periodo".

### Vista filtrada (comportamiento esperado)

Cuando el usuario es **VENTAS / ADMINISTRACIÓN**, el dashboard debería priorizar:

- Sus propias cotizaciones y relevamientos (filtro por `vendedor_id` / usuario actual)
- Ranking de equipo (opcional, anonimizado o completo según política)
- Accesos rápidos: `/surveys`, `/quotations`, `/clientes`, `/schedule`

### Estado POC actual

El dashboard muestra KPIs globales (metas comerciales, avance operativo, ranking vendedores). **Mejora pendiente:** filtro automático por vendedor logueado y widgets dedicados a cotizaciones/relevamientos/conversión.

---

## Técnicos — dashboard operativo de campo

### Objetivo

Visualizar **cronograma planificado** y carga de trabajo asignada.

### KPIs requeridos

| Métrica | Definición | Fuente |
|---------|------------|--------|
| **Trabajos hoy / semana** | Entradas donde `tecnico_responsable_id = yo` | `schedules` |
| **En proceso vs programados** | Conteo por estado | `schedules.estado` |
| **Relevamientos/asistencias pendientes** | Visitas activas asignadas | `visitas_tecnicas` |
| **Pedidos internos abiertos** | Pedidos solicitados por el técnico | `pedidos_internos` |

### Regla

El técnico **no mueve la planificación** del cronograma (fechas globales, asignación comercial); sí avanza **estados de ejecución** y registra evidencia.

### Accesos rápidos

- `/schedule` — calendario de instalaciones
- `/surveys` — bandeja de visitas
- `/pedidos-internos` — materiales

---

## Finanzas — dashboard de control económico

### Objetivo

Consolidar ingresos, cobros pendientes y costos del periodo.

### KPIs requeridos

| Métrica | Fuente |
|---------|--------|
| Ventas facturadas / cobradas | `schedules.monto`, `schedule_payments` |
| CxC (saldo pendiente) | `schedules.saldo` |
| Gastos operativos del mes | `gastos_operativos` |
| Costos de trabajo | `costos_trabajo` |
| Utilidad estimada | ventas − costos − gastos |

Referencia de agregación: `apps/web/src/services/reports/index.js` → `getDashboard()`.

### Accesos rápidos

- `/finanzas`, `/reports`, `/accounting`

---

## Administrador — dashboard de supervisión global

### Objetivo

Visualizar **toda la actividad registrada** de cada grupo operativo en un solo lugar.

### KPIs requeridos

| Bloque | Contenido |
|--------|-----------|
| **Ventas** | Ranking vendedores, conversión global, cotizaciones por estado |
| **Operaciones** | Avance programación (% trabajos terminados), cronograma semanal |
| **Técnicos** | Trabajos por técnico, pedidos internos pendientes |
| **Finanzas** | Ingresos vs egresos, meta global |
| **Transversal** | Muro de actividad reciente, campañas activas, flota |

### Panel extendido

`/admin/management` — resumen ejecutivo, gráficos, auditoría (`historial_actividad`).

### Estado POC actual

Dashboard principal ya incluye: metas comerciales, avance operativo, ranking vendedores, sucursales, pedidos internos, cronograma semanal, muro de actividad. Panel admin añade ingresos/egresos y logs.

---

## Resumen visual por rol

```
┌─────────────────────────────────────────────────────────────┐
│ VENTAS                                                       │
│  Cotizaciones │ Conversión │ Relevamientos │ Meta personal  │
├─────────────────────────────────────────────────────────────┤
│ TÉCNICOS                                                     │
│  Mi cronograma │ Visitas hoy │ Pedidos │ Estado ejecución   │
├─────────────────────────────────────────────────────────────┤
│ FINANZAS                                                     │
│  Cobrado │ CxC │ Gastos │ Utilidad │ Reportes              │
├─────────────────────────────────────────────────────────────┤
│ ADMINISTRADOR                                                │
│  Todo lo anterior + ranking equipos + auditoría + config    │
└─────────────────────────────────────────────────────────────┘
```

---

## Roadmap de implementación UI

1. **Fase A (actual):** dashboard ejecutivo único con datos reales del mock
2. **Fase B:** `useAuth` + filtros por `currentUser.id` en widgets de ventas
3. **Fase C:** layouts alternativos por rol (componentes `DashboardVentas`, `DashboardTecnico`, etc.)
4. **Fase D:** backend NestJS con endpoints `/reports/dashboard?role=`
