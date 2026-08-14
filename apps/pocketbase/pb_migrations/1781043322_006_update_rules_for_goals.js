/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("goals");
  collection.listRule = "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'VENTAS / ADMINISTRACI\u00d3N'";
  collection.viewRule = "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'VENTAS / ADMINISTRACI\u00d3N'";
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("goals");
  collection.listRule = "@request.auth.role = 'admin'";
  collection.viewRule = "@request.auth.role = 'admin'";
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})