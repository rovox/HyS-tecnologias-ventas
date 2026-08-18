# Flujo operativo — Administrador

Grupo: **ADMINISTRADOR**  
Rol en el sistema: supervisión transversal, configuración, auditoría.

---

## Misión del área

1. Visualizar actividad de **todos** los grupos operativos
2. Configurar parámetros globales (metas, sucursales, usuarios)
3. Aprobar pedidos internos y excepciones
4. Auditar cambios críticos
5. Exportar datos para análisis externo

---

## Rutas exclusivas o prioritarias

| Ruta | Función |
|------|---------|
| `/dashboard` | Vista global — todos los KPIs |
| `/admin/management` | Panel de control + auditoría |
| `/configuration` | Configuración del sistema |
| Todas las demás | Acceso completo |

---

## Dashboard administrador

Debe consolidar actividad de:

| Grupo | Indicadores |
|-------|-------------|
| **Ventas** | Ranking vendedores, cotizaciones por estado, conversión |
| **Técnicos** | % avance operativo, trabajos por estado, pedidos pendientes |
| **Finanzas** | Ingresos, egresos, utilidad, meta global |
| **Transversal** | Cronograma semanal, muro actividad, campañas, flota |

### Widgets actuales (POC)

- Metas comerciales globales + tendencia mes anterior
- Avance operativo (% trabajos terminados)
- Campañas activas
- Vehículos operativos
- Rendimiento por sucursal
- Cumplimiento por vendedor
- Pedidos internos recientes
- Cronograma semanal
- Muro de actividad

---

## Panel de control (`/admin/management`)

### Pestañas

1. **Resumen ejecutivo** — ingresos, egresos, utilidad, meta mensual
2. **Análisis** — gráficos por sucursal/vendedor
3. **Auditoría** — `historial_actividad` filtrable por acción
4. **Datos maestros** — export CSV

### Datos cruzados en resumen

```
Ingresos  = Σ schedules terminados (mes)
Egresos   = mantenimiento + combustible + aceite + pedidos entregados
Utilidad  = ingresos − egresos
```

---

## Supervisión por grupo operativo

### Ventas

- Revisar ranking y metas en dashboard
- Intervenir en cotizaciones estancadas (`enviada` > N días)
- Reasignar clientes entre vendedores (configuración)

### Técnicos

- Detectar cuellos de botella (muchos `programado`, pocos `terminado`)
- Ver pedidos internos urgentes sin aprobar

### Finanzas

- Validar CxC elevada por sucursal
- Comparar costos reales vs presupuesto de campaña

---

## Configuración (`/configuration`)

- Metas mensuales globales
- Sucursales activas
- Parámetros de negocio
- Solo ADMINISTRADOR (redirect si otro rol)

---

## Aprobaciones

| Entidad | Acción admin |
|---------|--------------|
| Pedidos internos | aprobar / rechazar |
| Gastos excepcionales | validación |
| Cancelación de trabajos | supervisión |

---

## Auditoría

Registro en `historial_actividad`:

- Cambios de estado
- Creación/edición de entidades críticas
- Filtros por tipo de acción en panel admin

---

## Interacción con cronograma

Admin tiene **mismos permisos que ventas** para planificar:

- Crear/reprogramar trabajos
- Asignar vendedor y técnico
- Cambiar estados

Ver [operational-groups.md](../operational-groups.md).

---

## Código de referencia

- `apps/web/src/pages/ManagementPanelPage.jsx`
- `apps/web/src/pages/ConfigurationPage.jsx`
- `apps/web/src/pages/DashboardPage.jsx`
- `apps/web/src/hooks/StateChangeLogger.js`
