/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    let collection;
    try {
      collection = app.findCollectionByNameOrId("gastos_operativos");
    } catch (_) {
      collection = new Collection({
        type: "base",
        name: "gastos_operativos",
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora' || created_by = @request.auth.id",
        deleteRule: "@request.auth.role = 'ADMINISTRADOR'",
        fields: [
          { name: "persona_id", type: "text", required: true, max: 0, min: 0 },
          { name: "persona_nombre", type: "text", max: 0, min: 0 },
          { name: "monto", type: "number", required: true },
          { name: "concepto", type: "text", required: true, max: 0, min: 0 },
          { name: "trabajo_id", type: "text", max: 0, min: 0 },
          { name: "sucursal", type: "text", max: 0, min: 0 },
          { name: "fecha", type: "date", required: true },
          {
            name: "comprobante",
            type: "file",
            maxSelect: 1,
            maxSize: 20971520,
            mimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
          },
          {
            name: "estado",
            type: "select",
            maxSelect: 1,
            values: ["Pendiente", "Devuelto", "Rechazado"],
          },
          { name: "observacion", type: "text", max: 0, min: 0 },
          { name: "created_by", type: "text", required: true, max: 0, min: 0 },
          { name: "updated_by", type: "text", max: 0, min: 0 },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE INDEX idx_gastos_operativos_trabajo_id ON gastos_operativos (trabajo_id)",
        ],
      });
      app.save(collection);
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("gastos_operativos");
      app.delete(collection);
    } catch (e) {
      if (e.message.includes("no rows in result set")) {
        return;
      }
      throw e;
    }
  },
);
