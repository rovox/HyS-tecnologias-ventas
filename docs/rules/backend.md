# Backend rules (NestJS)

## Module layout (vertical slices)

```
src/modules/<feature>/
  index.ts                    public API: the Nest module (+ services other modules use). Nothing else is importable
  <feature>.module.ts
  <feature>.controller.ts     HTTP only: routes, DTOs, @Roles, @CurrentUser
  <feature>.service.ts        use cases: transactions, calls the rules, AuditService.record
  dto/<feature>.dto.ts        class-validator DTOs; Update = PartialType(Create)
  domain/<feature>.rules.ts   pure business rules (state machine, money, checks) + .spec.ts
src/common/                   shared kernel, global (CommonModule): no module imports here
  prisma/  realtime/  auth/ (guards, decorators)
  audit/   AuditService.record({ user, sessionId, action, entity, id, before, after, affects, patch })
  policy/  policy.ts (pure: roles, can*(), *Where()) + roles.ts (Nest adapter, assert*)
  domain/  pure shared rules (state-machine types, audit diff)
```

Enforced by unit specs: `common/purity.spec.ts` (every `domain/` file: no Nest/Prisma, relative imports only into
another `domain/`) and `common/module-boundaries.spec.ts` (a module imports only `common/` and `../<other>` = its
`index.ts`; `common/` never imports a module). Read models that join several modules live in a read-only module
(`reporting`), never inside a write module.

## Rules

- Controllers never touch Prisma. Small modules still get a service (sucursales, activity, health-db).
- Every body and query has a DTO. Global `ValidationPipe` uses `whitelist: true` **and `forbidNonWhitelisted: true`** so unknown fields fail with 400 instead of being dropped silently.
- Coarse access: `@Roles()` on the controller. Row access: `*Where(user)` from `common/policy`. No inline `role === '...'`.
- Status changes go through `assertTransition(entity, from, to)`.
- Money math (balance, paid, totals) is computed in the service inside a `prisma.$transaction`, and the endpoint returns the updated aggregate.
- Every create/update/delete calls `AuditService.record(...)` **after the transaction commits**: it writes `Activity` (with `detalle` = changed fields, before/after, when `before`/`after` are passed) and emits the realtime event. Do not call `realtime.emit` directly.
- Lists are paginated and ordered; default `take=50`, max `200`.
- Errors: throw Nest exceptions with a Spanish user-facing message; never return `{ ok: false }` with 200.
- Response shape: camelCase, the same names as Prisma. The web adapts nothing.

## Realtime contract

Event payload (SSE, `GET /api/realtime/events`):

```json
{ "type": "schedule.payment", "entity": "payment", "id": "<paymentId>", "affects": ["schedule", "client"], "at": "...", "byUserId": "..." }
```

- `type` = the audit action. `entity` is the **aggregate the UI lists**; `affects` lists the other aggregates whose
  views or totals change, so the web invalidates `[entity, ...affects]`.
- The bus is in-memory: valid for one process. If the API ever runs >1 instance, revisit.
- The stream filters events by the user's row scope (same `*Where` policy).

## Tests

- Unit-test policy, state machine, and every money calculation.
- E2E-test each endpoint used by the web at least once (happy path + forbidden role).
