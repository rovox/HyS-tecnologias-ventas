/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId("quotations");
    if (!col.fields.getByName("observacion")) {
      col.fields.add(new TextField({ name: "observacion", required: false }));
      app.save(col);
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId("quotations");
    col.fields.removeByName("observacion");
    app.save(col);
  }
);
