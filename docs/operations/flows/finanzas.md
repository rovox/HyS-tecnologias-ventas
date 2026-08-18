# Flujo operativo — Finanzas

Grupo: **Contadora** (+ visibilidad compartida con ventas/admin en reportes)  
Rol en el sistema: control económico, cobranzas, costos y reportes.

---

## Misión del área

1. Registrar y conciliar movimientos de caja
2. Controlar cuentas por cobrar (CxC)
3. Consolidar gastos operativos y costos de trabajo
4. Emitir reportes para dirección
5. Validar márgenes por trabajo/sucursal

---

## Rutas principales

| Ruta | Función |
|------|---------|
| `/dashboard` | Resumen cobrado, CxC, utilidad |
| `/finanzas` | Cajas, movimientos, contabilidad operativa |
| `/accounting` | Costos operativos por trabajo |
| `/reports` | Reportes financieros y metas |
| `/quotations` | Consulta comercial (solo lectura contextual) |
| `/gastos-operativos` | Gastos de operación |

---

## Fuentes de datos

| Concepto | Colección / servicio |
|----------|---------------------|
| Ventas / montos de trabajo | `schedules.monto` |
| Cobros | `schedule_payments` |
| Saldo pendiente | `schedules.saldo` |
| Gastos | `gastos_operativos` |
| Costos por job | `costos_trabajo` |
| Metas | `salesperson_goals`, `configuration` |
| Pedidos entregados (costo) | `pedidos_internos.costo_total` |

Agregación POC: `reportsService.getDashboard()`.

---

## Flujo de cobranza

```
Trabajo terminado (schedules.terminado)
        ↓
Registro de pago parcial o total (schedule_payments)
        ↓
Actualización de saldo
        ↓
Reflejo en /finanzas y /reports
```

---

## Cruce con operaciones

| Evento operativo | Impacto financiero |
|------------------|-------------------|
| Cotización convertida | `monto` esperado en schedule |
| Adelanto registrado | Payment + reduce saldo |
| Pedido interno entregado | Costo asociado al trabajo |
| Gasto operativo | Egreso en periodo |
| Trabajo cancelado | Reversión / ajuste manual |

Ver [data-crossing.md](../data-crossing.md).

---

## Dashboard finanzas (objetivo)

| KPI | Fórmula |
|-----|---------|
| Ventas del mes | Σ `schedules.monto` terminados |
| Cobrado | Σ `schedule_payments.monto_cobrado` |
| CxC | Σ `schedules.saldo` |
| Gastos | Σ `gastos_operativos.monto` |
| Costos | Σ `costos_trabajo.costo_total` |
| Utilidad estimada | ventas − costos − gastos |
| % meta | cobrado / meta global |

---

## Permisos

- **Contadora:** finanzas, reportes, accounting, cotizaciones (consulta)
- **No** planifica cronograma ni convierte cotizaciones (salvo rol ventas dual)
- Puede registrar pagos en trabajos (según reglas PocketBase legacy)

---

## Reportes periódicos

1. **Diario:** movimientos de caja
2. **Semanal:** CxC vencida por cliente
3. **Mensual:** P&L operativo, cumplimiento meta por vendedor (datos de ventas)

---

## Código de referencia

- `apps/web/src/pages/FinanzasPage.jsx`
- `apps/web/src/pages/AccountingPage.jsx`
- `apps/web/src/pages/ReportsPage.jsx`
- `apps/web/src/services/finance/index.js`
- `apps/web/src/services/reports/index.js`
