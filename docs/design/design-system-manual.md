# Sistema de diseño — manual exhaustivo

Manual de implementación para **web desktop** y **mobile responsive**. Los tokens oficiales están en [`DESIGN.md`](../../DESIGN.md); este documento los traduce a reglas concretas para el ERP H&S Tecnologías.

## 1. Principios de marca

| Principio | Aplicación |
|-----------|------------|
| **Sobrio y minimalista** | Sin decoración superflua; cada elemento tiene función operativa |
| **Claridad** | Whitespace generoso entre clusters de datos |
| **Autoridad** | Navy profundo en navegación; verde vibrante solo en CTAs y éxito |
| **Precisión** | Alineación tabular en números; jerarquía tipográfica clara |

**Respuesta emocional buscada:** control ordenado — el usuario siente que datos complejos son transparentes y navegables.

---

## 2. Paleta de color

### 2.1 Tokens semánticos (DESIGN.md)

| Token | Hex (referencia) | Uso |
|-------|------------------|-----|
| `primary` | `#001736` / container `#002b5b` | Sidebar, headers críticos, botones primarios |
| `secondary` | `#2e6c00` / container `#75fd00` | CTAs de acción, éxito, tendencias positivas |
| `surface` | `#f8f9ff` | Fondo general de aplicación |
| `on-surface` | `#0b1c30` | Texto principal |
| `outline` / `outline-variant` | `#747780` / `#c4c6d0` | Bordes, divisores |
| `error` | `#ba1a1a` | Errores, cancelaciones |

### 2.2 Implementación CSS (`apps/web/src/index.css`)

El proyecto expone tokens como variables HSL consumidas por Tailwind:

```css
--primary: 220 100% 40%;
--success: 142 71% 45%;
--metric-card-bg, --table-row-hover, --state-* …
```

**Regla:** nuevos componentes deben usar `bg-primary`, `text-muted-foreground`, `border-border`, etc. Evitar hex sueltos salvo excepciones documentadas (p. ej. gradiente sidebar `#001F4D → #002B66`).

### 2.3 Uso del verde de acción

- Reservado para: **Guardar**, **Confirmar**, **Agregar**, estados completados, iconos activos en mobile
- **No** usar como fondo de secciones grandes — pierde impacto
- Texto sobre verde brillante: navy (`#002B5B`) para contraste

### 2.4 Estados operativos (chips)

| Estado | Estilo |
|--------|--------|
| Completado / terminado | Fondo emerald suave + texto emerald oscuro |
| En proceso / aprobado | Fondo blue suave |
| Pendiente / preparación | Fondo amber suave |
| Cancelado / rechazado | Fondo rose suave |

Patrón: **fondo baja saturación + texto alta saturación** (ver DESIGN.md — Chips & Status Tags).

---

## 3. Tipografía

### 3.1 Familia

| Contexto | Fuente |
|----------|--------|
| **Token oficial (DESIGN.md)** | Inter |
| **Implementación actual** | Plus Jakarta Sans (carga en `index.css`) |

**Migración recomendada:** alinear a Inter según DESIGN.md en una iteración futura. Mientras tanto, respetar escalas y pesos del manual.

### 3.2 Escala tipográfica

| Token DESIGN | Desktop | Mobile | Peso | Uso |
|--------------|---------|--------|------|-----|
| `display-lg` | 32px / 40px lh | ~26px (−20%) | 700 | Títulos de página hero |
| `headline-md` | 24px / 32px | 20px (`headline-md-mobile`) | 600 | Secciones, cards |
| `headline-sm` | 20px / 28px | 18px | 600 | Subsecciones |
| `body-lg` | 16px / 24px | 16px | 400 | Párrafos, formularios |
| `body-md` | 14px / 20px | 14px | 400 | Tablas, listas |
| `label-md` | 12px / 16px, tracking 0.05em | igual | 600 | Labels, badges uppercase |
| `data-tabular` | 14px / 20px | igual | 500 | **Números en tablas y KPIs** |

### 3.3 Reglas de datos

- KPIs y montos: `font-black` o `font-bold` + `tabular-nums`
- Labels vs valores: contraste Bold 700 vs Regular 400
- Títulos de página: `text-4xl md:text-5xl font-extrabold tracking-tight` (Dashboard)

---

## 4. Layout y espaciado

### 4.1 Modelo Fixed-Fluid

| Elemento | Medida |
|----------|--------|
| Sidebar desktop | 260px fijo (`lg:pl-72` ≈ 288px con padding) |
| Contenedor máximo contenido | 1440px (`container-max` en DESIGN) |
| Grid dashboard | 12 columnas en desktop |
| Gutter | 24px |
| Margen mobile | 16px |
| Margen desktop | 32px |

### 4.2 Escala de espaciado (8px base)

`4 → 8 → 16 → 24 → 40` px (`unit-xs` … `unit-xl`)

Clase utilitaria del proyecto: `.content-container` con `--content-padding: clamp(1rem, 3vw, 2rem)`.

### 4.3 Breakpoints (Tailwind)

