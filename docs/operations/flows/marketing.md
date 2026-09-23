# Flujo — Marketing

Módulo: `/marketing`  
Responsable: **Ventas** + supervisión **Admin**

---

## Propósito

Planificar campañas, registrar presupuesto y medir ROI en relación con leads y cotizaciones generadas.

---

## Rutas

| Ruta | Función |
|------|---------|
| `/marketing` | CRUD campañas, métricas |
| `/dashboard` | Widget "Campañas activas" |
| Reportes marketing | Sub-rutas según implementación |

---

## Flujo de campaña

```
1. Crear campaña (presupuesto, canal, fechas)
2. status: active durante ejecución
3. Al cierre: registrar leads y cotizaciones generadas
4. Sistema calcula conversión y ROI
5. Resultados visibles en dashboard marketing
```

Referencia histórica: `apps/web/src/FLUJOS_COMPLETOS.md` — Flujo 2.

---

## Métricas

| KPI | Descripción |
|-----|-------------|
| Presupuesto | `budget` de campaña |
| Leads | Contactos generados |
| Cotizaciones | Vinculadas a campaña (extensión) |
| Conversión | leads → cotizaciones → ventas |
| ROI | (ingreso atribuido − costo) / costo |
| CPA | costo por adquisición |

---

## Cruce con ventas

```
Campaña activa
    ↓
Lead → Cliente (/clientes)
    ↓
Relevamiento (/surveys)
    ↓
Cotización (/quotations)
    ↓
Venta (schedule terminado)
```

Atribución completa requiere campo `campaign_id` en cliente/cotización (roadmap).

---

## Dashboard

- Contador campañas activas (global)
- Admin/ventas: detalle ROI en módulo marketing

---

## Permisos

| Rol | Acceso |
|-----|--------|
| Ventas | ✓ |
| Admin | ✓ |
| Técnicos | ✓ (vista) |
| Finanzas | — (salvo reportes financieros de marketing) |

---

## Código de referencia

- `apps/web/src/pages/MarketingPage.jsx`
- `apps/web/src/pages/MarketingReportsPage.jsx`
- Colección mock: `campaigns_new`
