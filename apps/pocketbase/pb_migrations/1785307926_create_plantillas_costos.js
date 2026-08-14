/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    try { app.findCollectionByNameOrId("plantillas_costos"); return; } catch (_) {}

    const col = new Collection({
      type: "base",
      name: "plantillas_costos",
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
      updateRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
      deleteRule: "@request.auth.role = 'ADMINISTRADOR'",
      fields: [
        { name: "nombre", type: "text", required: true },
        { name: "descripcion", type: "text" },
        { name: "items", type: "json" },
        { name: "created_by", type: "text" },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true }
      ]
    });
    app.save(col);
  },
  (app) => {
    try { app.delete(app.findCollectionByNameOrId("plantillas_costos")); } catch (_) {}
  }
);
