/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("schedules");
  collection.updateRule = "@request.auth.id != ''";
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("schedules");
  collection.updateRule = "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'VENTAS / ADMINISTRACI\u00d3N'";
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})