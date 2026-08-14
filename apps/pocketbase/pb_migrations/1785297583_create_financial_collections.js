/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // 1. cajas_bancos
    try { app.findCollectionByNameOrId("cajas_bancos"); } catch (_) {
      const col = new Collection({
        type: "base",
        name: "cajas_bancos",
        listRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
        viewRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
        createRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
        updateRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
        deleteRule: "@request.auth.role = 'ADMINISTRADOR'",
        fields: [
          { name: "nombre", type: "text", required: true },
          { name: "tipo", type: "select", maxSelect: 1, values: ["Caja", "Banco", "QR", "Digital"] },
          { name: "sucursal", type: "text" },
          { name: "saldo_inicial", type: "number" },
          { name: "activo", type: "bool" },
          { name: "descripcion", type: "text" },
          { name: "created_by", type: "text" },
          { name: "updated_by", type: "text" },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true }
        ]
      });
      app.save(col);
    }

    // 2. proveedores
    try { app.findCollectionByNameOrId("proveedores"); } catch (_) {
      const col = new Collection({
        type: "base",
        name: "proveedores",
        listRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
        viewRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
        createRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
        updateRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
        deleteRule: "@request.auth.role = 'ADMINISTRADOR'",
        fields: [
          { name: "nombre", type: "text", required: true },
          { name: "telefono", type: "text" },
          { name: "nit", type: "text" },
          { name: "direccion", type: "text" },
          { name: "observacion", type: "text" },
          { name: "activo", type: "bool" },
          { name: "created_by", type: "text" },
          { name: "updated_by", type: "text" },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true }
        ]
      });
      app.save(col);
    }

    // 3. compras_proveedores
    try { app.findCollectionByNameOrId("compras_proveedores"); } catch (_) {
      const col = new Collection({
        type: "base",
        name: "compras_proveedores",
        listRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
        viewRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
        createRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
        updateRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
        deleteRule: "@request.auth.role = 'ADMINISTRADOR'",
        fields: [
          { name: "proveedor_id", type: "text", required: true },
          { name: "proveedor_nombre", type: "text" },
          { name: "concepto", type: "text", required: true },
          { name: "monto", type: "number", required: true },
          { name: "fecha", type: "date", required: true },
          { name: "estado_pago", type: "select", maxSelect: 1, values: ["Pendiente", "Parcial", "Pagado"] },
          { name: "monto_pagado", type: "number" },
          { name: "sucursal", type: "text" },
          { name: "observacion", type: "text" },
          { name: "comprobante", type: "file", maxSelect: 1, maxSize: 10485760, mimeTypes: ["image/jpeg","image/png","image/gif","image/webp","application/pdf"] },
          { name: "created_by", type: "text", required: true },
          { name: "updated_by", type: "text" },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true }
        ]
      });
      app.save(col);
    }

    // 4. facturas_control
    try { app.findCollectionByNameOrId("facturas_control"); } catch (_) {
      const col = new Collection({
        type: "base",
        name: "facturas_control",
        listRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
        viewRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
        createRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
        updateRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
        deleteRule: "@request.auth.role = 'ADMINISTRADOR'",
        fields: [
          { name: "trabajo_id", type: "text" },
          { name: "cliente_nombre", type: "text" },
          { name: "tiene_factura", type: "select", maxSelect: 1, values: ["Sí", "No", "Pendiente"] },
          { name: "numero_factura", type: "text" },
          { name: "fecha_factura", type: "date" },
          { name: "monto_facturado", type: "number" },
          { name: "debito_fiscal", type: "number" },
          { name: "observacion", type: "text" },
          { name: "created_by", type: "text", required: true },
          { name: "updated_by", type: "text" },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true }
        ]
      });
      app.save(col);
    }

    // 5. anulaciones_financieras
    try { app.findCollectionByNameOrId("anulaciones_financieras"); } catch (_) {
      const col = new Collection({
        type: "base",
        name: "anulaciones_financieras",
        listRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
        viewRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
        createRule: "@request.auth.role = 'ADMINISTRADOR'",
        updateRule: null,
        deleteRule: null,
        fields: [
          { name: "coleccion", type: "text", required: true },
          { name: "registro_id", type: "text", required: true },
          { name: "motivo", type: "text", required: true },
          { name: "valor_anterior", type: "text" },
          { name: "anulado_por_id", type: "text", required: true },
          { name: "anulado_por_nombre", type: "text" },
          { name: "created_by", type: "text", required: true },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true }
        ]
      });
      app.save(col);
    }
  },
  (app) => {
    for (const name of ["cajas_bancos", "proveedores", "compras_proveedores", "facturas_control", "anulaciones_financieras"]) {
      try { app.delete(app.findCollectionByNameOrId(name)); } catch (_) {}
    }
  }
);
