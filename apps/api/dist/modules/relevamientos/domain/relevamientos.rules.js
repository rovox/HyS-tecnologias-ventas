"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextVisitStates = nextVisitStates;
exports.checkVisitTransition = checkVisitTransition;
exports.isClosed = isClosed;
exports.warrantyUntil = warrantyUntil;
exports.inWarranty = inWarranty;
exports.visitPayments = visitPayments;
const VISIT_FLOW = {
    programado: ['en_camino', 'en_atencion', 'pendiente', 'cancelado'],
    en_camino: ['en_atencion', 'pendiente', 'cancelado'],
    en_atencion: ['resuelto', 'pendiente', 'cancelado'],
    pendiente: ['programado', 'en_camino', 'en_atencion', 'cancelado'],
    resuelto: [],
    cancelado: [],
};
function nextVisitStates(estado) {
    return VISIT_FLOW[estado] ?? [];
}
function checkVisitTransition(from, to, ctx) {
    if (!(to in VISIT_FLOW))
        return { ok: false, reason: `Estado desconocido: ${to}` };
    if (!nextVisitStates(from).includes(to))
        return { ok: false, reason: `Transición no permitida: ${from} → ${to}` };
    if (to === 'resuelto' && ctx.fotos < 1)
        return { ok: false, reason: 'Sube al menos una foto de evidencia para marcar la visita como resuelta' };
    if (to === 'cancelado' && !ctx.motivo?.trim())
        return { ok: false, reason: 'Indica el motivo de la cancelación' };
    return { ok: true };
}
function isClosed(estado) {
    return estado === 'resuelto' || estado === 'cancelado';
}
const STANDALONE_WARRANTY_MONTHS = 12;
function addMonths(date, months) {
    const d = new Date(date.getTime());
    d.setUTCMonth(d.getUTCMonth() + months);
    return d;
}
function warrantyUntil(job) {
    if (job.project) {
        if (!job.project.entregadoAt)
            return null;
        return addMonths(job.project.entregadoAt, job.project.garantiaMeses);
    }
    if (job.estado !== 'terminado')
        return null;
    return addMonths(job.fechaFinalizacion ?? job.fechaProgramada, STANDALONE_WARRANTY_MONTHS);
}
function inWarranty(garantiaHasta, fecha) {
    if (!garantiaHasta)
        return null;
    return fecha.getTime() <= garantiaHasta.getTime();
}
function visitPayments(movements) {
    const sum = (rows) => Math.round(rows.reduce((s, m) => s + Number(m.monto) * 100, 0)) / 100;
    return {
        cobrado: sum(movements.filter((m) => m.estado === 'por_validar' || m.estado === 'validado')),
        porRendir: sum(movements.filter((m) => m.estado === 'por_validar')),
    };
}
//# sourceMappingURL=relevamientos.rules.js.map