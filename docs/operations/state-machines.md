# Máquinas de estado

Estados canónicos y transiciones permitidas. Implementación: `apps/web/src/hooks/StateFlowValidator.js`.

---

## Trabajos / Cronograma (`schedules`)

```
programado ──▶ en_proceso ──▶ terminado
     │              │              │
     └──────────────┴──────────────┴──▶ cancelado (desde cualquier estado)
```

| Estado | Significado |
|--------|-------------|
| `programado` | Planificado por ventas/admin; técnico asignado |
| `en_proceso` | Ejecución en campo |
| `terminado` | Trabajo completado con evidencia |
| `cancelado` | Anulado (motivo registrado) |

**Legacy:** algunas pantallas usan `completado` como sinónimo de terminado en métricas.

**Permisos de cambio:** ADMINISTRADOR, VENTAS / ADMINISTRACIÓN, SEGURIDAD ELECTRÓNICA.

---

## Pedidos internos (`pedidos_internos`)

```
solicitado ──▶ aprobado ──▶ en_preparación ──▶ entregado
     │              │              │
     └──────────────┴──────────────┴──▶ rechazado | cancelado
```

| Estado | Responsable típico |
|--------|-------------------|
| `solicitado` | Técnico / ventas crea |
| `aprobado` | Admin / ventas |
| `en_preparación` | Logística / almacén |
| `entregado` | Cierre con costo opcional |
| `rechazado` / `cancelado` | Admin |

---

## Cotizaciones comerciales (`quotations`, `kind: commercial`)

```
enviada ──▶ aceptada ──▶ convertida (venta)
    │           │
    └───────────┴──▶ rechazada
```

`borrador` queda solo por compatibilidad de datos viejos; el alta nueva entra en `enviada`.

| Estado | Acción |
|--------|--------|
| `enviada` | Ya hablada/enviada al cliente |
| `aceptada` | Habilita crear venta y trabajos |
| `convertida` | Venta generada; pagos contra el monto |
| `rechazada` | Cliente declinó |

**Biblioteca** (`kind: library`): estado fijo `documento`.

---

## Visitas / Relevamientos (`visitas_tecnicas`)

Estados operativos en bandeja `/surveys`:

```
pendiente → programado → en_camino → en_atencion → resuelto
                                              └──▶ cancelado
```

| Estado | Significado |
|--------|-------------|
| `pendiente` | Registrada, sin fecha |
| `programado` | Fecha/hora asignada |
| `en_camino` | Técnico/vendedor en ruta |
| `en_atencion` | En sitio del cliente |
| `resuelto` | Visita completada |
| `cancelado` | No se realizará |

Flag especial: `requiere_volver` → tab "Requiere volver" en UI.

---

## Validación en código

```javascript
import { isValidTransition, canUserChangeState } from '@/hooks/StateFlowValidator';

// flowType: 'schedules' | 'pedidos' | 'pedidos_internos'
isValidTransition('schedules', 'programado', 'en_proceso'); // { valid: true }
canUserChangeState(userRole); // boolean
```

---

## Entrada al cronograma desde visita

Al agregar asistencia/relevamiento al cronograma (`ScheduleFormModal`):

- `tipo_entrada`: `asistencia` | `relevamiento` | `trabajo`
- Hereda sucursal y cliente de la visita origen
- Aparece en calendario junto a instalaciones/proyectos
