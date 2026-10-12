# Performance and memory rules

The app must stay light on old laptops and phones used in the field.

## Baseline (committed `apps/web/dist`, raw, not gzipped)

| Chunk | Size | Notes |
|---|---|---|
| `BarChart` (recharts) | 384 kB | loaded by Dashboard/Reports |
| `Layout` | 260 kB | shell: sidebar, icons, radix |
| `index` (entry) | 259 kB | |
| `index.css` | 123 kB | |
| `QuotationsLibraryPage` | 78 kB | largest page |

## Budgets (enforced in CI once `PERF-03` is done)

| Item | Budget (raw) |
|---|---|
| Entry JS (`index` + `Layout`) | ≤ 300 kB |
| Any route chunk | ≤ 100 kB |
| CSS | ≤ 60 kB |
| Charts | only inside lazy chart components, never in Layout/entry |

## Rules

- Lazy-load every route (already done) and every heavy widget (charts, calendar, PDF viewer).
- Import icons and date-fns functions by name; never `import * as`.
- No full-list fetches for screens that show a page: use paginated endpoints.
- TanStack Query defaults: `staleTime: 30s`, `gcTime: 5min`, `refetchOnWindowFocus: false` (realtime handles freshness).
- One SSE connection per tab (in Layout). No polling intervals.
- Clean up every `addEventListener`, `setInterval`, `EventSource` in effect cleanups.
- Images from uploads: show thumbnails (`loading="lazy"`, fixed width/height); never load full photos in lists.
- No animation libraries; CSS transitions only. Respect `prefers-reduced-motion`.
- Avoid inline object/array props in big lists; memoize row components only when profiling shows a problem.

## How to measure

```bash
pnpm --filter web build          # prints chunk sizes
npx vite-bundle-visualizer -c apps/web/vite.config.js   # optional, one-off
```

Chrome DevTools → Performance monitor: JS heap should stay stable after navigating 10 screens and back (no steady growth = no leak).
