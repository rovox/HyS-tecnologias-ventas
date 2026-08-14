/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("schedules");
    collection.createRule =
      "@request.auth.id != '' && (@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'VENTAS / ADMINISTRACIÓN' || @request.auth.role = 'SEGURIDAD ELECTRÓNICA' || @request.auth.role = 'Contadora')";
    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("schedules");
    collection.createRule =
      "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'VENTAS / ADMINISTRACIÓN'";
    app.save(collection);
  },
);
