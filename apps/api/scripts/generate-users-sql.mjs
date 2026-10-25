#!/usr/bin/env node
// Prints SQL for production users from the shared roster (config/users.json). Emails, names and
// roles come from the roster; passwords only from the gitignored config/users.passwords.local.json,
// hashed here with bcrypt, so no password or hash is stored in git.
//
//   node apps/api/scripts/generate-users-sql.mjs \
//     --insert dennis@hscontrol.com,giovanni@hscontrol.com \
//     --rename stephany@hscontrol.com=estefany@hscontrol.com \
//     --role estefany@hscontrol.com > ~/users.sql
//
// --insert: INSERT IGNORE, so an existing user (same email) is never touched. Production ids are
//           `usr_<email local part>`, not the local seed ids, to avoid colliding with existing rows.
// --rename: UPDATE email and name (from the roster entry of the new email); role and password stay.
// --role:   UPDATE role from the roster (e.g. Estefany → CONTABILIDAD, AUTH-01); runs after the renames.
// Review users.sql, then apply it once after a backup (one approved write session).

import bcrypt from 'bcryptjs';
import { findUser, localPasswordFor } from '../../../config/users.js';

const ROLES = ['ADMINISTRADOR', 'VENTAS / ADMINISTRACIÓN', 'SEGURIDAD ELECTRÓNICA', 'CONTABILIDAD', 'SIN ACCESO'];

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const list = (value) => (value ? value.split(',').map((v) => v.trim()).filter(Boolean) : []);
const inserts = list(args.insert);
const renames = list(args.rename).map((pair) => pair.split('='));
const roleChanges = list(args.role);
if (!inserts.length && !renames.length && !roleChanges.length) {
  console.error('Nothing to do: pass --insert a@x,b@x, --rename old@x=new@x and/or --role a@x');
  process.exit(1);
}

const sql = (value) => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;

const rows = inserts.map((email) => {
  const u = findUser(email);
  if (u.localOnly) throw new Error(`${email} is localOnly and never goes to production`);
  if (!ROLES.includes(u.role)) throw new Error(`${email}: unknown role "${u.role}"`);
  const password = localPasswordFor(email);
  if (!password) throw new Error(`${email}: no password in config/users.passwords.local.json`);
  const id = `usr_${email.split('@')[0].replace(/[^a-z0-9]/gi, '_')}`;
  // Roster phone and monthly goal are local seed data: production starts empty and sets goals in the app.
  const cols = [id, u.email, bcrypt.hashSync(password, 10), u.name, u.role, '', u.sucursalId ?? 'suc_central'];
  return `  (${cols.map(sql).join(', ')}, true, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`;
});

const out = ['START TRANSACTION;'];
if (rows.length) {
  out.push(`INSERT IGNORE INTO \`users\`
  (\`id\`, \`email\`, \`passwordHash\`, \`name\`, \`role\`, \`phone\`, \`sucursalId\`, \`active\`, \`monthlyGoalBs\`, \`createdAt\`, \`updatedAt\`)
VALUES
${rows.join(',\n')};`);
}
for (const [from, to] of renames) {
  const u = findUser(to);
  out.push(`UPDATE \`users\` SET \`email\` = ${sql(u.email)}, \`name\` = ${sql(u.name)}, \`updatedAt\` = CURRENT_TIMESTAMP(3) WHERE \`email\` = ${sql(from)};`);
}
for (const email of roleChanges) {
  const u = findUser(email);
  if (!ROLES.includes(u.role)) throw new Error(`${email}: unknown role "${u.role}"`);
  out.push(`UPDATE \`users\` SET \`role\` = ${sql(u.role)}, \`updatedAt\` = CURRENT_TIMESTAMP(3) WHERE \`email\` = ${sql(u.email)};`);
}
const touched = [...new Set([...inserts, ...renames.flat(), ...roleChanges])];
out.push(`SELECT \`email\`, \`name\`, \`role\`, \`active\` FROM \`users\` WHERE \`email\` IN (${touched.map(sql).join(', ')});`);
out.push('COMMIT;');
console.log(out.join('\n\n'));
