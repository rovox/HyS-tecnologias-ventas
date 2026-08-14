/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("schedule_payments");
  collection.listRule = "@request.auth.role = 'ADMINISTRADOR'";
  collection.viewRule = "usuario_id = @request.auth.id || @request.auth.role = 'ADMINISTRADOR'";
  collection.createRule = "@request.auth.id != ''";
  collection.updateRule = "@request.auth.role = 'ADMINISTRADOR'";
  collection.deleteRule = "@request.auth.role = 'ADMINISTRADOR'";
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("schedule_payments");
  collection.listRule = "";
  collection.viewRule = "";
  collection.createRule = "";
  collection.updateRule = "";
  collection.deleteRule = "";
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})