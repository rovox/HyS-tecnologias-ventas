"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.totalStock = exports.STOCK_TIPOS = exports.PRODUCT_TIPOS = void 0;
exports.stockBySede = stockBySede;
exports.isLowStock = isLowStock;
exports.stockMovementError = stockMovementError;
exports.movementsForDelivery = movementsForDelivery;
exports.materialCost = materialCost;
exports.PRODUCT_TIPOS = ['equipo', 'material', 'servicio'];
exports.STOCK_TIPOS = ['entrada', 'salida_proyecto', 'transferencia', 'ajuste'];
const round = (value) => Math.round(value * 100) / 100;
function stockBySede(movements) {
    const stock = {};
    for (const m of movements) {
        const qty = Number(m.cantidad);
        if (m.sucursalDestinoId)
            stock[m.sucursalDestinoId] = round((stock[m.sucursalDestinoId] ?? 0) + qty);
        if (m.sucursalOrigenId)
            stock[m.sucursalOrigenId] = round((stock[m.sucursalOrigenId] ?? 0) - qty);
    }
    return stock;
}
const totalStock = (stock) => round(Object.values(stock).reduce((s, q) => s + q, 0));
exports.totalStock = totalStock;
function isLowStock(product, total) {
    return product.tipo !== 'servicio' && product.active !== false && Number(product.stockMinimo) > 0 && total <= Number(product.stockMinimo);
}
function stockMovementError(input, ctx) {
    if (!exports.STOCK_TIPOS.includes(input.tipo))
        return `Tipo de movimiento no válido: ${input.tipo}`;
    if (ctx.productTipo === 'servicio')
        return 'Un servicio no tiene stock';
    if (!(Number(input.cantidad) > 0))
        return 'La cantidad debe ser mayor a 0';
    const from = input.sucursalOrigenId;
    const to = input.sucursalDestinoId;
    if (input.tipo === 'entrada' && (!to || from))
        return 'Una entrada necesita solo la sucursal de destino';
    if (input.tipo === 'salida_proyecto' && (!from || to || !input.projectId))
        return 'Una salida a proyecto necesita la sucursal de origen y el proyecto';
    if (input.tipo === 'transferencia' && (!from || !to))
        return 'Una transferencia necesita sucursal de origen y de destino';
    if (input.tipo === 'transferencia' && from === to)
        return 'La sucursal de origen y destino deben ser distintas';
    if (input.tipo === 'ajuste') {
        if (!ctx.canAdjust)
            return 'Solo Gerencia o Contabilidad ajustan el inventario';
        if (Boolean(from) === Boolean(to))
            return 'Un ajuste es un sobrante (destino) o un faltante (origen)';
        if (!input.motivo?.trim())
            return 'Indica el motivo del ajuste';
    }
    if (from && Number(input.cantidad) > ctx.available)
        return `Stock insuficiente: hay ${round(ctx.available)} disponible(s)`;
    return null;
}
function movementsForDelivery(pedido, items) {
    const withProduct = items.filter((i) => i.productoId);
    if (!withProduct.length)
        return [];
    if (!pedido.sucursalOrigenId)
        return 'Indica la sucursal de origen del material';
    if (pedido.forJob && !pedido.projectId)
        return 'El trabajo no es de un proyecto: su material no se descuenta del inventario (quita el producto o usa texto libre)';
    if (!pedido.projectId && !pedido.sucursalDestinoId)
        return 'Indica el trabajo de un proyecto o la sucursal de destino';
    if (!pedido.projectId && pedido.sucursalDestinoId === pedido.sucursalOrigenId)
        return 'La sucursal de origen y destino deben ser distintas';
    return withProduct.map((i) => ({
        productoId: i.productoId,
        tipo: pedido.projectId ? 'salida_proyecto' : 'transferencia',
        cantidad: Number(i.cantidad),
        sucursalOrigenId: pedido.sucursalOrigenId,
        sucursalDestinoId: pedido.projectId ? null : (pedido.sucursalDestinoId ?? null),
        projectId: pedido.projectId ?? null,
    }));
}
function materialCost(movements) {
    return round(movements.filter((m) => m.tipo === 'salida_proyecto').reduce((s, m) => s + Number(m.cantidad) * Number(m.costoUnitario), 0));
}
//# sourceMappingURL=inventory.rules.js.map