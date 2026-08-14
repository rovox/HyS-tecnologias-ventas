/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("sucursales");
  collection.listRule = "";
  collection.viewRule = "";
  collection.createRule = "@request.auth.role = 'ADMINISTRADOR'";
  collection.updateRule = "@request.auth.role = 'ADMINISTRADOR'";
  collection.deleteRule = "@request.auth.role = 'ADMINISTRADOR'";
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("sucursales");
  collection.listRule = null;
  collection.viewRule = null;
  collection.createRule = null;
  collection.updateRule = null;
  collection.deleteRule = null;
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})