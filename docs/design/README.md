# Diseño — índice

| Documento | Contenido |
|---|---|
| [`DESIGN.md`](../../DESIGN.md) | **Fuente única**: paleta narrativa, estados, tipografía, componentes, patrones de vista, checklist |
| [responsive-web-mobile.md](./responsive-web-mobile.md) | Adaptación a teléfono: breakpoints, tarjetas en lugar de tablas, navegación |
| [`docs/rules/theme.md`](../rules/theme.md) | Reglas de código del tema (tokens, prohibiciones, cómo comprobar) |

## Implementación en código

```
apps/web/src/index.css            → variables CSS (tokens de DESIGN.md)
apps/web/tailwind.config.js       → clases (bg-danger-soft, text-success-fg…)
apps/web/src/shared/lib/status.js → estados: etiqueta, tono, icono
apps/web/src/shared/views/        → ControlPanel, ListView, StatusBadge, FormView, StatusBar, useConfirm…
apps/web/src/components/ui/       → primitivos shadcn/Radix
```

Un cambio visual empieza en `DESIGN.md` y se propaga a `index.css` / Tailwind en el mismo commit.
