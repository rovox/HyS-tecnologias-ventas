"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkScheduleTransition = checkScheduleTransition;
exports.categoryChangeError = categoryChangeError;
exports.montoChangeError = montoChangeError;
const SCHEDULE_FLOW = {
    programado: ['en_proceso', 'cancelado'],
    en_proceso: ['terminado', 'cancelado'],
    terminado: [],
    cancelado: [],
};
function checkScheduleTransition(from, to) {
    if (!(to in SCHEDULE_FLOW))
        return { ok: false, reason: `Estado desconocido: ${to}` };
    if (!(SCHEDULE_FLOW[from] ?? []).includes(to))
        return { ok: false, reason: `Transición inválida: ${from} → ${to}` };
    return { ok: true };
}
function categoryChangeError(current, requested) {
    if (requested === undefined || requested === current.categoriaId || !current.quotationId)
        return null;
    return 'La categoría de un trabajo de cotización es la de la cotización';
}
function montoChangeError(current, requested) {
    if (requested === undefined || !current.projectId)
        return null;
    if (Number(requested) === Number(current.monto))
        return null;
    return 'El monto es del proyecto: los trabajos de un proyecto no tienen monto propio';
}
//# sourceMappingURL=schedules.rules.js.map