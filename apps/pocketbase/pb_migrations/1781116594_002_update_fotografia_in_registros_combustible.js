/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("registros_combustible");
  const field = collection.fields.getByName("fotografia");
  field.maxSelect = 5;
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("registros_combustible");
  const field = collection.fields.getByName("fotografia");
  if (!field) { console.log("Field not found, skipping revert"); return; }
  field.maxSelect = 1;
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection or field not found, skipping revert");
      return;
    }
    throw e;
  }
})