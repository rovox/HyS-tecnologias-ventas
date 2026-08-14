/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId("gastos_operativos");
    col.updateRule = "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'VENTAS / ADMINISTRACIÓN' || @request.auth.role = 'Contadora' || created_by = @request.auth.id";
    app.save(col);
  },
  (app) => {
    const col = app.findCollectionByNameOrId("gastos_operativos");
    col.updateRule = "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora' || created_by = @request.auth.id";
    app.save(col);
  }
);
