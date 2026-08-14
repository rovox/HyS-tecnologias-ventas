/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("pedidos_internos");

    // Add "rechazado" as a valid estado option (kept alongside "cancelado"
    // for backwards compatibility with existing records).
    const estadoField = collection.fields.getByName("estado");
    if (estadoField && Array.isArray(estadoField.values) && !estadoField.values.includes("rechazado")) {
      estadoField.values = [...estadoField.values, "rechazado"];
    }

    // Track who marked the order as delivered and an optional note.
    if (!collection.fields.getByName("entregado_por_id")) {
      collection.fields.add(
        new TextField({
          name: "entregado_por_id",
          required: false,
        }),
      );
    }
    if (!collection.fields.getByName("observacion_entrega")) {
      collection.fields.add(
        new TextField({
          name: "observacion_entrega",
          required: false,
        }),
      );
    }

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("pedidos_internos");

    const estadoField = collection.fields.getByName("estado");
    if (estadoField && Array.isArray(estadoField.values)) {
      estadoField.values = estadoField.values.filter((v) => v !== "rechazado");
    }

    collection.fields.removeByName("entregado_por_id");
    collection.fields.removeByName("observacion_entrega");

    app.save(collection);
  },
);
