/// <reference path="../pb_data/types.d.ts" />
onRecordAfterDeleteSuccess((e) => {
  const historialRecord = new Record($app.findCollectionByNameOrId("historial_actividad"));
  historialRecord.set("entidad_tipo", "comentario");
  historialRecord.set("entidad_id", e.record.id);
  historialRecord.set("usuario_id", e.record.get("usuario_id") || "");
  historialRecord.set("accion", "eliminar");
  historialRecord.set("descripcion", "Comentario eliminado");
  historialRecord.set("created_by", e.record.get("created_by") || "");
  $app.save(historialRecord);
  e.next();
}, "comentarios_actividad");