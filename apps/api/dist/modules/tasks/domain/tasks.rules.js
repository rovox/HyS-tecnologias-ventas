"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TASK_PRIORIDADES = exports.TASK_ESTADOS = void 0;
exports.isOverdue = isOverdue;
exports.compareTasks = compareTasks;
exports.pendingSummary = pendingSummary;
exports.convertError = convertError;
const calendar_1 = require("../../../common/domain/calendar");
exports.TASK_ESTADOS = ['pendiente', 'completada', 'descartada'];
exports.TASK_PRIORIDADES = ['alta', 'media', 'baja'];
const PRIORITY_ORDER = { alta: 0, media: 1, baja: 2 };
function isOverdue(task, now) {
    return task.estado === 'pendiente' && Boolean(task.plazo) && (0, calendar_1.dayOf)(task.plazo) < (0, calendar_1.businessToday)(now);
}
function compareTasks(a, b) {
    const pa = PRIORITY_ORDER[a.prioridad] ?? 9;
    const pb = PRIORITY_ORDER[b.prioridad] ?? 9;
    if (pa !== pb)
        return pa - pb;
    const ta = a.plazo ? new Date(a.plazo).getTime() : Infinity;
    const tb = b.plazo ? new Date(b.plazo).getTime() : Infinity;
    return ta - tb;
}
function pendingSummary(tasks, userId, now) {
    const pending = tasks.filter((t) => t.estado === 'pendiente');
    const mine = pending.filter((t) => t.asignadoId === userId || (!t.asignadoId && t.creadorId === userId));
    return {
        mias: mine.length,
        sinAsignar: pending.filter((t) => !t.asignadoId).length,
        vencidas: mine.filter((t) => isOverdue(t, now)).length,
    };
}
function convertError(task) {
    if (task.cotizacionId)
        return 'Esta tarea ya tiene una cotización';
    if (task.estado !== 'pendiente')
        return 'Solo una tarea pendiente se convierte en cotización';
    return null;
}
//# sourceMappingURL=tasks.rules.js.map