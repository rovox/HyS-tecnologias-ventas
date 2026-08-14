/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const sp = app.findCollectionByNameOrId("schedule_payments");

    const addText = (name) => {
      if (!sp.fields.getByName(name)) {
        sp.fields.add(new TextField({ name, required: false }));
      }
    };

    ["cobrado_por_id", "cobrado_por_nombre", "confirmado_por_id",
     "confirmado_por_nombre", "vendedor_nombre"].forEach(addText);

    if (!sp.fields.getByName("fecha_confirmacion")) {
      sp.fields.add(new DateField({ name: "fecha_confirmacion", required: false }));
    }

    // Make monto_cobrado not required (zero is valid for discount-only records)
    const mc = sp.fields.getByName("monto_cobrado");
    if (mc) mc.required = false;

    app.save(sp);

    // Add vendedor_nombre text field to schedules
    try {
      const sch = app.findCollectionByNameOrId("schedules");
      if (!sch.fields.getByName("vendedor_nombre")) {
        sch.fields.add(new TextField({ name: "vendedor_nombre", required: false }));
      }
      app.save(sch);
    } catch (e) {
      console.log("schedules field add skipped:", e.message);
    }
  },
  (app) => {
    try {
      const sp = app.findCollectionByNameOrId("schedule_payments");
      ["cobrado_por_id", "cobrado_por_nombre", "confirmado_por_id",
       "confirmado_por_nombre", "fecha_confirmacion", "vendedor_nombre"].forEach(n => {
        try { sp.fields.removeByName(n); } catch (_) {}
      });
      const mc = sp.fields.getByName("monto_cobrado");
      if (mc) mc.required = true;
      app.save(sp);
    } catch (e) { console.log("revert sp:", e.message); }

    try {
      const sch = app.findCollectionByNameOrId("schedules");
      try { sch.fields.removeByName("vendedor_nombre"); } catch (_) {}
      app.save(sch);
    } catch (e) { console.log("revert sch:", e.message); }
  }
);
