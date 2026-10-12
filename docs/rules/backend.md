# Backend rules (NestJS)

## Module layout

```
src/<feature>/
  <feature>.module.ts
  <feature>.controller.ts     HTTP only: routes, DTOs, @Roles, @CurrentUser
  <feature>.service.ts        business rules, transactions, emits events
  dto/<feature>.dto.ts        class-validator DTOs; Update = PartialType(Create)
  <feature>.service.spec.ts   unit tests for rules
src/common/
  policy/          role constants, can*() predicates, *Where() row scopes
  state-machine.ts transitions per entity, as data
  audit/           AuditService.record(user, action, entity, id, patch)
  storage/         upload paths and file URLs
  pagination.ts    PageQueryDto { take, skip } + helper
```

## Rules

- Controllers never touch Prisma. Small modules still get a service (sucursales, activity, health-db).
- Every body and query has a DTO. Global `ValidationPipe` uses `whitelist: true` **and `forbidNonWhitelisted: true`** so unknown fields fail with 400 instead of being dropped silently.
- Coarse access: `@Roles()` on the controller. Row access: `*Where(user)` from `common/policy`. No inline `role === '...'`.
- Status changes go through `assertTransition(entity, from, to)`.
- Money math (balance, paid, totals) is computed in the service inside a `prisma.$transaction`, and the endpoint returns the updated aggregate.
- Every create/update/delete calls `AuditService.record(...)`, which writes `Activity` and emits the realtime event. Do not call `realtime.emit` directly.
- Lists are paginated and ordered; default `take=50`, max `200`.
- Errors: throw Nest exceptions with a Spanish user-facing message; never return `{ ok: false }` with 200.
- Response shape: camelCase, the same names as Prisma. The web adapts nothing.

## Realtime contract

Event payload (SSE, `GET /api/realtime/events`):

```json
{ "type": "payment.created", "entity": "schedule", "id": "<scheduleId>", "at": "...", "byUserId": "..." }
```

- `entity` is the **aggregate the UI lists** (`schedule`, `quotation`, `client`, `survey`, `task`, `order`), so the web can invalidate by entity.
- The bus is in-memory: valid for one process. If the API ever runs >1 instance, revisit.
- The stream filters events by the user's row scope (same `*Where` policy).

## Tests

- Unit-test policy, state machine, and every money calculation.
- E2E-test each endpoint used by the web at least once (happy path + forbidden role).