| Prefijo | Ancho | Comportamiento |
|---------|-------|----------------|
| default | < 640px | 1 columna, sidebar oculto |
| `sm` | ≥ 640px | KPIs 2 columnas |
| `md` | ≥ 768px | Hook `useIsMobile` — umbral mobile |
| `lg` | ≥ 1024px | Sidebar fijo visible |
| `xl` / `2xl` | ≥ 1280 / 1400px | Grids amplios |

---

## 5. Elevación y profundidad

Preferir **capas tonales** sobre sombras pesadas:

| Nivel | Tratamiento |
|-------|-------------|
| 0 — Base | `bg-muted/30` (fondo app) |
| 1 — Cards | Blanco + borde `1px` `#E2E8F0` / `border-border` |
| 2 — Flotante | Sombra ambiental: `0 4px 20px rgba(0, 43, 91, 0.08)` |
| Hover interactivo | `.metric-card`: `-translate-y-1` + sombra ligera |

---

## 6. Formas (border-radius)

| Token | Valor | Componente |
|-------|-------|------------|
| `sm` | 0.25rem | Chips pequeños |
| `DEFAULT` | 0.5rem | Botones, inputs |
| `md` | 0.75rem | `--radius` en CSS |
| `lg` | 1rem | Widgets dashboard |
| `xl` | 1.5rem | Modales, metric-cards (`rounded-2xl`) |
| Sidebar activo | semi-pill izquierdo | Indicador de ruta activa |

---

## 7. Componentes

### 7.1 Botones

| Variante | Estilo |
|----------|--------|
| Primary | `bg-primary`, texto blanco |
| Action/Success | Verde `#76FF03`, texto navy |
| Secondary | Transparente + borde `outline-variant` |
| Ghost | Para acciones secundarias en headers de card |

### 7.2 Inputs

- Fondo blanco, borde 1px
- Focus: borde primary + glow 2px al 10% opacidad
- Labels con `label-md` (uppercase tracking en filtros)

### 7.3 Tablas de datos

| Regla | Valor |
|-------|-------|
| Altura de fila | 56px |
| Stripes alternados | **No** — solo borde inferior sutil |
| Hover fila | `bg-[hsl(var(--table-row-hover))]` |
| Overflow mobile | `.table-container` con scroll horizontal |
| Encabezado | `table-header-bg`, peso bold |

### 7.4 Metric cards (KPI)

Clase `.metric-card`:

- Icono en contenedor `rounded-xl` con tinte primary/secondary al 10%
- Número grande `text-3xl font-black tabular-nums`
- Label uppercase `text-sm font-bold tracking-wider text-muted-foreground`
- Barra de progreso `.progress-bar-container` / `.progress-bar-fill`

### 7.5 Navegación

**Desktop:** sidebar gradient navy, secciones PRINCIPAL / OPERACIONES / GESTIÓN / ADMINISTRACIÓN.

**Mobile (< lg):**

- Sidebar off-canvas con overlay `bg-black/60 backdrop-blur`
- Header con botón menú
- Recomendación DESIGN: bottom tab bar para Finance / Quotes / Reports en futuras iteraciones mobile-first

### 7.6 Modales y drawers

- `rounded-2xl`, `max-h-[90vh] overflow-y-auto`
- En mobile: preferir `Drawer` (vaul) para formularios largos cuando el teclado reduce viewport

---

## 8. Patrones de página ERP

### 8.1 Anatomía estándar

```
Layout
├── Sidebar (roles filtrados)
├── Header (menú mobile + usuario)
├── Banner POC (solo milestone actual)
└── main
    └── .content-container
        ├── Título + descripción
        ├── Fila KPIs (grid responsive)
        ├── Filtros / tabs
        └── Tabla o cards
```

### 8.2 Densidad de información

- Dashboard ejecutivo: 4 KPIs + 3 columnas + cronograma semanal + actividad
- Listados operativos: tabla full-width con filtros sticky en mobile
- Detalle de entidad: tabs + timeline + acciones contextuales

---

## 9. Accesibilidad y UX

- Contraste mínimo WCAG AA en texto principal sobre surface
- Iconos acompañados de label en navegación (no solo icono)
- `title` en celdas truncadas
- Toasts (`sonner`) para feedback de acciones
- Estados de carga: `Skeleton` en KPIs y tablas

---

## 10. Checklist para nuevas pantallas

- [ ] Usa `.content-container` y tokens CSS existentes
- [ ] KPIs con `tabular-nums` y `.metric-card` si aplica
- [ ] Tabla con scroll horizontal en mobile
- [ ] Chips de estado con paleta semántica
- [ ] Sidebar / permisos por rol en `ProtectedRoute` + `Sidebar.allowedRoles`
- [ ] CTA principal máximo uno por vista
- [ ] Ver [responsive-web-mobile.md](./responsive-web-mobile.md) antes de merge

## Referencias en código

| Archivo | Contenido |
|---------|-----------|
| `DESIGN.md` | Tokens fuente |
| `apps/web/src/index.css` | Variables y utilidades |
| `apps/web/tailwind.config.js` | Mapeo Tailwind |
| `apps/web/src/components/ui/*` | shadcn/Radix base |
| `apps/web/src/components/Sidebar.jsx` | Navegación por rol |
| `apps/web/src/pages/DashboardPage.jsx` | Referencia de KPIs |
