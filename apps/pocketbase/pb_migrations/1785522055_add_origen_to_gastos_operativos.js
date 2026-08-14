/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("gastos_operativos");

    try {
      collection.fields.getByName("origen");
    } catch (_) {
      collection.fields.add(new TextField({ name: "origen", required: false }));
    }

    try {
      collection.fields.getByName("id_origen");
    } catch (_) {
      collection.fields.add(new TextField({ name: "id_origen", required: false }));
    }

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("gastos_operativos");
    try { collection.fields.removeByName("origen"); } catch (_) {}
    try { collection.fields.removeByName("id_origen"); } catch (_) {}
    app.save(collection);
  }
);
