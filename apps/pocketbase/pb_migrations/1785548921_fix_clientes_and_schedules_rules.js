/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // Fix clientes: allow all authenticated users to create/list/view clients
    const clientes = app.findCollectionByNameOrId("clientes");
    clientes.listRule = "@request.auth.id != ''";
    clientes.viewRule = "@request.auth.id != ''";
    clientes.createRule = "@request.auth.id != ''";
    clientes.updateRule = "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'VENTAS / ADMINISTRACIÓN' || @request.auth.role = 'Contadora' || created_by = @request.auth.id";
    clientes.deleteRule = "@request.auth.role = 'ADMINISTRADOR'";
    app.save(clientes);

    // Fix schedules: all authenticated can create/list/view/update; only admin deletes
    const schedules = app.findCollectionByNameOrId("schedules");
    schedules.listRule = "@request.auth.id != ''";
    schedules.viewRule = "@request.auth.id != ''";
    schedules.createRule = "@request.auth.id != ''";
    schedules.updateRule = "@request.auth.id != ''";
    schedules.deleteRule = "@request.auth.role = 'ADMINISTRADOR'";
    app.save(schedules);

    // Fix schedule_payments: all authenticated can create/list/view; Admin/Ventas/Contadora can update
    const sp = app.findCollectionByNameOrId("schedule_payments");
    sp.listRule = "@request.auth.id != ''";
    sp.viewRule = "@request.auth.id != ''";
    sp.createRule = "@request.auth.id != ''";
    sp.updateRule = "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'VENTAS / ADMINISTRACIÓN' || @request.auth.role = 'Contadora' || usuario_id = @request.auth.id";
    sp.deleteRule = "@request.auth.role = 'ADMINISTRADOR'";
    app.save(sp);

    // Fix movimientos: all authenticated can list/view/create; Admin/Ventas/Contadora update; Admin delete
    try {
      const mov = app.findCollectionByNameOrId("movimientos");
      mov.listRule = "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'VENTAS / ADMINISTRACIÓN' || @request.auth.role = 'Contadora'";
      mov.viewRule = "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'VENTAS / ADMINISTRACIÓN' || @request.auth.role = 'Contadora'";
      mov.createRule = "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'VENTAS / ADMINISTRACIÓN' || @request.auth.role = 'Contadora'";
      mov.updateRule = "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'VENTAS / ADMINISTRACIÓN' || @request.auth.role = 'Contadora'";
      mov.deleteRule = "@request.auth.role = 'ADMINISTRADOR'";
      app.save(mov);
    } catch(e) {
      console.log("movimientos collection not found, skipping:", e.message);
    }
  },
  (app) => {
    // Revert clientes to previous (role-restricted) rule
    const clientes = app.findCollectionByNameOrId("clientes");
    clientes.listRule = "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'VENTAS / ADMINISTRACIÓN' || @request.auth.role = 'Contadora'";
    clientes.viewRule = "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'VENTAS / ADMINISTRACIÓN' || @request.auth.role = 'Contadora'";
    clientes.createRule = "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'VENTAS / ADMINISTRACIÓN' || @request.auth.role = 'Contadora'";
    clientes.updateRule = "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'VENTAS / ADMINISTRACIÓN' || @request.auth.role = 'Contadora'";
    clientes.deleteRule = "@request.auth.role = 'ADMINISTRADOR'";
    app.save(clientes);
  }
);
