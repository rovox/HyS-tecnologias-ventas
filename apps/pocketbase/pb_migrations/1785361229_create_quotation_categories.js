/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    let col;
    try { col = app.findCollectionByNameOrId("quotation_categories"); return; } catch (_) {}
    col = new Collection({
      type: "base",
      name: "quotation_categories",
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'ADMINISTRADOR'",
      updateRule: "@request.auth.role = 'ADMINISTRADOR'",
      deleteRule: "@request.auth.role = 'ADMINISTRADOR'",
      fields: [
        { name: "nombre", type: "text", required: true, max: 100 },
        { name: "orden", type: "number", required: false },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    });
    app.save(col);

    // Seed default categories
    const defaults = ["Cámaras","Alarmas","Control de acceso","Redes","Fibra óptica","Cercos eléctricos","Generadores eléctricos","UPS","Incendios","Otros"];
    defaults.forEach((nombre, i) => {
      const rec = new Record(col);
      rec.set("nombre", nombre);
      rec.set("orden", i + 1);
      app.save(rec);
    });
  },
  (app) => {
    try { app.delete(app.findCollectionByNameOrId("quotation_categories")); } catch (_) {}
  }
);
