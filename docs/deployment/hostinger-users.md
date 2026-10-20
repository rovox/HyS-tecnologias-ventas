# Production users — do not re-import the old SQL

`hostinger-users-hscontrol.sql` was **retired** (STATUS.md, decision D5). Do not restore it from git history and do not import it again:

- It upserts with `ON DUPLICATE KEY UPDATE role = VALUES(role)` and inserts one user with the removed role `Contadora`. Re-importing it would put that user back on a role the API no longer knows.
- It also embedded plaintext passwords in a comment. Those remain in git history; the risk is documented and accepted for this release (decision D4: no rotation, no history purge).

## Creating users in production

1. Build the rows outside git (password manager or local shell) and export them as JSON in `HS_USERS`, with a bcrypt `passwordHash` per user.
2. Run `node docs/deployment/scripts/generate-users-sql.mjs > users.sql` (see the header of the script for the shape).
3. Review `users.sql`. It uses `INSERT IGNORE`, so existing users, roles and passwords are never modified.
4. Apply it in a single approved write session after a backup (`docs/rules/database.md`, "Reading production safely").

Never run `prisma db seed` on the host.
