/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("tecnicos");
    // Align viewRule with the existing public listRule so authenticated
    // screens can fetch a single técnico by id (used in schedule details)
    // without triggering "Only superusers can perform this action".
    collection.viewRule = "";
    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("tecnicos");
    collection.viewRule = null;
    app.save(collection);
  },
);
