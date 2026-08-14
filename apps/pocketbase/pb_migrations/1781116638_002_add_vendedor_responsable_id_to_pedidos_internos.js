/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pedidos_internos");

  const existing = collection.fields.getByName("vendedor_responsable_id");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("vendedor_responsable_id"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "vendedor_responsable_id",
    required: true
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("pedidos_internos");
    collection.fields.removeByName("vendedor_responsable_id");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})