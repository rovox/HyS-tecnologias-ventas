/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("schedule_payments");

    if (!collection.fields.getByName("cobrado_por_id")) {
      collection.fields.add(
        new TextField({
          name: "cobrado_por_id",
          required: false,
        }),
      );
    }

    if (!collection.fields.getByName("cobrado_por_nombre")) {
      collection.fields.add(
        new TextField({
          name: "cobrado_por_nombre",
          required: false,
        }),
      );
    }

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("schedule_payments");
    collection.fields.removeByName("cobrado_por_id");
    collection.fields.removeByName("cobrado_por_nombre");
    app.save(collection);
  },
);
