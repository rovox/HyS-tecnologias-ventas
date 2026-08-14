/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId("schedule_payments");
    // Allow Admin + VENTAS / ADMINISTRACIÓN + Contadora to list/view/update all payments
    col.listRule = "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'VENTAS / ADMINISTRACIÓN' || @request.auth.role = 'Contadora'";
    col.viewRule = "@request.auth.id != ''";
    col.createRule = "@request.auth.id != ''";
    col.updateRule = "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'VENTAS / ADMINISTRACIÓN' || @request.auth.role = 'Contadora' || usuario_id = @request.auth.id";
    col.deleteRule = "@request.auth.role = 'ADMINISTRADOR'";
    app.save(col);
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId("schedule_payments");
      col.listRule = "@request.auth.role = 'ADMINISTRADOR'";
      col.viewRule = "usuario_id = @request.auth.id || @request.auth.role = 'ADMINISTRADOR'";
      col.createRule = "@request.auth.id != ''";
      col.updateRule = "@request.auth.role = 'ADMINISTRADOR'";
      col.deleteRule = "@request.auth.role = 'ADMINISTRADOR'";
      app.save(col);
    } catch (e) {
      if (e.message.includes("no rows in result set")) return;
      throw e;
    }
  }
);
