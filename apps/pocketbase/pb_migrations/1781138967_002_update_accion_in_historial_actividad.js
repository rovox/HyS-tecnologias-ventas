/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("historial_actividad");
  const field = collection.fields.getByName("accion");
  field.values = ["crear", "editar", "eliminar", "archivar", "cambiar_estado"];
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("historial_actividad");
  const field = collection.fields.getByName("accion");
  if (!field) { console.log("Field not found, skipping revert"); return; }
  field.values = ["crear", "editar", "eliminar", "archivar"];
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection or field not found, skipping revert");
      return;
    }
    throw e;
  }
})