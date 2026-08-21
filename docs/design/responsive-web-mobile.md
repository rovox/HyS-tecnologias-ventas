# Diseño responsive — web y mobile

Guía práctica para adaptar pantallas del ERP H&S entre desktop y dispositivos móviles. Complementa [design-system-manual.md](./design-system-manual.md) y [`DESIGN.md`](../../DESIGN.md).

## 1. Filosofía responsive

El ERP es **data-dense** por naturaleza. En mobile no se simplifica la información crítica: se **reorganiza** y se habilita scroll horizontal donde haga falta.

| Prioridad mobile | Comportamiento |
|------------------|----------------|
| Acción inmediata | Botones fijos o sticky footer en formularios |
| Lectura de KPIs | 1→2 columnas, números grandes |
| Tablas | Scroll horizontal + columnas esenciales visibles |
| Navegación | Menú hamburguesa + sidebar off-canvas |
| Cronograma | Vista semanal comprimida → lista por día |

---

## 2. Breakpoints y hooks

### 2.1 Tailwind (implementación)

```jsx
// Grid KPIs
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

// Cronograma semanal
<div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
```

### 2.2 Hook `useIsMobile`

Archivo: `apps/web/src/hooks/use-mobile.jsx`

- Umbral: **768px** (`MOBILE_BREAKPOINT`)
- Usar para cambiar componente (Table vs Card list), no para lógica de negocio

---

## 3. Layout shell

### 3.1 Desktop (≥ lg)

```
┌──────────┬────────────────────────────────────┐
│ Sidebar  │ Header                              │
│ 260px    ├────────────────────────────────────┤
│ fijo     │ main (p-4 md:p-6 lg:p-8)           │
│          │   content-container                 │
└──────────┴────────────────────────────────────┘
```

- `lg:pl-72` en contenedor principal
- Sidebar siempre visible

### 3.2 Mobile (< lg)

```
┌────────────────────────────────────┐
│ Header [≡]                          │
├────────────────────────────────────┤
│ Banner POC                          │
├────────────────────────────────────┤
│ main (padding reducido)             │
│   content-container                 │
│   pb-24 ← espacio para futuro tab bar│
└────────────────────────────────────┘

Sidebar: translate-x-full → translate-x-0 + overlay
```

- Cerrar sidebar al navegar (`handleLinkClick` en Sidebar)
- `pb-24` en dashboards para no tapar contenido con controles inferiores

---

## 4. Tipografía mobile

Regla DESIGN.md: **display −20%** en mobile.

| Elemento desktop | Mobile |
|------------------|--------|
| `text-4xl md:text-5xl` (título dashboard) | `text-4xl` base, escala en `md:` |
| `headline-md` 24px | 20px |
| Labels tabla | Mantener 12–14px legibles |

Evitar más de 2 tamaños de título por pantalla.

---

## 5. Componentes por viewport

### 5.1 KPI cards

```jsx
// 1 col phone → 2 col tablet → 4 col desktop
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
```

- Iconos: `h-6 w-6` consistentes
- No reducir padding interno por debajo de `p-6` en metric-card

### 5.2 Tablas

**Desktop:** tabla completa.

**Mobile:**

1. Envolver en `.table-container` (overflow-x-auto)
2. Opcional: vista card por fila en pantallas < sm (patrón recomendado para pedidos y visitas)
3. Ocultar columnas secundarias con `hidden md:table-cell`

Columnas mínimas mobile en listados operativos:

| Módulo | Columnas visibles |
|--------|-------------------|
| Clientes | Nombre, estado |
| Cotizaciones | Número, cliente, estado |
| Cronograma | Cliente, fecha, estado |
| Relevamientos | Cliente, fecha, técnico |
| Pedidos internos | Número, estado, prioridad |

### 5.3 Formularios

| Patrón | Mobile |
|--------|--------|
| Formulario largo (VisitaFormModal) | Dialog scroll + campos full-width |
| Selects | Radix Select full width |
| Grids 2 columnas | `grid-cols-1 md:grid-cols-2` |
| Acciones | Botón primario full-width `w-full sm:w-auto` |

### 5.4 Modales

```jsx
<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
```

En viewports < 400px: márgenes laterales mínimos, evitar `max-w-4xl`.

### 5.5 Cronograma / calendario

| Vista | Desktop | Mobile |
|-------|---------|--------|
| Semanal (Dashboard) | 7 columnas | 2→4 columnas con scroll |
| Mensual | Grid completo | Lista agrupada por día |
| Detalle trabajo | Panel lateral + galería | Stack vertical, fotos swipe |

---

## 6. Navegación mobile (roadmap)

Estado actual: **sidebar off-canvas**.

Recomendación DESIGN.md para SME owners:

| Tab | Rutas |
|-----|-------|
| Inicio | `/dashboard` |
| Operaciones | `/schedule` o `/surveys` |
| Clientes | `/clientes` |
| Finanzas | `/finanzas` o `/reports` |

Icono activo: verde accent. Implementación futura en `Layout.jsx`.

---

## 7. Touch y gestos

- Área mínima táctil: **44×44px** en botones icon-only
- `hover:` states no sustituyen feedback en touch — usar `:active` o toast
- Mapas (relevamientos): botón explícito "Abrir en Maps", no solo link pequeño

---

## 8. Rendimiento mobile

- Lazy load de rutas pesadas (Finanzas, Accounting) cuando se modularice bundle
- Imágenes de evidencia: thumbnails en lista, full en detalle
- Evitar tablas > 100 filas sin paginación virtual

---

## 9. Pruebas responsive

Checklist manual antes de release:

- [ ] iPhone SE (375px) — login, dashboard, una tabla, un modal
- [ ] iPad (768px) — sidebar toggle, grid KPIs 2 col
- [ ] Desktop 1440px — sin líneas > 80 caracteres en párrafos
- [ ] Rotación landscape en cronograma semanal
- [ ] Teclado virtual no oculta botón submit en modales

Herramientas: DevTools device toolbar, `pnpm dev:web` con `--host` para probar en dispositivo real.

---

## 10. Anti-patrones

| Evitar | Hacer |
|--------|-------|
| Ocultar KPIs críticos en mobile | Reordenar, no eliminar |
| Font-size < 11px | Mínimo 12px en labels |
| Modales 100vh sin scroll | `max-h-[90vh] overflow-y-auto` |
| Sidebar siempre abierto en mobile | Overlay + cierre al navegar |
| Tablas sin scroll | `.table-container` |
