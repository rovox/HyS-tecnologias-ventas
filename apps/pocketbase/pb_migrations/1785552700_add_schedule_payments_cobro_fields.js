/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const sp = app.findCollectionByNameOrId("schedule_payments");
    const add = (name) => {
      if (!sp.fields.getByName(name)) {
        sp.fields.add(new TextField({ name: name, required: false }));
      }
    };
    ["tipo", "estado_rendicion", "estado", "cliente_nombre", "sucursal",
     "caja_banco_id", "caja_banco_nombre", "origen", "id_origen",
     "observacion_rendicion"].forEach(add);

    // usuario_id must not block cobro creation
    const usuario = sp.fields.getByName("usuario_id");
    if (usuario) {
      usuario.required = false;
    }
    app.save(sp);
  },
  (app) => {
    const sp = app.findCollectionByNameOrId("schedule_payments");
    ["tipo", "estado_rendicion", "estado", "cliente_nombre", "sucursal",
     "caja_banco_id", "caja_banco_nombre", "origen", "id_origen",
     "observacion_rendicion"].forEach((n) => sp.fields.removeByName(n));
    app.save(sp);
  }
);
