"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saleNumber = exports.PAYMENT_METHODS = void 0;
exports.saleTotals = saleTotals;
exports.saleError = saleError;
exports.canSellFromBranch = canSellFromBranch;
exports.boxForPayment = boxForPayment;
exports.annulError = annulError;
const CENTRAL_SUCURSAL_ID = 'suc_central';
exports.PAYMENT_METHODS = ['efectivo', 'qr', 'transferencia'];
const cents = (value) => Math.round(value * 100) / 100;
function saleTotals(lines, descuentoVenta = 0) {
    const items = lines.map((l) => ({ ...l, descuento: cents(l.descuento ?? 0), subtotal: cents(l.cantidad * l.precioUnitario - (l.descuento ?? 0)) }));
    const subtotal = cents(items.reduce((sum, l) => sum + l.subtotal, 0));
    return { items, subtotal, descuento: cents(descuentoVenta), total: cents(subtotal - descuentoVenta) };
}
function saleError(lines, descuentoVenta, pagos, available) {
    if (!lines.length)
        return 'Agrega al menos un producto';
    for (const l of lines) {
        if (!(l.cantidad > 0))
            return 'La cantidad debe ser mayor a 0';
        if (l.precioUnitario < 0)
            return 'El precio no puede ser negativo';
        if ((l.descuento ?? 0) < 0 || (l.descuento ?? 0) > l.cantidad * l.precioUnitario)
            return 'El descuento de una línea no puede ser mayor a su importe';
    }
    const needed = new Map();
    for (const l of lines)
        needed.set(l.productoId, (needed.get(l.productoId) ?? 0) + l.cantidad);
    for (const [id, qty] of needed)
        if ((available[id] ?? 0) < qty)
            return `Stock insuficiente en la sucursal: hay ${available[id] ?? 0}`;
    const { subtotal, total } = saleTotals(lines, descuentoVenta);
    if (descuentoVenta < 0 || descuentoVenta > subtotal)
        return 'El descuento no puede ser mayor al subtotal';
    if (!pagos.length && total > 0)
        return 'Indica cómo se pagó';
    for (const p of pagos) {
        if (!exports.PAYMENT_METHODS.includes(p.medio))
            return 'Medio de pago no válido';
        if (!(p.monto > 0))
            return 'Cada pago debe ser mayor a 0';
    }
    const paid = cents(pagos.reduce((sum, p) => sum + p.monto, 0));
    if (paid !== total)
        return `Los pagos (Bs ${paid.toFixed(2)}) no suman el total (Bs ${total.toFixed(2)})`;
    return null;
}
function canSellFromBranch(actor, sucursalId) {
    if (actor.manager)
        return true;
    return actor.seller && (sucursalId === actor.sucursalId || sucursalId === CENTRAL_SUCURSAL_ID);
}
function boxForPayment(medio, sucursalId, boxes) {
    const active = boxes.filter((b) => b.active);
    if (medio === 'efectivo')
        return active.find((b) => b.sucursalId === sucursalId && ['caja', 'caja_chica'].includes(b.tipo))?.id ?? null;
    const tipo = medio === 'qr' ? 'qr' : medio === 'transferencia' ? 'banco' : null;
    if (!tipo)
        return null;
    const byId = active.filter((b) => b.tipo === tipo).sort((a, b) => a.id.localeCompare(b.id));
    return (byId.find((b) => b.sucursalId === sucursalId) ?? byId[0])?.id ?? null;
}
const saleNumber = (numero) => `NV-${String(numero).padStart(4, '0')}`;
exports.saleNumber = saleNumber;
function annulError(sale, motivo) {
    if (sale.estado === 'anulada')
        return 'La venta ya está anulada';
    if (!motivo?.trim())
        return 'Indica el motivo de la anulación';
    return null;
}
//# sourceMappingURL=direct-sales.rules.js.map