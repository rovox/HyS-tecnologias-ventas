/// <reference path="../pb_data/types.d.ts" />

// Asistencias/Relevamientos added to the cronograma reference an existing
// visita and do not carry client/description data, so these text fields
// must not be mandatory at the collection level.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId("schedules");
    ["cliente", "descripcion_trabajo", "lugar", "cliente_id"].forEach((name) => {
      const f = col.fields.getByName(name);
      if (f) f.required = false;
    });
    app.save(col);
  },
  (app) => {
    const col = app.findCollectionByNameOrId("schedules");
    ["cliente", "descripcion_trabajo", "lugar", "cliente_id"].forEach((name) => {
      const f = col.fields.getByName(name);
      if (f) f.required = true;
    });
    app.save(col);
  },
);
