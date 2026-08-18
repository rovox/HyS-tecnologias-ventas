---
name: H&S tecnologias
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#43474f'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#747780'
  outline-variant: '#c4c6d0'
  surface-tint: '#405f91'
  primary: '#001736'
  on-primary: '#ffffff'
  primary-container: '#002b5b'
  on-primary-container: '#7594ca'
  inverse-primary: '#a9c7ff'
  secondary: '#2e6c00'
  on-secondary: '#ffffff'
  secondary-container: '#75fd00'
  on-secondary-container: '#307000'
  tertiary: '#001736'
  on-tertiary: '#ffffff'
  tertiary-container: '#002b5b'
  on-tertiary-container: '#6b94d7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#a9c7ff'
  on-primary-fixed: '#001b3d'
  on-primary-fixed-variant: '#264778'
  secondary-fixed: '#80ff2c'
  secondary-fixed-dim: '#67e100'
  on-secondary-fixed: '#092100'
  on-secondary-fixed-variant: '#215100'
  tertiary-fixed: '#d6e3ff'
  tertiary-fixed-dim: '#a9c7ff'
  on-tertiary-fixed: '#001b3d'
  on-tertiary-fixed-variant: '#144685'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-tabular:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  headline-md-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  sidebar-width: 260px
  unit-xs: 4px
  unit-sm: 8px
  unit-md: 16px
  unit-lg: 24px
  unit-xl: 40px
---

## Brand & Style

The design system is engineered for efficiency, clarity, and professional reliability. It targets Small to Medium Enterprises (SMEs) that require a robust operational tool without the visual clutter typical of legacy ERP software. 

The aesthetic is **Sobrio & Minimalista**. It leverages a high-contrast foundation to ensure data density is manageable and legible. The style combines **Corporate Modern** structures with **Minimalist** refinement, prioritizing functional hierarchy over decorative elements. The emotional response is one of "ordered control"—users should feel that the complex financial and operational data is transparent and easy to navigate.

- **Precision:** Every pixel serves a functional purpose.
- **Clarity:** Use of whitespace to separate data clusters.
- **Authority:** Deep navy tones provide a stable, institutional feel, while vibrant green highlights key actions and success states.

## Colors

The color palette is derived directly from the corporate identity, optimized for a professional software interface.

- **Primary (Deep Navy):** Used for primary navigation, sidebars, and critical headers to establish a "grounded" frame.
- **Accent (Vibrant Green):** Reserved for "Success" states, primary CTA buttons (like "Registrar Factura"), and highlighting positive trends. It must be used sparingly to maintain its impact.
- **Neutrals:** A range of Slate grays (`#F8FAFC` to `#1E293B`) manage the hierarchy of secondary text and UI borders.
- **Backgrounds:** A "Clean White" approach is used for the main content area to maximize contrast, with "Subtle Gray" used for the sidebar and container backgrounds to create depth without relying on heavy shadows.

## Typography

This design system utilizes **Inter** for its exceptional legibility in data-heavy environments and its neutral, modern character.

- **Data Tables:** Use `data-tabular` settings (Tabular Figures) to ensure columns of numbers align perfectly for easy scanning.
- **Hierarchy:** Strong weight contrasts (Bold 700 vs Regular 400) are used to distinguish labels from user-generated content.
- **Mobile scaling:** Display sizes drop by approximately 20% on mobile to maintain screen real estate while preserving the "bold" editorial feel of headers.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. The sidebar remains fixed at `260px`, while the main content area is a fluid grid that caps at `1440px` to prevent line-lengths from becoming unreadable.

- **Grid:** A 12-column grid is used for desktop dashboards.
- **Rhythm:** A strict 8px linear scale (4, 8, 16, 24, 40) governs all padding and margins.
- **Mobile:** On small screens, the sidebar collapses into a bottom navigation bar or a hamburger menu. Margins reduce to `16px` to maximize space for data tables, which may use horizontal scrolling for high-density information.

## Elevation & Depth

To maintain a "minimalist" and "sobrio" feel, elevation is achieved through **Tonal Layering** rather than heavy shadows.

- **Level 0 (Base):** `#F8FAFC` (Subtle Gray) for the main application background.
- **Level 1 (Cards/Content):** White surfaces with a `1px` stroke in `#E2E8F0`. 
- **Level 2 (Active/Floating):** Used for dropdowns and modals. These utilize an **Ambient Shadow**: `0px 4px 20px rgba(0, 43, 91, 0.08)`. The shadow color is tinted with the Primary Navy to keep the interface feeling cohesive and high-end.
- **Interactive States:** Buttons and interactive cards use a subtle "lift" effect (0.5rem shadow) on hover to provide tactile feedback.

## Shapes

The shape language is **Rounded (Medium)**. This softens the "industrial" feel of an ERP, making the software feel more approachable and modern.

- **Standard Components:** `0.5rem (8px)` corner radius for buttons, inputs, and small cards.
- **Large Containers:** `1rem (16px)` corner radius for main dashboard widgets and modal overlays.
- **Navigation:** Active states in the sidebar use a semi-pill shape (left-side rounded) to indicate selection clearly.

## Components

### Buttons
- **Primary:** Background `#002B5B`, Text `#FFFFFF`. High-contrast, authoritative.
- **Action/Success:** Background `#76FF03`, Text `#002B5B`. Used for "Add", "Save", or "Confirm".
- **Secondary:** Transparent background with `#E2E8F0` border.

### Input Fields
- White background with a `1px` border. On focus, the border shifts to Primary Navy with a subtle `2px` glow of the same color at 10% opacity.

### Data Tables
- Row height: `56px` for comfort. 
- Alternating row stripes are not used; instead, a subtle bottom-border (`1px solid #F1F5F9`) separates entries. 
- Hover state: Row background shifts to `#F8FAFC`.

### Navigation (Mobile)
- A **Bottom Tab Bar** is recommended for SME owners who need "at-a-glance" access to Finance, Quotes, and Reports while on the move.
- Active icons use the Vibrant Green accent for high visibility.

### Chips & Status Tags
- Status tags (e.g., "Pagado", "Pendiente") use low-saturation versions of the status color with high-saturation text to ensure they don't distract from primary data but remain clearly categorizable.

## Documentación extendida

Este archivo es la **fuente de verdad de tokens**. Para implementación web/mobile, patrones ERP y checklist de pantallas, ver:

- [`docs/design/design-system-manual.md`](docs/design/design-system-manual.md)
- [`docs/design/responsive-web-mobile.md`](docs/design/responsive-web-mobile.md)