"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLES = void 0;
exports.isAdmin = isAdmin;
exports.isVentas = isVentas;
exports.isTec = isTec;
exports.isCont = isCont;
exports.assertAdmin = assertAdmin;
exports.assertCanMutateQuotes = assertCanMutateQuotes;
exports.assertCanMutateClients = assertCanMutateClients;
exports.assertCanMutateSchedules = assertCanMutateSchedules;
exports.assertCanCreateSchedules = assertCanCreateSchedules;
exports.scheduleWhere = scheduleWhere;
exports.quotationWhere = quotationWhere;
exports.clientWhere = clientWhere;
exports.saleWhere = saleWhere;
exports.relevamientoWhere = relevamientoWhere;
exports.taskWhere = taskWhere;
exports.metricsUserId = metricsUserId;
const common_1 = require("@nestjs/common");
exports.ROLES = {
    ADMIN: 'ADMINISTRADOR',
    VENTAS: 'VENTAS / ADMINISTRACIÓN',
    TEC: 'SEGURIDAD ELECTRÓNICA',
    CONT: 'Contadora',
};
function isAdmin(user) {
    return user?.role === exports.ROLES.ADMIN;
}
function isVentas(user) {
    return user?.role === exports.ROLES.VENTAS;
}
function isTec(user) {
    return user?.role === exports.ROLES.TEC;
}
function isCont(user) {
    return user?.role === exports.ROLES.CONT;
}
function assertAdmin(user) {
    if (!isAdmin(user))
        throw new common_1.ForbiddenException('Solo administrador');
}
function assertCanMutateQuotes(user) {
    if (!isAdmin(user) && !isVentas(user)) {
        throw new common_1.ForbiddenException('No puedes modificar cotizaciones');
    }
}
function assertCanMutateClients(user) {
    if (!isAdmin(user) && !isVentas(user)) {
        throw new common_1.ForbiddenException('No puedes modificar clientes');
    }
}
function assertCanMutateSchedules(user) {
    if (!isAdmin(user) && !isVentas(user) && !isTec(user)) {
        throw new common_1.ForbiddenException('No puedes modificar el cronograma');
    }
}
function assertCanCreateSchedules(user) {
    if (!isAdmin(user) && !isVentas(user)) {
        throw new common_1.ForbiddenException('Solo ventas o admin pueden crear trabajos');
    }
}
function scheduleWhere(user) {
    if (isAdmin(user) || isCont(user))
        return {};
    if (isVentas(user) && user.sucursalId)
        return { sucursalId: user.sucursalId };
    if (isTec(user))
        return { tecnicoId: user.id };
    return { id: '__none__' };
}
function quotationWhere(user) {
    if (isAdmin(user) || isVentas(user))
        return {};
    return { id: '__none__' };
}
function clientWhere(user) {
    if (isAdmin(user) || isCont(user))
        return {};
    if (user.sucursalId)
        return { sucursalId: user.sucursalId };
    return {};
}
function saleWhere(user) {
    if (isAdmin(user) || isCont(user))
        return {};
    if (isVentas(user)) {
        return {
            quotation: { OR: [{ vendedorId: user.id }, { sellers: { some: { userId: user.id } } }] },
        };
    }
    return { id: '__none__' };
}
function relevamientoWhere(user, cotizacionId) {
    const base = cotizacionId ? { cotizacionId } : {};
    if (isAdmin(user))
        return base;
    if (isVentas(user)) {
        return { ...base, ...(user.sucursalId ? { sucursalId: user.sucursalId } : {}) };
    }
    if (isTec(user))
        return { ...base, usuarioId: user.id };
    return { id: '__none__' };
}
function taskWhere(user, tipo) {
    if (isAdmin(user))
        return tipo ? { tipo } : {};
    if (isVentas(user)) {
        if (tipo === 'cotizacion')
            return { tipo: 'cotizacion' };
        const sucursal = user.sucursalId ? { sucursalId: user.sucursalId } : {};
        if (tipo)
            return { tipo, ...sucursal };
        return {
            OR: [{ tipo: 'cotizacion' }, { AND: [{ NOT: { tipo: 'cotizacion' } }, sucursal] }],
        };
    }
    if (isTec(user)) {
        if (tipo === 'cotizacion')
            return { id: '__none__' };
        const own = { OR: [{ asignadoId: user.id }, { creadorId: user.id }] };
        return tipo ? { AND: [own, { tipo }] } : own;
    }
    return { id: '__none__' };
}
function metricsUserId(user, requested) {
    if (isAdmin(user))
        return requested;
    if (isVentas(user))
        return user.id;
    if (isCont(user))
        return requested;
    return user.id;
}
//# sourceMappingURL=roles.js.map