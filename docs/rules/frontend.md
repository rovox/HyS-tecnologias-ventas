# Frontend rules (React)

## Folder layout (target)

```
src/
  app/            App.jsx, router, providers (QueryClient, Auth), Layout
  features/<x>/
    api.js        query keys + useXList/useX/useXMutation (TanStack Query)
    components/   feature-only components
    pages/        route components (thin: compose + layout)
    index.js      public entry for other features
  components/ui/  shadcn primitives only (no business logic)
  lib/            api client, format (dates, Bs), utils
  constants/      roles, status (labels + colors)
```

Migrate one feature at a time. New code goes in `features/` from day one.

## Data fetching

- One HTTP client: `src/lib/api-client.js` (merge of `api/client.js` + `api/http.js`). It injects the token, parses errors, and on 401 logs out.
- Pages/components never import the client. They call hooks from `features/<x>/api.js`.
- Query keys: `['schedule', 'list', filters]`, `['schedule', 'detail', id]`. Defined once per feature.
- Mutations: `onSuccess` → `invalidateQueries({ queryKey: ['<entity>'] })`. No manual `reload()` functions, no `refreshKey` counters.
- Show loading with `Skeleton`, errors with `toast.error(err.message)`. Never swallow errors.
- No `camelCase ↔ snake_case` mapping. Use API field names as-is.

## Realtime

One listener, one rule:

```js
// app/realtime.js — mounted once in Layout
onRealtime((e) => queryClient.invalidateQueries({ queryKey: [e.entity] }));
```

- Pages do **not** add their own `hs-realtime` listeners.
- After a local mutation the UI updates from the mutation response/invalidation, not from the SSE echo.
- On reconnect, invalidate everything active (`queryClient.invalidateQueries()`).

## Components

- Max ~250 lines. Split into: page (data) → `useXForm` (form state/validation) → presentational parts.
- Modals receive ids, not whole objects copied into state; they read through query hooks.
- Lists: virtualize only if >200 rows on screen.
- Routes are lazy (`React.lazy`) — keep it. Heavy widgets (charts, calendars) are lazy inside the route too.
- Page title: a 5-line `useDocumentTitle(title)` hook (replaces `react-helmet`).

## Roles and status

- Role checks only via `constants/roles.js` helpers (`can(user, 'schedule:edit')`). Hidden UI is not security; the API enforces.
- Status labels/colors only from `constants/status.js` through one `<StatusBadge>`.

## Formatting

- Dates and money only via `lib/format.js` (`formatDate`, `formatBs`). Currency is **Bs**, never `$`.
