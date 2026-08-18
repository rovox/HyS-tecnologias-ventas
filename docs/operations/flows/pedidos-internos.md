# Flujo — Pedidos internos

Módulo: `/pedidos-internos`  
Solicitan: **Técnicos**, ventas · Aprueban: **Admin**, ventas

---

## Propósito

Gestionar solicitudes de materiales entre sucursales o para un trabajo específico del cronograma.

---

## Tipos de pedido

| Tipo | `cronograma_id` | Uso |
|------|-----------------|-----|
| Para trabajo | **Requerido** | Materiales para instalación en curso |
| Para sucursal | Opcional | Reposición de stock |

Validación en `PedidoInternoFormModal`: tipo "Para trabajo" exige trabajo vinculado.

---

## Flujo de estados

```
solicitado → aprobado → en_preparación → entregado
         ↘ rechazado / cancelado
```

Ver [state-machines.md](../state-machines.md).

| Estado | Quién actúa |
|--------|-------------|
| `solicitado` | Técnico/ventas crea |
| `aprobado` | Admin/ventas |
| `en_preparación` | Logística |
| `entregado` | Cierre — puede registrar costo |
| `rechazado` | Admin |

---

## Flujo operativo técnico

```
1. Detalle de job en /schedule
2. Detecta falta de material
3. /pedidos-internos → Nuevo
4. Tipo: Para trabajo → seleccionar cronograma
5. Ítems, prioridad (urgente/alta/normal)
6. fecha_entrega_estimada
7. Submit → solicitado
8. Seguimiento hasta entregado
```

---

## Cruce de datos

| Campo | Relación |
|-------|----------|
| `cronograma_id` | → `schedules.id` |
| `responsable_id` | Usuario solicitante |
| `sucursal_destino_id` | Sucursal que recibe |
| `detalles_pedidos_internos` | Líneas del pedido |
| `costo_total` | Impacto en panel admin / costos |

Dashboard muestra últimos 5 pedidos con link a detalle.

---

## Prioridades

| Valor | UI |
|-------|-----|
| `urgente` | Rojo |
| `alta` | Naranja |
| `normal` | Default |

---

## Panel administrador

- Pedidos pendientes de aprobación
- Costo agregado de pedidos entregados en el mes (ManagementPanel)

---

## Código de referencia

- `apps/web/src/pages/PedidosInternosPage.jsx`
- `apps/web/src/pages/PedidoInternoDetailPage.jsx`
- `apps/web/src/components/PedidoInternoFormModal.jsx`
- `apps/web/src/services/orders/index.js`
