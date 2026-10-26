# Production users — do not re-import the old SQL

`hostinger-users-hscontrol.sql` was **retired** (STATUS.md, decision D5). Do not restore it from git history and do not import it again:

- It upserts with `ON DUPLICATE KEY UPDATE role = VALUES(role)` and inserts one user with the removed role `Contadora`. Re-importing it would put that user back on a role the API no longer knows.
- It also embedded plaintext passwords in a comment. Those remain in git history; the risk is documented and accepted for this release (decision D4: no rotation, no history purge).

## Creating users in production

1. Add or update the user in [`config/users.json`](../../config/users.json) (the single roster) and put the real password in `config/users.passwords.local.json` (gitignored, `{ "email": "password" }`).
2. Generate the SQL outside git, for example:
   `node apps/api/scripts/generate-users-sql.mjs --insert dennis@hscontrol.com --rename stephany@hscontrol.com=estefany@hscontrol.com > ~/users.sql`
3. Review `users.sql`. Inserts use `INSERT IGNORE` (an existing email is never modified) and production ids `usr_<local part>`; renames change only email and name.
4. Apply it in a single approved write session after a backup (`docs/rules/database.md`, "Reading production safely").

Never run `prisma db seed` on the host.
