/// <reference path="../pb_data/types.d.ts" />

// Grant VENTAS / ADMINISTRACIÓN the same access as Contadora on financial collections

const VENTAS = "VENTAS / ADMINISTRACIÓN";
const CONT = "Contadora";
const ADMIN = "ADMINISTRADOR";

const ventasOrContadora = `@request.auth.role = '${ADMIN}' || @request.auth.role = '${VENTAS}' || @request.auth.role = '${CONT}'`;
const adminOnly = `@request.auth.role = '${ADMIN}'`;

migrate(
  (app) => {
    // compras_proveedores
    try {
      const col = app.findCollectionByNameOrId("compras_proveedores");
      col.listRule = ventasOrContadora;
      col.viewRule = ventasOrContadora;
      col.createRule = ventasOrContadora;
      col.updateRule = ventasOrContadora;
      col.deleteRule = adminOnly;
      app.save(col);
    } catch(e) { console.log("compras_proveedores skip:", e.message); }

    // facturas_control
    try {
      const col = app.findCollectionByNameOrId("facturas_control");
      col.listRule = ventasOrContadora;
      col.viewRule = ventasOrContadora;
      col.createRule = ventasOrContadora;
      col.updateRule = ventasOrContadora;
      col.deleteRule = adminOnly;
      app.save(col);
    } catch(e) { console.log("facturas_control skip:", e.message); }

    // costos_trabajo
    try {
      const col = app.findCollectionByNameOrId("costos_trabajo");
      col.listRule = ventasOrContadora;
      col.viewRule = ventasOrContadora;
      col.createRule = ventasOrContadora;
      col.updateRule = ventasOrContadora;
      col.deleteRule = adminOnly;
      app.save(col);
    } catch(e) { console.log("costos_trabajo skip:", e.message); }

    // contabilidad
    try {
      const col = app.findCollectionByNameOrId("contabilidad");
      col.listRule = ventasOrContadora;
      col.viewRule = ventasOrContadora;
      col.createRule = ventasOrContadora;
      col.updateRule = `@request.auth.role = '${ADMIN}' || @request.auth.role = '${VENTAS}' || @request.auth.role = '${CONT}'`;
      col.deleteRule = adminOnly;
      app.save(col);
    } catch(e) { console.log("contabilidad skip:", e.message); }

    // gastos_directos - update rule
    try {
      const col = app.findCollectionByNameOrId("gastos_directos");
      col.updateRule = `@request.auth.role = '${ADMIN}' || @request.auth.role = '${VENTAS}' || @request.auth.role = '${CONT}' || created_by = @request.auth.id`;
      app.save(col);
    } catch(e) { console.log("gastos_directos skip:", e.message); }

    // equipos_instalados - update rule
    try {
      const col = app.findCollectionByNameOrId("equipos_instalados");
      col.updateRule = `@request.auth.role = '${ADMIN}' || @request.auth.role = '${VENTAS}' || @request.auth.role = '${CONT}' || created_by = @request.auth.id`;
      app.save(col);
    } catch(e) { console.log("equipos_instalados skip:", e.message); }

    // proveedores (if exists)
    try {
      const col = app.findCollectionByNameOrId("proveedores");
      col.listRule = ventasOrContadora;
      col.viewRule = ventasOrContadora;
      col.createRule = ventasOrContadora;
      col.updateRule = ventasOrContadora;
      col.deleteRule = adminOnly;
      app.save(col);
    } catch(e) { console.log("proveedores skip:", e.message); }

    // cajas_bancos (if exists)
    try {
      const col = app.findCollectionByNameOrId("cajas_bancos");
      col.listRule = ventasOrContadora;
      col.viewRule = ventasOrContadora;
      col.createRule = ventasOrContadora;
      col.updateRule = ventasOrContadora;
      col.deleteRule = adminOnly;
      app.save(col);
    } catch(e) { console.log("cajas_bancos skip:", e.message); }

    // movimientos (if exists)
    try {
      const col = app.findCollectionByNameOrId("movimientos");
      col.listRule = ventasOrContadora;
      col.viewRule = ventasOrContadora;
      col.createRule = `@request.auth.id != ''`;
      col.updateRule = ventasOrContadora;
      col.deleteRule = adminOnly;
      app.save(col);
    } catch(e) { console.log("movimientos skip:", e.message); }

    // anulaciones_financieras (if exists)
    try {
      const col = app.findCollectionByNameOrId("anulaciones_financieras");
      col.listRule = ventasOrContadora;
      col.viewRule = ventasOrContadora;
      col.createRule = ventasOrContadora;
      col.updateRule = ventasOrContadora;
      col.deleteRule = adminOnly;
      app.save(col);
    } catch(e) { console.log("anulaciones_financieras skip:", e.message); }
  },
  (app) => {
    // Revert — restore Contadora-only rules
    const contOnly = `@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'`;
    const names = ["compras_proveedores","facturas_control","costos_trabajo","contabilidad","proveedores","cajas_bancos","anulaciones_financieras"];
    for (const name of names) {
      try {
        const col = app.findCollectionByNameOrId(name);
        col.listRule = contOnly; col.viewRule = contOnly;
        col.createRule = contOnly; col.updateRule = contOnly;
        col.deleteRule = `@request.auth.role = 'ADMINISTRADOR'`;
        app.save(col);
      } catch(e) {}
    }
  }
);
