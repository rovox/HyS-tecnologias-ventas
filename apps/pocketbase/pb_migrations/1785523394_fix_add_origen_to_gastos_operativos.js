/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("gastos_operativos");

    const hasOrigen = collection.fields.getByName("origen") !== null;
    const hasIdOrigen = collection.fields.getByName("id_origen") !== null;

    if (!hasOrigen) {
      collection.fields.add(new TextField({ name: "origen", required: false }));
    }
    if (!hasIdOrigen) {
      collection.fields.add(new TextField({ name: "id_origen", required: false }));
    }

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("gastos_operativos");
    const origen = collection.fields.getByName("origen");
    const idOrigen = collection.fields.getByName("id_origen");
    if (origen) collection.fields.remove(origen);
    if (idOrigen) collection.fields.remove(idOrigen);
    app.save(collection);
  }
);
