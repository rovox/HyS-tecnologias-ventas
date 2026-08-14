/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("registros_mantenimiento");
  const field = collection.fields.getByName("tipo_mantenimiento");
  field.required = true;
  field.values = ["Revisi\u00f3n", "Reparaci\u00f3n", "Inspecci\u00f3n", "Otro"];
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("registros_mantenimiento");
  const field = collection.fields.getByName("tipo_mantenimiento");
  if (!field) { console.log("Field not found, skipping revert"); return; }
  field.required = false;
  field.values = ["cambio_aceite", "revision", "reparacion", "otro"];
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection or field not found, skipping revert");
      return;
    }
    throw e;
  }
})