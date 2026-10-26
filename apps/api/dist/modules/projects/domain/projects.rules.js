"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectCode = exports.PROJECT_ESTADOS = void 0;
exports.nextProjectStates = nextProjectStates;
exports.checkProjectTransition = checkProjectTransition;
exports.warranty = warranty;
exports.montoChangeError = montoChangeError;
exports.newJobError = newJobError;
exports.firstJobFromQuotation = firstJobFromQuotation;
const PROJECT_FLOW = {
    planificado: ['en_ejecucion', 'anulado'],
    en_ejecucion: ['entregado', 'anulado'],
    entregado: ['cerrado', 'en_ejecucion', 'anulado'],
    cerrado: [],
    anulado: [],
};
exports.PROJECT_ESTADOS = Object.keys(PROJECT_FLOW);
const cents = (value) => Math.round(value * 100) / 100;
function nextProjectStates(project) {
    return PROJECT_FLOW[project.estado] ?? [];
}
function checkProjectTransition(project, to, ctx) {
    if (!exports.PROJECT_ESTADOS.includes(to))
        return { ok: false, reason: `Estado desconocido: ${to}` };
    if (!nextProjectStates(project).includes(to))
        return { ok: false, reason: `Transición inválida: ${project.estado} → ${to}` };
    if (to === 'entregado' && (ctx.openJobs ?? 0) > 0) {
        return { ok: false, reason: `Termina o cancela los trabajos pendientes antes de entregar (${ctx.openJobs})` };
    }
    if (to === 'cerrado' && ctx.saldo > 0)
        return { ok: false, reason: `No se cierra un proyecto con saldo pendiente (Bs ${cents(ctx.saldo)})` };
    if (to === 'anulado' && !ctx.isAdmin)
        return { ok: false, reason: 'Solo Gerencia anula un proyecto' };
    if (to === 'anulado' && !ctx.motivo?.trim())
        return { ok: false, reason: 'Indica el motivo de la anulación' };
    return { ok: true };
}
function warranty(entregadoAt, meses, now) {
    if (!entregadoAt)
        return { hasta: null, vigente: false };
    const hasta = new Date(entregadoAt);
    hasta.setUTCMonth(hasta.getUTCMonth() + meses);
    return { hasta, vigente: hasta >= now };
}
function montoChangeError(ctx, monto, motivo) {
    if (!ctx.isAdmin)
        return 'Solo Gerencia cambia el monto oficial de un proyecto';
    if (['cerrado', 'anulado'].includes(ctx.estado))
        return 'El proyecto ya está cerrado o anulado';
    if (!(Number(monto) > 0))
        return 'El monto debe ser mayor a 0';
    if (!motivo?.trim())
        return 'Indica el motivo del cambio de monto';
    return null;
}
function newJobError(project) {
    return ['cerrado', 'anulado'].includes(project.estado) ? 'El proyecto está cerrado o anulado' : null;
}
const projectCode = (quotationNumero) => quotationNumero.replace(/^COT-/, 'PRY-');
exports.projectCode = projectCode;
function firstJobFromQuotation(quote, clientAddress, options, now) {
    return {
        categoriaId: quote.categoriaId,
        clienteId: quote.clienteId,
        lugar: options.lugar?.trim() || clientAddress || 'Por definir',
        descripcionTrabajo: `${quote.titulo} (${quote.numero})`,
        monto: 0,
        adelanto: 0,
        saldo: 0,
        fechaProgramada: options.fechaProgramada ? new Date(options.fechaProgramada) : now,
        horario: options.horario || null,
        estado: 'programado',
        sucursalId: quote.sucursalId,
        vendedorId: quote.vendedorId || null,
        tecnicoId: options.tecnicoId || null,
        quotationId: quote.id,
    };
}
//# sourceMappingURL=projects.rules.js.map