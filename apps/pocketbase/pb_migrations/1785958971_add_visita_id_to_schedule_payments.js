/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId("schedule_payments");
    let hasField = false;
    try { if (col.fields.getByName("visita_id")) hasField = true; } catch (_) {}
    if (!hasField) {
      col.fields.add(new TextField({ name: "visita_id" }));
      app.save(col);
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId("schedule_payments");
      try { col.fields.removeByName("visita_id"); } catch (_) {}
      app.save(col);
    } catch (e) { console.log("Revert skipped:", e.message); }
  }
);
