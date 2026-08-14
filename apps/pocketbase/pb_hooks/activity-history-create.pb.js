/// <reference path="../pb_data/types.d.ts" />
// Hook to automatically log create actions in historial_actividad
// when records are created in actividad_interna and comentarios_actividad

onRecordAfterCreateSuccess((e) => {
  const historialRecord = new Record($app.findCollectionByNameOrId("historial_actividad"));
  historialRecord.set("entidad_tipo", "actividad_interna");
  historialRecord.set("entidad_id", e.record.id);
  historialRecord.set("usuario_id", e.record.get("usuario_id") || e.record.get("created_by") || "");
  historialRecord.set("accion", "crear");
  historialRecord.set("descripcion", "Actividad interna creada: " + e.record.get("titulo"));
  historialRecord.set("created_by", e.record.get("created_by") || "");
  
  try {
    $app.save(historialRecord);
  } catch (err) {
    console.log("Error logging activity creation: " + err.message);
  }
  
  e.next();
}, "actividad_interna");

onRecordAfterCreateSuccess((e) => {
  const historialRecord = new Record($app.findCollectionByNameOrId("historial_actividad"));
  historialRecord.set("entidad_tipo", "comentarios_actividad");
  historialRecord.set("entidad_id", e.record.id);
  historialRecord.set("usuario_id", e.record.get("usuario_id") || e.record.get("created_by") || "");
  historialRecord.set("accion", "crear");
  historialRecord.set("descripcion", "Comentario creado en actividad: " + e.record.get("actividad_id"));
  historialRecord.set("created_by", e.record.get("created_by") || "");
  
  try {
    $app.save(historialRecord);
  } catch (err) {
    console.log("Error logging comment creation: " + err.message);
  }
  
  e.next();
}, "comentarios_actividad");