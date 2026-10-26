"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextStates = nextStates;
exports.checkQuotationTransition = checkQuotationTransition;
exports.acceptError = acceptError;
exports.expiresAt = expiresAt;
exports.expiryCutoff = expiryCutoff;
exports.isExpired = isExpired;
exports.deleteError = deleteError;
exports.restoreError = restoreError;
exports.editError = editError;
exports.vistaFilter = vistaFilter;
const VALIDITY_DAYS = 15;
const DAY_MS = 24 * 60 * 60 * 1000;
const OPEN_ESTADOS = ['borrador', 'enviado'];
const CLOSED_ESTADOS = ['aprobado', 'rechazado', 'vencido'];
const QUOTATION_ESTADOS = [...OPEN_ESTADOS, ...CLOSED_ESTADOS];
const QUOTATION_FLOW = {
    borrador: ['enviado'],
    enviado: ['aprobado', 'rechazado', 'borrador'],
    rechazado: ['borrador'],
    vencido: ['aprobado', 'borrador'],
    aprobado: [],
};
const isDeleted = (quote) => Boolean(quote.eliminadaAt);
function nextStates(quote) {
    return isDeleted(quote) ? [] : (QUOTATION_FLOW[quote.estado] ?? []);
}
function checkQuotationTransition(quote, to, input = {}) {
    if (isDeleted(quote))
        return { ok: false, reason: 'Restaura la cotización antes de cambiar su estado' };
    if (!QUOTATION_ESTADOS.includes(to))
        return { ok: false, reason: `Estado desconocido: ${to}` };
    if (!nextStates(quote).includes(to))
        return { ok: false, reason: `Transición inválida: ${quote.estado} → ${to}` };
    if (to === 'enviado' && !quote.archivoPdfUrl)
        return { ok: false, reason: 'Adjunta el PDF antes de enviar la cotización' };
    if (to === 'rechazado' && !input.motivo?.trim())
        return { ok: false, reason: 'Indica el motivo del rechazo' };
    return { ok: true };
}
function acceptError(quote) {
    if (isDeleted(quote))
        return 'Restaura la cotización antes de aprobarla';
    if (quote.estado === 'rechazado')
        return 'Una cotización rechazada no se puede aprobar: reábrela primero';
    if (!['enviado', 'vencido', 'aprobado'].includes(quote.estado))
        return 'Solo se aprueba una cotización enviada';
    if (!quote.clienteId)
        return 'Asigna un cliente a la cotización antes de aprobarla';
    return null;
}
function expiresAt(fechaEnvio) {
    return fechaEnvio ? new Date(new Date(fechaEnvio).getTime() + VALIDITY_DAYS * DAY_MS) : null;
}
function expiryCutoff(now) {
    return new Date(now.getTime() - VALIDITY_DAYS * DAY_MS);
}
function isExpired(quote, now) {
    const end = expiresAt(quote.fechaEnvio);
    return quote.estado === 'enviado' && !isDeleted(quote) && end !== null && end < now;
}
function deleteError(quote, motivo) {
    if (isDeleted(quote))
        return 'La cotización ya está eliminada';
    if (quote.estado === 'aprobado')
        return 'Una cotización aprobada no se elimina: cancela su proyecto';
    if (!motivo?.trim())
        return 'Indica el motivo de la eliminación';
    return null;
}
function restoreError(quote) {
    return isDeleted(quote) ? null : 'La cotización no está eliminada';
}
const FIXED_WHEN_APPROVED = ['monto', 'clienteId', 'categoriaId'];
function editError(quote, changes) {
    if (isDeleted(quote))
        return 'Restaura la cotización antes de editarla';
    if (quote.estado === 'aprobado' && FIXED_WHEN_APPROVED.some((key) => changes[key] !== undefined)) {
        return 'En una cotización aprobada el monto, el cliente y la categoría son los del proyecto';
    }
    return null;
}
function vistaFilter(vista) {
    if (vista === 'abiertas')
        return { estados: OPEN_ESTADOS, eliminadas: false };
    if (vista === 'cerradas')
        return { estados: CLOSED_ESTADOS, eliminadas: null };
    return null;
}
//# sourceMappingURL=quotations.rules.js.map