# Theme rules

## Official theme

The app uses the **shadcn/ui theming system** (CSS variables in `src/index.css`, mapped in `tailwind.config.js`). Brand values come from `DESIGN.md` (H&S navy + green). There is one theme; dark mode is optional and only through the same variables.

| shadcn token | DESIGN.md source | Use |
|---|---|---|
| `--background` / `--foreground` | `surface` / `on-surface` | page |
| `--card` | `surface-container-lowest` | cards, modals |
| `--primary` / `--primary-foreground` | `primary-container` / `on-primary` | main actions, active nav |
| `--secondary` | `surface-container` | secondary buttons |
| `--accent` | `secondary` (brand green) | highlights, success emphasis |
| `--muted` / `--muted-foreground` | `surface-container-low` / `on-surface-variant` | subtle text, empty states |
| `--destructive` | `error` | delete, errors |
| `--border`, `--input`, `--ring` | `outline-variant`, `outline`, `surface-tint` | borders, focus |

Status colors (programado, en proceso, terminado, cancelado, pagado, pendiente…) are defined **once** in `src/constants/status.js` as token-based classes and rendered by `<StatusBadge>`.

## Rules

- Use only token classes: `bg-primary`, `text-muted-foreground`, `border-border`…
- **No raw palette classes** (`bg-blue-600`, `text-emerald-600`) and no hex values (`bg-[#002b5b]`). Today there are ~515 raw palette usages; they are migrated per feature.
- No new CSS files. `index.css` contains only tokens, base layer and truly global utilities.
- Spacing and radius from Tailwind scale; radius from `--radius`.
- Typography: one font family, sizes `text-sm` (body), `text-base`, `text-lg`, `text-xl`, `text-2xl` (page title). No `font-black` except KPI numbers.
- Touch targets ≥ 44px (`min-h-11`) on mobile.
- Contrast: text on backgrounds must pass WCAG AA; check new token pairs before using them.

## Checking

```bash
grep -rhoE "(bg|text|border)-(red|blue|green|orange|emerald|slate|gray|amber|yellow|indigo|purple|sky|rose|zinc|neutral)-[0-9]{2,3}" apps/web/src --include=*.jsx | wc -l
```

The count must only go down. A feature is "themed" when it returns 0.
