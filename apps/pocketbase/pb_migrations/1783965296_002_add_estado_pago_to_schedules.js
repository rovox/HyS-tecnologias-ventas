/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("schedules");

  const existing = collection.fields.getByName("estado_pago");
  if (existing) {
    if (existing.type === "select") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("estado_pago"); // exists with wrong type, remove first
  }

  collection.fields.add(new SelectField({
    name: "estado_pago",
    required: false,
    values: ["Pendiente", "Saldo pendiente", "Pagado"]
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("schedules");
    collection.fields.removeByName("estado_pago");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})