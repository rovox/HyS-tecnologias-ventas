/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId("schedules");

    // Check and add tipo_entrada (trabajo | asistencia | relevamiento)
    let hasTipoEntrada = false;
    try { if (col.fields.getByName("tipo_entrada")) hasTipoEntrada = true; } catch (_) {}
    if (!hasTipoEntrada) {
      col.fields.add(new TextField({ name: "tipo_entrada" }));
    }

    // Check and add visita_id (reference to visitas_tecnicas)
    let hasVisitaId = false;
    try { if (col.fields.getByName("visita_id")) hasVisitaId = true; } catch (_) {}
    if (!hasVisitaId) {
      col.fields.add(new TextField({ name: "visita_id" }));
    }

    app.save(col);
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId("schedules");
      try { col.fields.removeByName("tipo_entrada"); } catch (_) {}
      try { col.fields.removeByName("visita_id"); } catch (_) {}
      app.save(col);
    } catch (e) {
      console.log("Revert skipped:", e.message);
    }
  }
);
