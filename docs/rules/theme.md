# Theme rules

## Source

`DESIGN.md` is the only source of colours, states and screen patterns. The code implements it in:

| File | Holds |
|---|---|
| `apps/web/src/index.css` | CSS variables (HSL): shadcn core (`--primary`, `--muted`, `--border`…) and the narrative tones |
| `apps/web/tailwind.config.js` | the classes for those variables |
| `apps/web/src/shared/lib/status.js` | every state: label, tone, icon (`STATUS`, `TONE`, `statusOf`) |
| `apps/web/src/shared/views/StatusBadge.jsx` | `<StatusBadge entity state>`, `<ToneTag tone>` |

## Narrative tones

`danger` · `warning` · `success` · `info` · `progress` · `neutral`, each with `DEFAULT` (solid), `foreground`
(text on solid), `soft` (background), `fg` (text on soft or white), `border`. Meaning and examples: `DESIGN.md` §2.

| Need | Classes |
|---|---|
| State | `<StatusBadge entity="movement" state={m.estado} />` (never a local colour map) |
| Tag that is not a state | `<ToneTag tone="danger" icon={AlertTriangle}>Sin técnico</ToneTag>` |
| Money in / out / owed | `text-success-fg` (+) · `text-danger-fg` (−, saldo) · `text-muted-foreground` (0) |
| Card painted by state | `bg-<tone>-soft border-<tone>-border border-l-4 border-l-<tone>` |
| Striped / hovered row | `bg-row-stripe` · `bg-row-hover` |

`primary` (navy) is structure: navigation, titles, the main button. `secondary` (brand green) is identity, not
"success": use `success` for confirmed/validated. `destructive` stays for shadcn buttons and equals `danger`.

## Rules

- Token classes only. **No raw palette classes** (`bg-blue-600`, `text-emerald-600`) and no hex (`bg-[#002b5b]`).
  Legacy pages still have them; they are migrated when their feature is rewritten.
- No new CSS files. `index.css` holds tokens, the base layer and a few global utilities.
- One font (Inter). Sizes: `text-xs` labels, `text-sm` body, `text-base` section, `text-2xl` page title; numbers
  `tabular-nums`.
- Touch targets ≥ 44 px (`min-h-11`) on phones.
- A new colour pair is measured for WCAG AA before use (`fg` on `soft` ≥ 4.5:1).
- No dark mode.

## Checking

```bash
rg -o "(bg|text|border)-(red|blue|green|orange|emerald|slate|gray|amber|yellow|indigo|purple|sky|rose|zinc|neutral)-[0-9]{2,3}" apps/web/src -g '*.jsx' | wc -l
```

The count must only go down (347 on 2026-10-25). `features/*` and `shared/*` must stay at 0.
