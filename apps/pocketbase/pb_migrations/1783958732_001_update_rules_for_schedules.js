/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("schedules");
  collection.listRule = "@request.auth.id != ''";
  collection.viewRule = "@request.auth.id != ''";
  collection.createRule = "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'VENTAS / ADMINISTRACI\u00d3N'";
  collection.updateRule = "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'VENTAS / ADMINISTRACI\u00d3N'";
  collection.deleteRule = "@request.auth.role = 'ADMINISTRADOR'";
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("schedules");
  collection.listRule = "@request.auth.id != '' || vendedor_responsable_id = @request.auth.id";
  collection.viewRule = "@request.auth.id != '' || vendedor_responsable_id = @request.auth.id";
  collection.createRule = "@request.auth.id != ''";
  collection.updateRule = "@request.auth.role = 'ADMINISTRADOR' || created_by = @request.auth.id";
  collection.deleteRule = "@request.auth.role = 'ADMINISTRADOR'";
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})