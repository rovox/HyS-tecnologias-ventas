/// <reference path="../pb_data/types.d.ts" />
onRecordAfterUpdateSuccess((e) => {
  const historialRecord = new Record($app.findCollectionByNameOrId("historial_actividad"));
  historialRecord.set("entidad_tipo", "comentario");
  historialRecord.set("entidad_id", e.record.id);
  historialRecord.set("usuario_id", e.record.get("usuario_id") || "");
  historialRecord.set("accion", "editar");
  historialRecord.set("descripcion", "Comentario actualizado");
  historialRecord.set("created_by", e.record.get("updated_by") || e.record.get("created_by") || "");
  $app.save(historialRecord);
  e.next();
}, "comentarios_actividad");