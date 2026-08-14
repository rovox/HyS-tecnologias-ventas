/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("clientes");
  collection.name = "clientes_legacy";
  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("clientes_legacy");
    collection.name = "clientes";
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})