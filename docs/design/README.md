# Diseño — índice

Documentación visual y de UX del ERP H&S Tecnologías.

## Fuente de verdad

**[`DESIGN.md`](../../DESIGN.md)** — tokens oficiales (colores, tipografía, spacing, componentes base). No duplicar valores hex en otros archivos; referenciar DESIGN.md.

## Manuales

| Documento | Contenido |
|-----------|-----------|
| [design-system-manual.md](./design-system-manual.md) | Manual exhaustivo: color, tipo, layout, componentes, patrones ERP |
| [responsive-web-mobile.md](./responsive-web-mobile.md) | Reglas web + mobile, breakpoints, tablas, navegación |

## Implementación en código

```
apps/web/src/index.css      → variables CSS (--primary, --metric-card-*)
apps/web/tailwind.config.js → theme extend
apps/web/components/ui/     → primitivos Radix/shadcn
apps/web/components/        → Sidebar, Layout, modales de dominio
```

## Stack UI

- React 18 + Vite 7
- Tailwind CSS 3
- Radix UI + shadcn patterns
- Lucide icons
- Recharts (reportes)

## Contribuir cambios visuales

1. Actualizar token en `DESIGN.md` si cambia la marca
2. Propagar a `index.css` / Tailwind
3. Documentar excepción en design-system-manual si aplica
4. Verificar responsive según checklist en responsive-web-mobile.md
