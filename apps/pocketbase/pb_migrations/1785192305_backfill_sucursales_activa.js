/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    let records;
    try {
      records = app.findRecordsByFilter('sucursales', "activa = false || activa = ''");
    } catch (e) {
      records = [];
    }
    for (const record of records) {
      record.set('activa', true);
      app.save(record);
    }
  },
  (app) => {
    // No-op: previous activa values were not tracked, so this cannot be
    // meaningfully reverted.
  },
);
