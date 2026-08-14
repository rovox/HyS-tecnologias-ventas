/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("registros_combustible");
  collection.fields.removeByName("costo_por_litro");
  return app.save(collection);
}, (app) => {
  try {

  const collection = app.findCollectionByNameOrId("registros_combustible");
  collection.fields.add(new NumberField({
    name: "costo_por_litro",
    required: false
  }));
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})