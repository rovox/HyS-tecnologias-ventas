/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // Add rendicion fields to schedule_payments
    const payments = app.findCollectionByNameOrId("schedule_payments");
    if (!payments.fields.getByName("estado_rendicion")) {
      payments.fields.add(new SelectField({
        name: "estado_rendicion",
        maxSelect: 1,
        values: ["Pendiente rendición", "Rendido", "Confirmado", "Observado"]
      }));
    }
    if (!payments.fields.getByName("caja_banco_id")) {
      payments.fields.add(new TextField({ name: "caja_banco_id" }));
    }
    if (!payments.fields.getByName("caja_banco_nombre")) {
      payments.fields.add(new TextField({ name: "caja_banco_nombre" }));
    }
    if (!payments.fields.getByName("observacion_rendicion")) {
      payments.fields.add(new TextField({ name: "observacion_rendicion" }));
    }
    if (!payments.fields.getByName("confirmado_por_id")) {
      payments.fields.add(new TextField({ name: "confirmado_por_id" }));
    }
    if (!payments.fields.getByName("confirmado_por_nombre")) {
      payments.fields.add(new TextField({ name: "confirmado_por_nombre" }));
    }
    app.save(payments);

    // Add factura fields to schedules
    const schedules = app.findCollectionByNameOrId("schedules");
    if (!schedules.fields.getByName("factura_estado")) {
      schedules.fields.add(new SelectField({
        name: "factura_estado",
        maxSelect: 1,
        values: ["Pendiente", "Sí", "No"]
      }));
    }
    if (!schedules.fields.getByName("numero_factura")) {
      schedules.fields.add(new TextField({ name: "numero_factura" }));
    }
    if (!schedules.fields.getByName("monto_facturado")) {
      schedules.fields.add(new NumberField({ name: "monto_facturado" }));
    }
    if (!schedules.fields.getByName("debito_fiscal")) {
      schedules.fields.add(new NumberField({ name: "debito_fiscal" }));
    }
    app.save(schedules);
  },
  (app) => {
    const payments = app.findCollectionByNameOrId("schedule_payments");
    for (const n of ["estado_rendicion", "caja_banco_id", "caja_banco_nombre", "observacion_rendicion", "confirmado_por_id", "confirmado_por_nombre"]) {
      try { payments.fields.removeByName(n); } catch (_) {}
    }
    app.save(payments);

    const schedules = app.findCollectionByNameOrId("schedules");
    for (const n of ["factura_estado", "numero_factura", "monto_facturado", "debito_fiscal"]) {
      try { schedules.fields.removeByName(n); } catch (_) {}
    }
    app.save(schedules);
  }
);
