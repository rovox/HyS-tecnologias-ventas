/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId("actividad_interna");

    col.fields.add(new SelectField({
      name: "tipo",
      maxSelect: 1,
      required: false,
      values: ["General","Trabajo","Urgente","Material","Cobro/Rendición","Foto de avance","Aviso interno"],
    }));
    col.fields.add(new TextField({ name: "trabajo_id", required: false }));
    col.fields.add(new TextField({ name: "trabajo_nombre", required: false }));
    col.fields.add(new TextField({ name: "cliente_id", required: false }));
    col.fields.add(new TextField({ name: "cliente_nombre", required: false }));
    col.fields.add(new TextField({ name: "pedido_id", required: false }));
    col.fields.add(new TextField({ name: "sucursal_nombre", required: false }));
    col.fields.add(new TextField({ name: "created_by_nombre", required: false }));
    col.fields.add(new BoolField({ name: "es_importante", required: false }));
    col.fields.add(new BoolField({ name: "es_resuelto", required: false }));
    col.fields.add(new BoolField({ name: "fijado", required: false }));
    col.fields.add(new JSONField({ name: "reacciones", required: false }));

    app.save(col);
  },
  (app) => {
    const col = app.findCollectionByNameOrId("actividad_interna");
    ["tipo","trabajo_id","trabajo_nombre","cliente_id","cliente_nombre","pedido_id","sucursal_nombre","created_by_nombre","es_importante","es_resuelto","fijado","reacciones"].forEach(n => {
      try { col.fields.removeByName(n); } catch(e) {}
    });
    app.save(col);
  }
);
