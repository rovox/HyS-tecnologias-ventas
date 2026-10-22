# Architecture rules

Goal: code anyone can read in one sitting. Prefer **simple and explicit** over clever and generic.

## Shape: modular monolith

- One API process and one SPA. **No microservices**, no message brokers (single Hostinger Node app).
- The monolith is split into **feature modules with hard boundaries**, the same names on both sides:

| Feature | API module (`src/modules/`) | Web folder |
|---|---|---|
| auth | `auth` | `features/auth` |
| clients | `clients` | `features/clients` |
| surveys (relevamientos) | `relevamientos` | `features/surveys` |
| quotations | `quotations`, `categories` | `features/quotations` |
| schedule + payments | `schedules` | `features/schedule` |
| tasks | `tasks` | `features/tasks` |
| internal orders | `pedidos-internos` | `features/orders` |
| reports | `metrics`, `goals` | `features/reports` |

- A feature only imports another feature through its **public entry** (`index.ts` / `index.js`). No deep imports into another feature's internals.
- Shared code goes to `common/` (API) or `lib/`, `components/ui`, `constants/` (web) **only when 2+ features use it**.

## Layers

```
API:  Controller ──► Service ──► PrismaService
       HTTP, DTO,     business      data access
       @Roles         rules, events

Web:  Page ──► feature hooks (api.js) ──► api/client.js
       layout,   TanStack Query           single HTTP client
       compose   queries + mutations
```

- Dependencies point one way (left → right). Lower layers never import upper ones.
- No repository interfaces, no DDD folders, no generic base classes. Add an abstraction only after the **third** real duplicate.

## State ownership (no monolithic state)

| Kind of state | Owner | Never |
|---|---|---|
| Server data (lists, records) | TanStack Query cache | copied into `useState`/Context |
| Session (user, token) | `AuthContext` | anything else in Context |
| UI state (open modal, tab, filter) | local `useState` or URL params | global stores |
| Derived values (totals, labels) | computed during render | stored |
| Business totals (balance, paid) | API response | recomputed in the UI as the source of truth |

There is no global store. Do not add Redux/Zustand.

## Design principles that apply here

- **Single source of truth:** each fact has one owner (DB column, constant, or endpoint). Duplicates are bugs.
- **Single responsibility:** a file does one job. Components >250 lines and services >250 lines must be split.
- **DRY with judgment:** remove copy-paste; do not invent frameworks to avoid two similar lines.
- **YAGNI:** do not build for modules marked ⚪ (not started) or frozen on the board in `docs/STATUS.md`.
- **Fail loudly:** errors surface to the user and the log; no silent fallbacks.
- **Explicit contracts:** API shapes are defined by DTOs and Swagger; the web consumes generated types (target).

## Patterns to use

| Problem | Pattern |
|---|---|
| Allowed status changes | State machine as data in the module's `domain/<x>.rules.ts` |
| Who can see/do what | Policy functions: `common/policy/*` |
| Side effects after a write | One `AuditService.record()` → activity log + realtime event |
| Forms | Page owns data; `useXForm` hook owns form logic; presentational fields |
| Lists | Paginated endpoint + query hook + table component |

## Patterns to avoid

God components, prop drilling past 2 levels, `useEffect` to sync derived state, business logic in modals, snake_case/camelCase double mapping, feature flags for dead code.
