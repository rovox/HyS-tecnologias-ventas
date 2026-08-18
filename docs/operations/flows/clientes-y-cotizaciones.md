# Flujo — Clientes y cotizaciones

Módulos: `/clientes`, `/quotations`  
Responsable: **Ventas / Admin**. Consulta: técnicos y finanzas.

Formulario comercial: `apps/web/src/components/NewQuotationForm.jsx` (no duplicar en la página).

---

## Clientes

Alta mínima: nombre y **categoría** (las mismas tres que en cotizaciones: Seguridad Electrónica, Equipos y tecnología, Proyectos). El formulario es `ClientFormModal`.

No eliminar cliente con cotizaciones o ventas abiertas (regla de producción).

---

## Cotización comercial (fase actual)

Toda cotización nueva **ya fue hablada o enviada** al cliente → estado inicial `enviada`. No hay borrador en este flujo.

### Código y título

- Código automático: `COT-MMDDYY` (mes, día, año 2 dígitos). Si hay más de una el mismo día: `COT-MMDDYY-2`.
- Título: texto resumido que registra el vendedor. Display: `COT-081726 — CCTV 16 canales`.

### Campos

| Campo | Regla |
|-------|--------|
| Cliente | Obligatorio. Buscar o crear. |
| Categoría | Seguridad Electrónica / Equipos y tecnología / Proyectos |
| Subcategoría | SE: Instalaciones, Asistencias. Proyectos: Redes/Datos, Eléctrico. Equipos y tecnología: texto libre opcional |
| Sucursal | Central, Quillacollo, Punata |
| Monto | Directo en Bs. Sin ítems: el detalle está en adjuntos |
| Vendedor(es) | El creador entra con **100%** de comisión. Más vendedores = ajustar % |
| Observaciones | Opcional |
| Adjuntos | Al menos un PDF y/o imagen |

### Estados

```
enviada → aceptada → convertida (venta / trabajos)
              ↘ rechazada
```

`aceptada` habilita **Crear venta / trabajo**. El cronograma de campo se gestiona aparte (no bloquear esta fase).

---

## De cotización a venta

```
Cotización enviada
    ↓ (cliente acepta)
Cotización aceptada
    ↓
Venta (monto = cotización)
    ↓
Trabajos delegados dentro de la venta
    ↓
Pagos acumulan contra el monto de la venta
```

Lo crítico de esta fase: **registrar cotización + convertir a venta y controlar cobros**. El cronograma (fechas de técnicos) se desacopla y se abordará en otro servicio.

---

## Métricas

| KPI | Cálculo |
|-----|---------|
| Cotizaciones | count por vendedor |
| Enviadas / aceptadas / rechazadas | por `estado` |
| Conversión | (aceptadas + convertidas) / enviadas |

---

## Código

- UI form: `NewQuotationForm.jsx`
- Listado: `QuotationsLibraryPage.jsx` (cards mobile, tabla `lg+`)
- Servicio: `apps/web/src/services/quotations/index.js`
- Constantes: `apps/web/src/mocks/quotations.js`

API fase 1: [migration/api-quotations-sales.md](../../migration/api-quotations-sales.md)
