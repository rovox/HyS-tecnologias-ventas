/// <reference path="../pb_data/types.d.ts" />

// Ensures a known-working ADMINISTRADOR login exists.
// Finds admin@empresa.com (seeded earlier) and resets its password,
// and guarantees active = true. Also falls back to creating the account
// if it was deleted. This resolves the "invalid login credentials" 400
// that occurs when the operator does not know a valid password.
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("users");
    const email = "admin@empresa.com";
    const password = "HsAdmin2026!";

    let record;
    try {
      record = app.findFirstRecordByData("users", "email", email);
    } catch (_) {
      record = new Record(collection);
      record.set("email", email);
      record.set("name", "Administrador Sistema");
      record.set("role", "ADMINISTRADOR");
      record.set("department", "Administración");
    }

    record.setPassword(password);
    record.set("active", true);
    app.save(record);
  },
  (app) => {
    // no-op: do not delete the admin account on rollback
  },
);
