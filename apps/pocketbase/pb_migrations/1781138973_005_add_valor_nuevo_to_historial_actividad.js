/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("historial_actividad");

  const existing = collection.fields.getByName("valor_nuevo");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("valor_nuevo"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "valor_nuevo",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("historial_actividad");
    collection.fields.removeByName("valor_nuevo");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})