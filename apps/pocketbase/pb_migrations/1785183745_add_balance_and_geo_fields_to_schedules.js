/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("schedules");

    if (!collection.fields.getByName("cobros_realizados")) {
      collection.fields.add(
        new NumberField({
          name: "cobros_realizados",
          required: false,
        }),
      );
    }

    if (!collection.fields.getByName("adicionales")) {
      collection.fields.add(
        new NumberField({
          name: "adicionales",
          required: false,
        }),
      );
    }

    if (!collection.fields.getByName("latitud")) {
      collection.fields.add(
        new NumberField({
          name: "latitud",
          required: false,
        }),
      );
    }

    if (!collection.fields.getByName("longitud")) {
      collection.fields.add(
        new NumberField({
          name: "longitud",
          required: false,
        }),
      );
    }

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("schedules");
    collection.fields.removeByName("cobros_realizados");
    collection.fields.removeByName("adicionales");
    collection.fields.removeByName("latitud");
    collection.fields.removeByName("longitud");
    app.save(collection);
  },
);
