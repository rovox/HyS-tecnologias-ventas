// Single roster of users for the local seed, the login chips, tests and the production users SQL.
// Passwords never live in git: config/users.passwords.local.json (gitignored, { "email": "password" })
// overrides the dev default, which is the lowercase first name (what CI and a fresh clone use).
const fs = require('node:fs');
const path = require('node:path');

const USERS = require('./users.json');

const PASSWORDS_FILE = path.join(__dirname, 'users.passwords.local.json');

function readLocalPasswords() {
  if (!fs.existsSync(PASSWORDS_FILE)) return {};
  return JSON.parse(fs.readFileSync(PASSWORDS_FILE, 'utf8'));
}

const localPasswords = readLocalPasswords();

function findUser(email) {
  const user = USERS.find((u) => u.email === email);
  if (!user) throw new Error(`config/users.json has no user ${email}`);
  return user;
}

// Only the real password from the local file (undefined when absent); production SQL requires it.
function localPasswordFor(email) {
  return localPasswords[findUser(email).email];
}

function passwordFor(email) {
  return localPasswordFor(email) ?? findUser(email).name.split(' ')[0].toLowerCase();
}

function credentialsFor(email) {
  return { email: findUser(email).email, password: passwordFor(email) };
}

// One account per role for tests and scripts.
const ROLE_ACCOUNTS = {
  admin: 'julio@hscontrol.com',
  ventas: 'denis.palacios@hys.com',
  contabilidad: 'estefany.gonzales@hscontrol.com',
  tecnico: 'marcos.tec@demo.hs.local',
};

module.exports = { USERS, ROLE_ACCOUNTS, findUser, localPasswordFor, passwordFor, credentialsFor };
