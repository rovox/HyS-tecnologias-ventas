"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOVEMENT_DETAIL = void 0;
exports.presentMovement = presentMovement;
const finance_rules_1 = require("./domain/finance.rules");
const USER_NAME = { select: { id: true, name: true } };
const BOX = { select: { id: true, nombre: true } };
exports.MOVEMENT_DETAIL = {
    project: { select: { id: true, codigo: true, titulo: true } },
    schedule: { select: { id: true, descripcionTrabajo: true } },
    relevamiento: { select: { id: true, tipoVisita: true, fecha: true } },
    cliente: { select: { id: true, nombre: true } },
    caja: BOX,
    cajaDestino: BOX,
    sucursal: { select: { id: true, nombre: true } },
    registradoPor: USER_NAME,
    validadoPor: USER_NAME,
    recibidoPor: USER_NAME,
};
function presentMovement(row) {
    return {
        ...row,
        transicionesValidas: (0, finance_rules_1.nextMovementStates)(row.estado),
        reembolsoPendiente: (0, finance_rules_1.pendingRefund)(row),
    };
}
//# sourceMappingURL=movement.presenter.js.map