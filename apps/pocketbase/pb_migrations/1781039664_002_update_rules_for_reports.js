/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("reports");
  collection.listRule = "@request.auth.role = 'admin' || @request.auth.role = 'ventas'";
  collection.viewRule = "@request.auth.role = 'admin' || @request.auth.role = 'ventas'";
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("reports");
  collection.listRule = "@request.auth.role = 'admin' || @request.auth.role = 'ventas'";
  collection.viewRule = "@request.auth.role = 'admin' || @request.auth.role = 'ventas'";
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})