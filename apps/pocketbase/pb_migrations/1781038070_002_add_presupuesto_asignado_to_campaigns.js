/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("campaigns");

  const existing = collection.fields.getByName("presupuesto_asignado");
  if (existing) {
    if (existing.type === "number") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("presupuesto_asignado"); // exists with wrong type, remove first
  }

  collection.fields.add(new NumberField({
    name: "presupuesto_asignado"
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("campaigns");
    collection.fields.removeByName("presupuesto_asignado");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})