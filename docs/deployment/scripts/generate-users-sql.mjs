#!/usr/bin/env node
// Prints INSERT SQL for production users. Reads the rows from the HS_USERS env var
// (JSON array) so no email, password or hash is stored in git.
//
//   HS_USERS='[{"id":"usr_x","email":"x@example.com","passwordHash":"$2b$10$...","name":"X","role":"VENTAS / ADMINISTRACIÓN","sucursalId":"suc_central"}]' \
//     node docs/deployment/scripts/generate-users-sql.mjs > users.sql
//
// Review users.sql, then apply it once in phpMyAdmin (one approved write session).
// INSERT IGNORE: existing users are never touched, so a re-run cannot change a role or a password.

const ROLES = ['ADMINISTRADOR', 'VENTAS / ADMINISTRACIÓN', 'SEGURIDAD ELECTRÓNICA', 'SIN ACCESO'];

const raw = process.env.HS_USERS;
if (!raw) {
  console.error('HS_USERS is not set (JSON array of users).');
  process.exit(1);
}

const users = JSON.parse(raw);
const sql = (value) => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;

const rows = users.map((u) => {
  for (const key of ['id', 'email', 'passwordHash', 'name', 'role']) {
    if (!u[key]) throw new Error(`User ${u.email ?? '?'}: missing "${key}"`);
  }
  if (!ROLES.includes(u.role)) throw new Error(`User ${u.email}: unknown role "${u.role}"`);
  if (!/^\$2[aby]\$\d{2}\$/.test(u.passwordHash)) throw new Error(`User ${u.email}: passwordHash is not bcrypt`);
  const cols = [u.id, u.email, u.passwordHash, u.name, u.role, u.phone ?? '', u.sucursalId ?? 'suc_central'];
  return `  (${cols.map(sql).join(', ')}, true, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`;
});

console.log(`INSERT IGNORE INTO \`users\`
  (\`id\`, \`email\`, \`passwordHash\`, \`name\`, \`role\`, \`phone\`, \`sucursalId\`, \`active\`, \`monthlyGoalBs\`, \`createdAt\`, \`updatedAt\`)
VALUES
${rows.join(',\n')};`);
