/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId("visitas_tecnicas");

    if (!col.fields.getByName("dentro_garantia")) {
      col.fields.add(
        new BoolField({
          name: "dentro_garantia",
          required: false,
        }),
      );
    }

    app.save(col);
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId("visitas_tecnicas");
      col.fields.removeByName("dentro_garantia");
      app.save(col);
    } catch (e) {
      if (e.message.includes("no rows in result set")) return;
      throw e;
    }
  },
);
