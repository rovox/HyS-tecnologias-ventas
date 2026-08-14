/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("schedules");
  collection.listRule = "";
  collection.viewRule = "";
  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("schedules");
  collection.listRule = "@request.auth.id != '' || vendedor_responsable_id = @request.auth.id";
  collection.viewRule = "@request.auth.id != '' || vendedor_responsable_id = @request.auth.id";
  app.save(collection);
});
