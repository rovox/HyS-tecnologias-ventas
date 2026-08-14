/// <reference path="../pb_data/types.d.ts" />
// Hook to auto-populate usuario_id and created_by with authenticated user ID on creation

onRecordCreate((e) => {
  const authId = e.requestInfo?.authRecord?.id || "";
  if (!e.record.get("usuario_id")) {
    e.record.set("usuario_id", authId);
  }
  if (!e.record.get("created_by")) {
    e.record.set("created_by", authId);
  }
  e.next();
}, "actividad_interna");

onRecordCreate((e) => {
  const authId = e.requestInfo?.authRecord?.id || "";
  if (!e.record.get("usuario_id")) {
    e.record.set("usuario_id", authId);
  }
  if (!e.record.get("created_by")) {
    e.record.set("created_by", authId);
  }
  e.next();
}, "comentarios_actividad");

onRecordCreate((e) => {
  const authId = e.requestInfo?.authRecord?.id || "";
  if (!e.record.get("created_by")) {
    e.record.set("created_by", authId);
  }
  e.next();
}, "historial_actividad");