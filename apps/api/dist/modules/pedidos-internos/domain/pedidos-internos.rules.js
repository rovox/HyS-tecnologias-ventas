"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PEDIDO_ESTADOS = void 0;
exports.nextStates = nextStates;
exports.checkTransition = checkTransition;
exports.itemTotal = itemTotal;
exports.pedidoTotal = pedidoTotal;
exports.deliveryFields = deliveryFields;
exports.deleteError = deleteError;
exports.transitionNeedsReason = transitionNeedsReason;
const PEDIDO_FLOW = {
    solicitado: ['aprobado', 'rechazado', 'cancelado'],
    aprobado: ['en_preparación', 'cancelado'],
    en_preparación: ['listo_para_entrega', 'cancelado'],
    listo_para_entrega: ['entregado'],
    entregado: [],
    rechazado: [],
    cancelado: [],
};
exports.PEDIDO_ESTADOS = Object.keys(PEDIDO_FLOW);
function nextStates(estado) {
    return PEDIDO_FLOW[estado] ?? [];
}
function checkTransition(from, to) {
    if (!(to in PEDIDO_FLOW))
        return { ok: false, reason: `Estado desconocido: ${to}` };
    if (!nextStates(from).includes(to))
        return { ok: false, reason: `Transición no permitida: ${from} → ${to}` };
    return { ok: true };
}
function itemTotal(item) {
    return Math.round(item.cantidad * (item.costoUnitario ?? 0) * 100) / 100;
}
function pedidoTotal(items) {
    return Math.round(items.reduce((sum, item) => sum + itemTotal(item) * 100, 0)) / 100;
}
function deliveryFields(estado, input, actorId, now) {
    if (estado !== 'entregado')
        return {};
    return {
        fechaEntregaReal: input.fechaEntrega ? new Date(input.fechaEntrega) : now,
        entregadoPorId: input.entregadoPorId || actorId,
    };
}
function deleteError(estado) {
    return estado === 'entregado' ? 'Un pedido entregado no se elimina: ya movió stock' : null;
}
function transitionNeedsReason(to) {
    return to === 'rechazado' || to === 'cancelado';
}
//# sourceMappingURL=pedidos-internos.rules.js.map