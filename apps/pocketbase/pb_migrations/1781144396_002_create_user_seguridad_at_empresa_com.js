/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  const record = new Record(collection);
  record.set("email", "seguridad@empresa.com");
  record.setPassword("Seguridad123!");
  record.set("role", "SEGURIDAD ELECTR\u00d3NICA");
  record.set("name", "T\u00e9cnico Seguridad");
  record.set("department", "Seguridad Electr\u00f3nica");
  record.set("active", true);
  try {
    return app.save(record);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
      return;
    }
    throw e;
  }
}, (app) => {
  try {
    const record = app.findFirstRecordByData("users", "email", "seguridad@empresa.com");
    app.delete(record);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Auth record not found, skipping rollback");
      return;
    }
    throw e;
  }
})