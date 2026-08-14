/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("schedules");
  const field = collection.fields.getByName("estado");
  field.values = ["programado", "en_proceso", "por_culminar", "completado", "terminado", "cancelado"];
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("schedules");
  const field = collection.fields.getByName("estado");
  if (!field) { console.log("Field not found, skipping revert"); return; }
  field.values = ["programado", "en_proceso", "por_culminar", "completado", "terminado"];
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection or field not found, skipping revert");
      return;
    }
    throw e;
  }
})