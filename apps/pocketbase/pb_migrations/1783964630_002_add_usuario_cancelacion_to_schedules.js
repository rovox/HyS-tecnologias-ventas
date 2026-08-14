/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("schedules");

  const existing = collection.fields.getByName("usuario_cancelacion");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("usuario_cancelacion"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "usuario_cancelacion",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("schedules");
    collection.fields.removeByName("usuario_cancelacion");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})