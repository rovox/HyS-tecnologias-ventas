/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId("campaigns_new");
    col.fields.add(new SelectField({ name: "canal", maxSelect: 1, required: false, values: ["Facebook","TikTok","WhatsApp","Volantes","Referidos","Otro"] }));
    col.fields.add(new TextField({ name: "sucursal_nombre", required: false }));
    col.fields.add(new NumberField({ name: "interesados", required: false }));
    col.fields.add(new NumberField({ name: "clientes_generados", required: false }));
    col.fields.add(new NumberField({ name: "trabajos_cerrados", required: false }));
    col.fields.add(new NumberField({ name: "gasto_real", required: false }));
    app.save(col);
  },
  (app) => {
    const col = app.findCollectionByNameOrId("campaigns_new");
    ["canal","sucursal_nombre","interesados","clientes_generados","trabajos_cerrados","gasto_real"].forEach(n => {
      try { col.fields.removeByName(n); } catch(e) {}
    });
    app.save(col);
  }
);
