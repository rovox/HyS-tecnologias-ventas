"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIVISIONS = void 0;
exports.divisionError = divisionError;
exports.chipChangeError = chipChangeError;
exports.DIVISIONS = [
    { id: 'computo_comunicacion', label: 'Cómputo y comunicación', sortOrder: 1 },
    { id: 'seguridad_electronica', label: 'Seguridad electrónica', sortOrder: 2 },
    { id: 'cableado_estructurado', label: 'Cableado estructurado', sortOrder: 3 },
];
const DIVISION_NAMES = exports.DIVISIONS.map((d) => d.label).join(', ');
function divisionError(row) {
    if (!row)
        return `Selecciona la categoría: ${DIVISION_NAMES}`;
    if (!row.principal || !row.active)
        return `La categoría debe ser una de las principales: ${DIVISION_NAMES}`;
    return null;
}
function chipChangeError(row) {
    return row?.principal ? 'Las categorías principales no se pueden modificar' : null;
}
//# sourceMappingURL=categories.rules.js.map