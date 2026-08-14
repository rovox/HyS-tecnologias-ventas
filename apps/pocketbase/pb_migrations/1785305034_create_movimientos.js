/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    try { app.findCollectionByNameOrId("movimientos"); return; } catch (_) {}

    const col = new Collection({
      type: "base",
      name: "movimientos",
      listRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora' || @request.auth.role = 'VENTAS / ADMINISTRACIÓN'",
      viewRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora' || @request.auth.role = 'VENTAS / ADMINISTRACIÓN'",
      createRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
      updateRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora'",
      deleteRule: "@request.auth.role = 'ADMINISTRADOR'",
      fields: [
        { name: "tipo", type: "select", required: true, maxSelect: 1, values: ["ingreso", "egreso", "pago_proveedor", "cobro", "ajuste", "transferencia"] },
        { name: "categoria", type: "text" },
        { name: "descripcion", type: "text", required: true },
        { name: "fecha", type: "date", required: true },
        { name: "sucursal", type: "text" },
        { name: "caja_banco_id", type: "text" },
        { name: "caja_banco_nombre", type: "text" },
        { name: "caja_banco_destino_id", type: "text" },
        { name: "caja_banco_destino_nombre", type: "text" },
        { name: "medio_pago", type: "select", maxSelect: 1, values: ["Efectivo", "QR", "Transferencia", "Tarjeta", "Cheque", "Otro"] },
        { name: "monto", type: "number", required: true },
        { name: "cliente_id", type: "text" },
        { name: "cliente_nombre", type: "text" },
        { name: "proveedor_id", type: "text" },
        { name: "proveedor_nombre", type: "text" },
        { name: "trabajo_id", type: "text" },
        { name: "estado", type: "select", maxSelect: 1, values: ["pendiente", "confirmado", "anulado"] },
        { name: "observacion", type: "text" },
        { name: "comprobante", type: "file", maxSelect: 1, maxSize: 10485760, mimeTypes: ["image/jpeg","image/png","image/webp","application/pdf"] },
        { name: "created_by", type: "text", required: true },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true }
      ],
      indexes: [
        "CREATE INDEX idx_movimientos_fecha ON movimientos (fecha)",
        "CREATE INDEX idx_movimientos_tipo ON movimientos (tipo)"
      ]
    });
    app.save(col);
  },
  (app) => {
    try { app.delete(app.findCollectionByNameOrId("movimientos")); } catch (_) {}
  }
);
