/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("schedules");

    if (!collection.fields.getByName("maps_link")) {
      collection.fields.add(
        new TextField({
          name: "maps_link",
          required: false,
          max: 1000,
        }),
      );
      app.save(collection);
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("schedules");
    collection.fields.removeByName("maps_link");
    app.save(collection);
  },
);
