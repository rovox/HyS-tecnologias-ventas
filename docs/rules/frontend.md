# Frontend rules (React)

## Folder layout (feature-driven)

```
src/
  app/            App.jsx (router), providers: queryClient.js, RealtimeProvider.jsx, ConfirmProvider (shared/views)
  features/<x>/
    api.js        query keys + useXList/useX/useXMutation (TanStack Query) — the only file that talks HTTP
    components/   feature-only components
    pages/        route components (thin: compose + layout)
    index.js      public entry for other features
  shared/
    views/        Odoo-style kit: ControlPanel, ListView, KanbanView, FormView/Field, StatusBar, useConfirm
    lib/          format.js (Bs, dates), notify.js (toasts)
  components/ui/  shadcn primitives only (no business logic). Dialog/Sheet scroll by default (max-h 90dvh)
  api/            HTTP client (used by features/*/api.js only)
```

Legacy `pages/`, `components/`, `services/`, `hooks/` move into features one at a time and are deleted when empty.
New code goes in `features/` from day one. ESLint enforces the boundaries (`eslint.config.mjs`): another feature only
through `@/features/<x>` (its index), and `.jsx` files under `features/` and `shared/views/` never import `@/api/*`
or `@/services/*`.

## UI patterns (Odoo style)

| Need | Use |
|---|---|
| Any list screen | `ControlPanel` (breadcrumb, main action, search + filter facets, group by, view switcher, export) + `ListView` / `KanbanView` |
| A record | `FormView`: actions + `StatusBar` (only the transitions the API returns) on top, smart buttons that link to the source of truth, fields, `Chatter` (`@/features/activity`) under it |
| Confirm an action | `const confirm = useConfirm(); const { ok, reason } = await confirm({ title, description, destructive, reason: 'Motivo' })` |
| Feedback | `notify.success(...)` after a mutation; errors are toasted by the query client (`meta: { silentError: true }` to handle them yourself) |

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
// app/RealtimeProvider.jsx — mounted once in App
for (const entity of [e.entity, ...(e.affects || [])]) queryClient.invalidateQueries({ queryKey: [entity] });
```

Query keys therefore start with the API entity name (`['quotation', 'list', filters]`). The provider reconnects with
backoff (1, 2, 5, 10 s), on the browser `online` event and after 40 s of silence, and refetches everything active on
every (re)connection. Legacy pages still use `useRealtimeEntities` (same events) until they move to query hooks.

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
