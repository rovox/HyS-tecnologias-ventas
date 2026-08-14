/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // Add origen + id_origen to movimientos for deduplication
    const mov = app.findCollectionByNameOrId("movimientos");
    if (!mov.fields.getByName("origen")) {
      mov.fields.add(new TextField({ name: "origen", required: false }));
    }
    if (!mov.fields.getByName("id_origen")) {
      mov.fields.add(new TextField({ name: "id_origen", required: false }));
    }
    app.save(mov);

    // Add tipo_cobro to schedule_payments for adelanto vs cobro_final tracking
    const sp = app.findCollectionByNameOrId("schedule_payments");
    if (!sp.fields.getByName("tipo_cobro")) {
      sp.fields.add(new TextField({ name: "tipo_cobro", required: false }));
    }
    app.save(sp);
  },
  (app) => {
    try {
      const mov = app.findCollectionByNameOrId("movimientos");
      mov.fields.removeByName("origen");
      mov.fields.removeByName("id_origen");
      app.save(mov);
    } catch (_) {}
    try {
      const sp = app.findCollectionByNameOrId("schedule_payments");
      sp.fields.removeByName("tipo_cobro");
      app.save(sp);
    } catch (_) {}
  }
);
