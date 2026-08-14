/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pedidos_internos");
  collection.indexes.push("CREATE UNIQUE INDEX idx_pedidos_internos_numero_pedido ON pedidos_internos (numero_pedido)");
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("pedidos_internos");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_pedidos_internos_numero_pedido"));
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})