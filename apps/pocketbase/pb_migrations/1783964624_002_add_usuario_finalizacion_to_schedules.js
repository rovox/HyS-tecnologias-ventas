/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("schedules");

  const existing = collection.fields.getByName("usuario_finalizacion");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("usuario_finalizacion"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "usuario_finalizacion",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("schedules");
    collection.fields.removeByName("usuario_finalizacion");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})