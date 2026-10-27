# Library rules

One library per job. If a need is covered below, use that library; do not add another.
Measured on `migration/backend-api` @ 899fac5 (live = reachable from `main.jsx`).

## Web — approved

| Job | Library | Rule |
|---|---|---|
| UI primitives | shadcn/ui on Radix | Add components with the shadcn CLI only when a screen needs them. Never edit them for business logic. |
| Styling | Tailwind 3 + theme tokens | See `theme.md`. No CSS modules, no styled-components. |
| Routing | react-router-dom 7 | Lazy routes. |
| Server state | **@tanstack/react-query 5** (to add) | Only way to fetch/mutate. ~13 kB gz; replaces ad-hoc hooks and reload counters. |
| Forms | react-hook-form + zod + @hookform/resolvers | Already installed, unused today. Use for every new/rewritten form. |
| Dates | date-fns 4 | Import functions individually; `es` locale. Not in `shared/lib/format.js` (Intl there, so no locale lands in the entry bundle). |
| Icons | lucide-react | Named imports only. |
| Toasts | sonner | Only toast system. Loaded after the first paint (`app/AppToaster.jsx`); `notify` waits for it (GATE-01). |
| Charts | recharts | Only in report/dashboard routes, lazy-loaded. It is the largest chunk (~384 kB). |
| Class merge | clsx + tailwind-merge (`cn()`) | |

## Web — remove or replace

| Package | Live usage | Action |
|---|---|---|
| ~~react-helmet~~ | removed 2026-10-27 (GATE-01) | `useDocumentTitle` everywhere |
| framer-motion | 0 live files | Remove; use Tailwind transitions |
| use-toast / `ui/toast` (Radix toast) | 0 live | Remove; sonner only |
| embla-carousel-react, vaul, input-otp, react-resizable-panels, cmdk*, next-themes*, react-day-picker* | 0–1 live | Remove with their unused `ui/*` files (*keep if the component that uses it is live) |
| Radix packages for unused ui files (accordion, avatar, collapsible, context-menu, hover-card, menubar, navigation-menu, radio-group, scroll-area, separator, slider, toggle, toggle-group, tooltip, aspect-ratio) | 0 live | Remove package + `ui/*.jsx`; re-add via CLI if needed |
| esbuild, tailwindcss-animate in `dependencies` | — | Move to devDependencies or remove if unused |

Live shadcn components today: alert-dialog, badge, button, card, checkbox, command, dialog, dropdown-menu, input, label, popover, progress, select, sheet, skeleton, sonner, switch, tabs, textarea.

## API — approved

NestJS core/config/jwt/swagger, Prisma + `@prisma/adapter-mariadb`, class-validator/transformer, bcryptjs, rxjs. Testing: jest, supertest.

| Job | Library | Rule |
|---|---|---|
| Excel export | **exceljs 4.4** (FIN-06, 2026-10-27) | Only in the API (`finance/ledger-export.ts`): real `.xlsx` with numeric amounts, filters and a summary sheet. Never in the web bundle. ~1 MB unpacked, pure JS (runs on Hostinger). |

## Adding a dependency

Allowed only if: (1) no approved library covers it, (2) gzip size is stated, (3) it is maintained (release in last 12 months), (4) the plan says why. Prefer 20 lines of own code over a dependency for small helpers.
