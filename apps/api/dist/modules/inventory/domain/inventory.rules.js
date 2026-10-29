"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.totalStock = exports.STOCK_TIPOS = exports.PRODUCT_TIPOS = void 0;
exports.stockBySede = stockBySede;
exports.isLowStock = isLowStock;
exports.stockMovementError = stockMovementError;
exports.movementsForDelivery = movementsForDelivery;
exports.materialCost = materialCost;
exports.newProductStockError = newProductStockError;
exports.branchMoveError = branchMoveError;
exports.kardex = kardex;
exports.PRODUCT_TIPOS = ['equipo', 'material', 'servicio'];
exports.STOCK_TIPOS = ['entrada', 'salida_proyecto', 'transferencia', 'ajuste', 'baja'];
const CENTRAL = 'suc_central';
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
    if (input.tipo === 'baja' && (!from || to))
        return 'Quitar material necesita la sucursal de la que sale';
    if (input.tipo === 'baja' && !input.motivo?.trim())
        return 'Indica por qué se quita el material (dañado, perdido, uso interno…)';
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
function newProductStockError(tipo, stockInicial) {
    if (tipo === 'servicio')
        return stockInicial ? 'Un servicio no tiene stock' : null;
    if (!stockInicial)
        return 'Un producto se da de alta con su primera entrada: cantidad, costo y sucursal';
    if (!(stockInicial.cantidad > 0))
        return 'La cantidad de la primera entrada debe ser mayor a 0';
    if (!(stockInicial.costoUnitario > 0))
        return 'Indica el costo unitario de la primera entrada';
    return null;
}
function branchMoveError(input, actor) {
    if (actor.manager)
        return null;
    const own = actor.sucursalId;
    if (input.tipo === 'entrada' && input.sucursalDestinoId !== CENTRAL)
        return 'Las compras entran a Central: desde ahí se abastece a las sucursales';
    if (['transferencia', 'salida_proyecto'].includes(input.tipo) && input.sucursalOrigenId !== own && input.sucursalOrigenId !== CENTRAL)
        return 'Mueves material desde tu sucursal o desde Central';
    if (input.tipo === 'baja' && input.sucursalOrigenId !== own)
        return 'Quitas material solo de tu sucursal';
    return null;
}
function kardex(movements, sucursalId) {
    let saldo = 0;
    return [...movements]
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
        .map((m) => {
        const qty = Number(m.cantidad);
        const entra = sucursalId ? (m.sucursalDestinoId === sucursalId ? qty : 0) : m.sucursalDestinoId && !m.sucursalOrigenId ? qty : 0;
        const sale = sucursalId ? (m.sucursalOrigenId === sucursalId ? qty : 0) : m.sucursalOrigenId && !m.sucursalDestinoId ? qty : 0;
        return { movement: m, entra, sale, delta: round(entra - sale) };
    })
        .filter((row) => row.entra || row.sale)
        .map((row) => {
        saldo = round(saldo + row.delta);
        return { ...row.movement, entra: row.entra, sale: row.sale, saldo };
    });
}
//# sourceMappingURL=inventory.rules.js.map