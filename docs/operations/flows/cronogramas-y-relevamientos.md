# Flujo — Cronograma y relevamientos

Módulos: `/schedule`, `/surveys`  
Planificación: **Ventas / Admin** · Ejecución: **Técnicos**

---

## Conceptos

| Término | Significado |
|---------|-------------|
| **Cronograma** | Calendario operativo de trabajos, instalaciones y visitas |
| **Trabajo** | Instalación o proyecto (`tipo_entrada: trabajo`) |
| **Relevamiento** | Visita presencial para evaluar necesidades (`tipo_entrada: relevamiento`) |
| **Asistencia** | Soporte técnico puntual (`tipo_entrada: asistencia`) |

---

## Rutas

| Ruta | Vista |
|------|-------|
| `/schedule` | Instalaciones / proyectos — calendario principal |
| `/surveys` | Bandeja de relevamientos y asistencias |

Submenú Sidebar: **Cronogramas** → ambas rutas.

---

## Quién mueve qué

| Acción | Ventas | Admin | Técnicos |
|--------|:------:|:-----:|:--------:|
| Crear trabajo en cronograma | ✓ | ✓ | — |
| Programar fecha/hora | ✓ | ✓ | — |
| Asignar vendedor | ✓ | ✓ | — |
| Asignar técnico | ✓ | ✓ | — |
| Cambiar estado ejecución | ✓ | ✓ | ✓ |
| Subir fotos / observaciones | ✓ | ✓ | ✓ |
| Reprogramar | ✓ | ✓ | — |

---

## Estados del trabajo (cronograma)

```
programado → en_proceso → terminado
         ↘ cancelado
```

Implementación: [state-machines.md](../state-machines.md).

---

## Flujo relevamiento

### 1. Registro (ventas en campo)

```
/surveys → Nueva visita → Tipo: Relevamiento
```

Campos clave (`VisitaFormModal`):

- Cliente, lugar, maps
- `necesidad_cliente`
- `requiere_cotizacion`
- Prioridad, sucursal

### 2. Bandeja operativa

Tabs en `/surveys`:

- Activos
- Requiere volver
- Resueltos
- Cancelados

Estados visita: `pendiente` → `programado` → `en_camino` → `en_atencion` → `resuelto`.

### 3. Agregar al cronograma

Desde `ScheduleFormModal`:

- Seleccionar visita existente
- `tipo_entrada`: asistencia | relevamiento
- Hereda sucursal del origen
- Aparece en calendario junto a trabajos

### 4. Post-relevamiento

Si `requiere_cotizacion`:

→ Crear cotización en `/quotations`  
→ Flujo comercial hasta conversión a trabajo

---

## Flujo instalación/proyecto

```
Cotización aceptada → convertToSchedule
        ↓
/schedule — trabajo programado
        ↓
Técnico: en_proceso → evidencia → terminado
        ↓
Finanzas: cobros
```

Alternativa sin cotización previa: ventas crea schedule directamente (legacy).

---

## Vistas de calendario

| Componente | Uso |
|------------|-----|
| `ScheduleView` | Vista filtrable por tipo |
| `ScheduleMonthlyView` | Mes completo |
| Dashboard semanal | 7 columnas resumen |

Filtros por `tipo_trabajo`, `tipo_entrada`, sucursal, técnico.

---

## Dashboard — cronograma semanal

Widget en `/dashboard`:

- Próximos 7 días
- Conteo trabajos por día
- Preview clientes (truncate)
- Link a `/schedule`

---

## Datos vinculados

| Campo schedule | Origen |
|----------------|--------|
| `cliente_id` | Cliente |
| `quotation_id` | Cotización convertida |
| `vendedor_responsable_id` | Ventas |
| `tecnico_responsable_id` | Técnico |
| `fecha_programada` | Planificación |
| `monto`, `adelanto`, `saldo` | Comercial/finanzas |

---

## Código de referencia

- `apps/web/src/pages/ScheduleWorkPage.jsx`
- `apps/web/src/pages/ScheduleSurveysPage.jsx`
- `apps/web/src/components/ScheduleFormModal.jsx`
- `apps/web/src/components/ScheduleView.jsx`
- `apps/web/src/services/schedules/index.js`
