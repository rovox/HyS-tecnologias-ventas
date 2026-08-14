/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId("visitas_tecnicas");

    const fieldsToAdd = [
      { name: "trabajo_relacionado_id", type: "text", required: false },
      { name: "fecha_instalacion_relacionada", type: "date", required: false },
      { name: "garantia_hasta", type: "date", required: false },
      { name: "estado_garantia", type: "select", maxSelect: 1, values: ["En garantía", "Fuera de garantía", "Verificar"], required: false },
      { name: "se_cobra", type: "bool" },
      { name: "monto_cobrado", type: "number", required: false },
      { name: "medio_pago", type: "select", maxSelect: 1, values: ["Efectivo", "QR", "Transferencia", "Débito", "Crédito"], required: false },
      { name: "cobro_pendiente_rendicion", type: "bool" },
    ];

    for (const f of fieldsToAdd) {
      if (!col.fields.getByName(f.name)) {
        if (f.type === "select") {
          col.fields.add(new SelectField(f));
        } else if (f.type === "bool") {
          col.fields.add(new BoolField(f));
        } else if (f.type === "number") {
          col.fields.add(new NumberField(f));
        } else if (f.type === "date") {
          col.fields.add(new DateField(f));
        } else {
          col.fields.add(new TextField(f));
        }
      }
    }
    app.save(col);
  },
  (app) => {
    const col = app.findCollectionByNameOrId("visitas_tecnicas");
    const toRemove = ["trabajo_relacionado_id","fecha_instalacion_relacionada","garantia_hasta","estado_garantia","se_cobra","monto_cobrado","medio_pago","cobro_pendiente_rendicion"];
    for (const n of toRemove) {
      try { col.fields.removeByName(n); } catch(_) {}
    }
    app.save(col);
  }
);
