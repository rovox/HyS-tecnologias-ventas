"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskWhere = exports.scheduleWhere = exports.relevamientoWhere = exports.quotationWhere = exports.metricsUserId = exports.isVentas = exports.isTec = exports.isConta = exports.isCommercial = exports.isAdmin = exports.goalWhere = exports.clientWhere = exports.ROLES = void 0;
exports.assertAdmin = assertAdmin;
exports.assertCanMutateQuotes = assertCanMutateQuotes;
exports.assertCanMutateClients = assertCanMutateClients;
exports.assertCanManageWebLeads = assertCanManageWebLeads;
exports.assertCanMutateSchedules = assertCanMutateSchedules;
exports.assertCanMutateRelevamientos = assertCanMutateRelevamientos;
exports.assertCanCreateSchedules = assertCanCreateSchedules;
exports.assertCanManageProjects = assertCanManageProjects;
exports.assertCanSeeProjects = assertCanSeeProjects;
const common_1 = require("@nestjs/common");
const policy_1 = require("./policy");
var policy_2 = require("./policy");
Object.defineProperty(exports, "ROLES", { enumerable: true, get: function () { return policy_2.ROLES; } });
Object.defineProperty(exports, "clientWhere", { enumerable: true, get: function () { return policy_2.clientWhere; } });
Object.defineProperty(exports, "goalWhere", { enumerable: true, get: function () { return policy_2.goalWhere; } });
Object.defineProperty(exports, "isAdmin", { enumerable: true, get: function () { return policy_2.isAdmin; } });
Object.defineProperty(exports, "isCommercial", { enumerable: true, get: function () { return policy_2.isCommercial; } });
Object.defineProperty(exports, "isConta", { enumerable: true, get: function () { return policy_2.isConta; } });
Object.defineProperty(exports, "isTec", { enumerable: true, get: function () { return policy_2.isTec; } });
Object.defineProperty(exports, "isVentas", { enumerable: true, get: function () { return policy_2.isVentas; } });
Object.defineProperty(exports, "metricsUserId", { enumerable: true, get: function () { return policy_2.metricsUserId; } });
Object.defineProperty(exports, "quotationWhere", { enumerable: true, get: function () { return policy_2.quotationWhere; } });
Object.defineProperty(exports, "relevamientoWhere", { enumerable: true, get: function () { return policy_2.relevamientoWhere; } });
Object.defineProperty(exports, "scheduleWhere", { enumerable: true, get: function () { return policy_2.scheduleWhere; } });
Object.defineProperty(exports, "taskWhere", { enumerable: true, get: function () { return policy_2.taskWhere; } });
function assertAdmin(user) {
    if (!(0, policy_1.isAdmin)(user))
        throw new common_1.ForbiddenException('Solo administrador');
}
function assertCanMutateQuotes(user) {
    if (!(0, policy_1.canMutateQuotes)(user))
        throw new common_1.ForbiddenException('No puedes modificar cotizaciones');
}
function assertCanMutateClients(user) {
    if (!(0, policy_1.canMutateClients)(user))
        throw new common_1.ForbiddenException('No puedes modificar clientes');
}
function assertCanManageWebLeads(user) {
    if (!(0, policy_1.canManageWebLeads)(user))
        throw new common_1.ForbiddenException('No puedes ver ni gestionar solicitudes web');
}
function assertCanMutateSchedules(user) {
    if (!(0, policy_1.canMutateSchedules)(user))
        throw new common_1.ForbiddenException('No puedes modificar el cronograma');
}
function assertCanMutateRelevamientos(user) {
    if (!(0, policy_1.canMutateRelevamientos)(user))
        throw new common_1.ForbiddenException('No puedes registrar relevamientos');
}
function assertCanCreateSchedules(user) {
    if (!(0, policy_1.canCreateSchedules)(user))
        throw new common_1.ForbiddenException('Solo ventas o admin pueden crear trabajos');
}
function assertCanManageProjects(user) {
    if (!(0, policy_1.canManageProjects)(user))
        throw new common_1.ForbiddenException('Sin acceso a proyectos');
}
function assertCanSeeProjects(user) {
    if (!(0, policy_1.canSeeProjects)(user))
        throw new common_1.ForbiddenException('Sin acceso a proyectos');
}
//# sourceMappingURL=roles.js.map