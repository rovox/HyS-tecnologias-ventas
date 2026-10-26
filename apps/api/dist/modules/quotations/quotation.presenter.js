"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DETAIL = void 0;
exports.present = present;
const quotations_rules_1 = require("./domain/quotations.rules");
const CATEGORY = { select: { id: true, label: true } };
const USER_NAME = { select: { id: true, name: true } };
exports.DETAIL = {
    sellers: true,
    cliente: { select: { id: true, nombre: true, direccion: true } },
    sucursal: { select: { id: true, nombre: true } },
    categoria: CATEGORY,
    vendedor: USER_NAME,
    eliminadaPor: USER_NAME,
    sale: true,
    project: { select: { id: true, codigo: true, estado: true } },
    _count: { select: { relevamientos: true, tasks: true } },
};
function present(row) {
    return {
        ...row,
        proyectoId: row.project?.id ?? null,
        venceEl: row.estado === 'enviado' ? (0, quotations_rules_1.expiresAt)(row.fechaEnvio) : null,
        transicionesValidas: (0, quotations_rules_1.nextStates)(row),
        puedeEliminar: !row.eliminadaAt && row.estado !== 'aprobado',
    };
}
//# sourceMappingURL=quotation.presenter.js.map