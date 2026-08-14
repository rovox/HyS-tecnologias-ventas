/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // ── materiales_trabajo ────────────────────────────────────────────────
    try {
      app.findCollectionByNameOrId("materiales_trabajo");
    } catch (_) {
      const c = new Collection({
        type: "base",
        name: "materiales_trabajo",
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora' || created_by = @request.auth.id",
        deleteRule: "@request.auth.role = 'ADMINISTRADOR'",
        fields: [
          { name: "trabajo_id", type: "text" },
          { name: "cliente_id", type: "text" },
          { name: "cliente_nombre", type: "text" },
          { name: "sucursal_trabajo", type: "text" },
          { name: "sucursal_origen", type: "text" },
          { name: "tecnico_id", type: "text" },
          { name: "tecnico_nombre", type: "text" },
          { name: "material_nombre", type: "text", required: true },
          { name: "cantidad", type: "number" },
          { name: "unidad", type: "text" },
          { name: "costo_unitario", type: "number" },
          { name: "costo_total", type: "number" },
          { name: "fecha", type: "date", required: true },
          { name: "observacion", type: "text" },
          { name: "registrado_por_id", type: "text" },
          { name: "registrado_por_nombre", type: "text" },
          { name: "estado", type: "select", maxSelect: 1, values: ["pendiente", "validado", "anulado"] },
          { name: "created_by", type: "text", required: true },
          { name: "created", type: "autodate", onCreate: true },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: ["CREATE INDEX idx_materiales_trabajo_trabajo_id ON materiales_trabajo (trabajo_id)"],
      });
      app.save(c);
    }

    // ── equipos_instalados ────────────────────────────────────────────────
    try {
      app.findCollectionByNameOrId("equipos_instalados");
    } catch (_) {
      const c = new Collection({
        type: "base",
        name: "equipos_instalados",
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora' || created_by = @request.auth.id",
        deleteRule: "@request.auth.role = 'ADMINISTRADOR'",
        fields: [
          { name: "equipo_nombre", type: "text", required: true },
          { name: "marca_modelo", type: "text" },
          { name: "numero_serie", type: "text" },
          { name: "cantidad", type: "number" },
          { name: "costo_unitario", type: "number" },
          { name: "costo_total", type: "number" },
          { name: "trabajo_id", type: "text" },
          { name: "cliente_nombre", type: "text" },
          { name: "sucursal_origen", type: "text" },
          { name: "tecnico_id", type: "text" },
          { name: "tecnico_nombre", type: "text" },
          { name: "fecha", type: "date", required: true },
          { name: "estado", type: "select", maxSelect: 1, values: ["instalado", "devuelto", "dañado", "pendiente"] },
          { name: "observacion", type: "text" },
          { name: "created_by", type: "text", required: true },
          { name: "created", type: "autodate", onCreate: true },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: ["CREATE INDEX idx_equipos_instalados_trabajo_id ON equipos_instalados (trabajo_id)"],
      });
      app.save(c);
    }

    // ── gastos_directos ───────────────────────────────────────────────────
    try {
      app.findCollectionByNameOrId("gastos_directos");
    } catch (_) {
      const c = new Collection({
        type: "base",
        name: "gastos_directos",
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora' || created_by = @request.auth.id",
        deleteRule: "@request.auth.role = 'ADMINISTRADOR'",
        fields: [
          { name: "tipo", type: "select", maxSelect: 1, values: ["combustible", "pasajes", "viáticos", "compra urgente", "mano de obra externa", "herramientas menores", "otros"] },
          { name: "descripcion", type: "text", required: true },
          { name: "monto", type: "number", required: true },
          { name: "trabajo_id", type: "text" },
          { name: "cliente_nombre", type: "text" },
          { name: "sucursal", type: "text" },
          { name: "persona_id", type: "text" },
          { name: "persona_nombre", type: "text" },
          { name: "fecha", type: "date", required: true },
          { name: "comprobante", type: "file", maxSelect: 1, maxSize: 10485760 },
          { name: "estado", type: "select", maxSelect: 1, values: ["pendiente", "validado", "anulado"] },
          { name: "observacion", type: "text" },
          { name: "created_by", type: "text", required: true },
          { name: "created", type: "autodate", onCreate: true },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: ["CREATE INDEX idx_gastos_directos_trabajo_id ON gastos_directos (trabajo_id)"],
      });
      app.save(c);
    }

    // ── sobrantes_devoluciones ────────────────────────────────────────────
    try {
      app.findCollectionByNameOrId("sobrantes_devoluciones");
    } catch (_) {
      const c = new Collection({
        type: "base",
        name: "sobrantes_devoluciones",
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.role = 'ADMINISTRADOR' || @request.auth.role = 'Contadora' || created_by = @request.auth.id",
        deleteRule: "@request.auth.role = 'ADMINISTRADOR'",
        fields: [
          { name: "trabajo_id", type: "text" },
          { name: "cliente_nombre", type: "text" },
          { name: "material_nombre", type: "text", required: true },
          { name: "cantidad_devuelta", type: "number" },
          { name: "unidad", type: "text" },
          { name: "sucursal_destino", type: "text" },
          { name: "tecnico_id", type: "text" },
          { name: "tecnico_nombre", type: "text" },
          { name: "fecha", type: "date", required: true },
          { name: "observacion", type: "text" },
          { name: "created_by", type: "text", required: true },
          { name: "created", type: "autodate", onCreate: true },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(c);
    }
  },
  (app) => {
    for (const name of ["sobrantes_devoluciones", "gastos_directos", "equipos_instalados", "materiales_trabajo"]) {
      try { app.delete(app.findCollectionByNameOrId(name)); } catch (_) {}
    }
  }
);
