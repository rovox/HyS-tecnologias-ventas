/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("schedules");

    const has = (name) => collection.fields.some((f) => f.name === name);

    if (!has("vendedor_id")) {
      collection.fields.add(
        new TextField({
          name: "vendedor_id",
          required: false,
          max: 0,
        }),
      );
    }

    if (!has("vendedor_nombre")) {
      collection.fields.add(
        new TextField({
          name: "vendedor_nombre",
          required: false,
          max: 0,
        }),
      );
    }

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("schedules");
    const f = collection.fields.find((x) => x.name === "vendedor_id");
    if (f) collection.fields.removeById(f.id);
    app.save(collection);
  },
);
