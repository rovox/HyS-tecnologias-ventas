/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = new Collection({
      type: "base",
      name: "visitas_tecnicas",
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.role = 'ADMINISTRADOR'",
      fields: [
        { name: "cliente_id", type: "text", required: false },
        { name: "cliente_nombre", type: "text", required: false },
        {
          name: "tipo_visita",
          type: "select",
          required: true,
          maxSelect: 1,
          values: ["Relevamiento", "Asistencia"],
        },
        { name: "sucursal_id", type: "text", required: false },
        { name: "sucursal_nombre", type: "text", required: false },
        { name: "lugar", type: "text", required: false },
        { name: "google_maps_link", type: "text", required: false },
        { name: "tecnico_id", type: "text", required: false },
        { name: "tecnico_nombre", type: "text", required: false },
        { name: "fecha", type: "date", required: true },
        { name: "hora", type: "text", required: false },
        {
          name: "prioridad",
          type: "select",
          required: false,
          maxSelect: 1,
          values: ["baja", "media", "alta", "urgente"],
        },
        {
          name: "estado",
          type: "select",
          required: false,
          maxSelect: 1,
          values: ["programado", "en_camino", "en_atencion", "resuelto", "pendiente", "cancelado"],
        },
        // Asistencia fields
        { name: "motivo", type: "text", required: false },
        { name: "problema_reportado", type: "text", required: false },
        { name: "equipo_afectado", type: "text", required: false },
        { name: "causa_probable", type: "text", required: false },
        { name: "diagnostico", type: "text", required: false },
        { name: "solucion", type: "text", required: false },
        { name: "requiere_material", type: "bool" },
        { name: "requiere_volver", type: "bool" },
        // Relevamiento fields
        { name: "necesidad_cliente", type: "text", required: false },
        { name: "area_revisar", type: "text", required: false },
        { name: "medidas_puntos", type: "text", required: false },
        { name: "cantidad_estimada", type: "number", required: false },
        { name: "observacion_tecnica", type: "text", required: false },
        { name: "requiere_cotizacion", type: "bool" },
        // Common
        { name: "observacion_final", type: "text", required: false },
        {
          name: "fotografias",
          type: "file",
          maxSelect: 10,
          maxSize: 20971520,
          mimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
        },
        { name: "created_by", type: "text", required: false },
        { name: "updated_by", type: "text", required: false },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    });
    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("visitas_tecnicas");
    app.delete(collection);
  },
);
