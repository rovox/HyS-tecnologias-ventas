"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canViewUser = exports.canListUserDirectory = exports.canListUsers = exports.canSeePedidos = exports.canManagePedidos = exports.canMutateRelevamientos = exports.canMutateSchedules = exports.canCreateSchedules = exports.canSeeProjects = exports.canManageProjects = exports.canAdjustInventory = exports.canManageInventory = exports.canSeeLedger = exports.canRegisterMovements = exports.canValidateMovements = exports.canSeeQuotations = exports.canManageWebLeads = exports.canMutateClients = exports.canMutateQuotes = exports.isCommercial = exports.isConta = exports.isTec = exports.isVentas = exports.isAdmin = exports.ROLES = void 0;
exports.scheduleWhere = scheduleWhere;
exports.quotationWhere = quotationWhere;
exports.clientWhere = clientWhere;
exports.saleWhere = saleWhere;
exports.relevamientoWhere = relevamientoWhere;
exports.taskWhere = taskWhere;
exports.goalWhere = goalWhere;
exports.metricsUserId = metricsUserId;
exports.ROLES = {
    ADMIN: 'ADMINISTRADOR',
    VENTAS: 'VENTAS / ADMINISTRACIÓN',
    TEC: 'SEGURIDAD ELECTRÓNICA',
    CONTA: 'CONTABILIDAD',
    NONE: 'SIN ACCESO',
};
const NO_ROWS = { id: '__none__' };
const isAdmin = (actor) => actor?.role === exports.ROLES.ADMIN;
exports.isAdmin = isAdmin;
const isVentas = (actor) => actor?.role === exports.ROLES.VENTAS;
exports.isVentas = isVentas;
const isTec = (actor) => actor?.role === exports.ROLES.TEC;
exports.isTec = isTec;
const isConta = (actor) => actor?.role === exports.ROLES.CONTA;
exports.isConta = isConta;
const isNone = (actor) => actor?.role === exports.ROLES.NONE;
const isCommercial = (actor) => (0, exports.isAdmin)(actor) || (0, exports.isVentas)(actor);
exports.isCommercial = isCommercial;
const readsAll = (actor) => (0, exports.isCommercial)(actor) || (0, exports.isConta)(actor);
const isFinance = (actor) => (0, exports.isAdmin)(actor) || (0, exports.isConta)(actor);
exports.canMutateQuotes = exports.isCommercial;
exports.canMutateClients = exports.isCommercial;
exports.canManageWebLeads = exports.isCommercial;
exports.canSeeQuotations = readsAll;
exports.canValidateMovements = isFinance;
const canRegisterMovements = (actor) => readsAll(actor) || (0, exports.isTec)(actor);
exports.canRegisterMovements = canRegisterMovements;
exports.canSeeLedger = readsAll;
exports.canManageInventory = exports.isCommercial;
exports.canAdjustInventory = isFinance;
exports.canManageProjects = exports.isCommercial;
exports.canSeeProjects = readsAll;
exports.canCreateSchedules = exports.isCommercial;
const canMutateSchedules = (actor) => (0, exports.isCommercial)(actor) || (0, exports.isTec)(actor);
exports.canMutateSchedules = canMutateSchedules;
const canMutateRelevamientos = (actor) => (0, exports.isCommercial)(actor) || (0, exports.isTec)(actor);
exports.canMutateRelevamientos = canMutateRelevamientos;
exports.canManagePedidos = exports.isCommercial;
exports.canSeePedidos = readsAll;
exports.canListUsers = readsAll;
const canListUserDirectory = (actor) => readsAll(actor) || (0, exports.isTec)(actor);
exports.canListUserDirectory = canListUserDirectory;
const canViewUser = (actor, targetId) => (!isNone(actor) && actor.id === targetId) || readsAll(actor);
exports.canViewUser = canViewUser;
function scheduleWhere(actor) {
    if (readsAll(actor))
        return {};
    if ((0, exports.isTec)(actor))
        return { tecnicoId: actor.id };
    return NO_ROWS;
}
function quotationWhere(actor) {
    return readsAll(actor) ? {} : NO_ROWS;
}
function clientWhere(actor) {
    return readsAll(actor) || (0, exports.isTec)(actor) ? {} : NO_ROWS;
}
function saleWhere(actor) {
    if (isFinance(actor))
        return {};
    if ((0, exports.isVentas)(actor)) {
        return { quotation: { OR: [{ vendedorId: actor.id }, { sellers: { some: { userId: actor.id } } }] } };
    }
    return NO_ROWS;
}
function relevamientoWhere(actor, cotizacionId) {
    const base = cotizacionId ? { cotizacionId } : {};
    if (readsAll(actor))
        return base;
    if ((0, exports.isTec)(actor))
        return { ...base, OR: [{ usuarioId: actor.id }, { tecnicoId: actor.id }] };
    return NO_ROWS;
}
function taskWhere(actor, tipo) {
    if (readsAll(actor))
        return tipo ? { tipo } : {};
    if ((0, exports.isTec)(actor)) {
        if (tipo === 'cotizacion')
            return NO_ROWS;
        const own = { OR: [{ asignadoId: actor.id }, { creadorId: actor.id }] };
        return tipo ? { AND: [own, { tipo }] } : own;
    }
    return NO_ROWS;
}
function goalWhere(actor) {
    if (isFinance(actor))
        return {};
    if ((0, exports.isVentas)(actor))
        return { usuarioId: actor.id };
    return NO_ROWS;
}
function metricsUserId(actor, requested) {
    return isFinance(actor) ? requested : actor.id;
}
//# sourceMappingURL=policy.js.map