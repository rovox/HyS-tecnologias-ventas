/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // Clean up any partial state from prior failed attempts
    try {
      const existing = app.findCollectionByNameOrId("comentarios_actividad");
      app.delete(existing);
    } catch(e) {}

    const col = new Collection({
      type: "base",
      name: "comentarios_actividad",
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        new TextField({ name: "actividad_id", required: true }),
        new TextField({ name: "contenido", required: true }),
        new TextField({ name: "usuario_nombre", required: false }),
        new TextField({ name: "created_by", required: true }),
        new AutodateField({ name: "created", onCreate: true, onUpdate: false }),
        new AutodateField({ name: "updated", onCreate: true, onUpdate: true }),
      ],
    });
    app.save(col);
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId("comentarios_actividad");
      app.delete(col);
    } catch(e) {}
  }
);
