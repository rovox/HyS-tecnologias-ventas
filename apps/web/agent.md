# Frontend agent notes (`apps/web`)

The SPA is the current product. Keep it. Improve working flows; do not rewrite the stack.

## Stack

- Vite 7, React 18, JSX, React Router 7
- Tailwind 3 + Radix/shadcn under `src/components/ui/`
- react-hook-form + zod where forms already use them
- Visual tokens: repo-root `DESIGN.md`

## Data

- `src/services/*` is the contract (future NestJS HTTP).
- POC uses in-memory mocks (`VITE_API_MODE=mock`). Do not switch to `api` until the Nest service exists.
- One domain, one owner: quotations → `quotationsService` + `NewQuotationForm`; clients → `clientsService` + `ClientFormModal`.

## How to change UI

- Prefer existing `components/ui` (Dialog, Select, Button, Input). Do not add another component library.
- Avoid long files. Split by domain when a screen grows; do not invent shared “utils for later”.
- UI strings and code comments: Spanish. New documentation: English.

## Deploy

Hostinger serves committed `dist/`. It cannot run `vite build` (esbuild `noexec`). CI on GitHub Actions compiles; Hostinger only `verify:dist`. After a UI change, rebuild and commit `apps/web/dist` until auto-publish exists.
