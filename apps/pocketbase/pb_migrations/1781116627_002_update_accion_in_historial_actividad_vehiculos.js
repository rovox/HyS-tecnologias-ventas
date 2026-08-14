/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("historial_actividad_vehiculos");
  const field = collection.fields.getByName("accion");
  field.required = true;
  field.values = ["crear", "editar", "eliminar", "registrar_combustible", "registrar_aceite", "registrar_mantenimiento", "reportar_problema", "cambiar_estado"];
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("historial_actividad_vehiculos");
  const field = collection.fields.getByName("accion");
  if (!field) { console.log("Field not found, skipping revert"); return; }
  field.required = false;
  field.values = ["crear", "editar", "eliminar"];
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection or field not found, skipping revert");
      return;
    }
    throw e;
  }
})