/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    let collection;
    try {
      collection = app.findCollectionByNameOrId("costos_trabajo");
    } catch (_) {
      collection = new Collection({
        type: "base",
        name: "costos_trabajo",
        listRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
        viewRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
        createRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
        updateRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
        deleteRule: "@request.auth.role = 'ADMINISTRADOR'",
        fields: [
          { name: "trabajo_id", type: "text", required: true, max: 0, min: 0 },
          { name: "cliente_id", type: "text", max: 0, min: 0 },
          { name: "sucursal", type: "text", max: 0, min: 0 },
          { name: "concepto", type: "text", required: true, max: 0, min: 0 },
          { name: "cantidad", type: "number" },
          { name: "precio_unitario", type: "number" },
          { name: "costo_total", type: "number" },
          { name: "fecha", type: "date", required: true },
          { name: "observacion", type: "text", max: 0, min: 0 },
          { name: "created_by", type: "text", required: true, max: 0, min: 0 },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE INDEX idx_costos_trabajo_trabajo_id ON costos_trabajo (trabajo_id)",
        ],
      });
      app.save(collection);
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("costos_trabajo");
      app.delete(collection);
    } catch (e) {
      if (e.message.includes("no rows in result set")) {
        return;
      }
      throw e;
    }
  },
);
