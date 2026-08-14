/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("campaigns");
  collection.createRule = "@request.auth.role = 'VENTAS / ADMINISTRACI\u00d3N' || @request.auth.role = 'SEGURIDAD ELECTR\u00d3NICA' || @request.auth.role = 'ADMINISTRADOR'";
  collection.updateRule = "@request.auth.role = 'VENTAS / ADMINISTRACI\u00d3N' || @request.auth.role = 'SEGURIDAD ELECTR\u00d3NICA' || @request.auth.role = 'ADMINISTRADOR'";
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("campaigns");
  collection.createRule = "@request.auth.role = 'ventas' || @request.auth.role = 'admin'";
  collection.updateRule = "@request.auth.role = 'ventas' || @request.auth.role = 'admin'";
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})