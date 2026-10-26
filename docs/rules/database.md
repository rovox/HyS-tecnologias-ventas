# Database rules

## Environments

| Env | Where | Who writes |
|---|---|---|
| **local** | Docker MySQL 8.4, `127.0.0.1:3307`, db `hys_sales` | you, freely (`pnpm db:reset`) |
| production | Hostinger MySQL `u656468476_hys_sales` | **only** reviewed SQL, applied by a human |

All current data is test data. Until go-live, production is not a testing ground: do not deploy to test.

## Schema changes

1. Edit `apps/api/prisma/schema.prisma`.
2. `pnpm --filter @hs-erp/api prisma migrate dev --name <change>` (local only). If the local DB user cannot create the shadow database, write `prisma/migrations/<ts>_<change>/migration.sql` by hand (check it with `prisma migrate diff --from-url $DATABASE_URL --to-schema-datamodel prisma/schema.prisma --script`) and apply it with `prisma migrate deploy` on the local DB.
3. Commit the migration and regenerate the single production SQL: `node apps/api/scripts/build-hostinger-sql.mjs` (updates `docs/deployment/hostinger-db.sql`; see `docs/deployment/hostinger.md`).
4. Ask for approval before: dropping/renaming tables or columns, changing stored role/status values.

Never run `prisma migrate deploy`, `db push` or `seed` against Hostinger. Never connect the app to the production DB from a laptop.

## Conventions

- Status and role columns are `String` validated against constants in `common/` (no MySQL enums, to avoid migration churn). Allowed values are listed in the module's `domain/<x>.rules.ts` / `common/policy/policy.ts` only.
- Money: `Decimal(12,2)`. Never `Float`.
- Every foreign key is a real Prisma relation (missing today: `QuotationSeller.userId`, `SaleJob.asignadoId`).
- Totals stored on a parent (e.g. `Schedule.saldo`) are **recomputed in the same transaction** that writes the children.
- Timestamps in UTC; the UI formats to local time.

## Reading production safely (backups, schema checks)

Production MySQL only listens on the server. Use SSH:

```bash
# On the server
mysqldump -h 127.0.0.1 -u u656468476_hys_api -p u656468476_hys_sales > backup_$(date +%F).sql

# From the laptop: tunnel, then connect a read-only client to localhost:3308
ssh -p <ssh-port> -L 3308:127.0.0.1:3306 u656468476@<server-ip>
```

Use the tunnel only to read and to compare schemas (`prisma db pull` into a scratch folder). Writes go through reviewed SQL, applied by one approved session after a backup. The SSH alias is `hostinger-hs` (`~/.ssh/config`). Prefer one scripted SSH session over many separate calls; do not use the Hostinger MCP connector for database work.

## Seed

`apps/api/prisma/seed.ts` must create at least one user per role, including **SEGURIDAD ELECTRÓNICA** (missing today), and data in every status of schedules, payments, quotations and orders, so every screen can be tested locally.
