"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROJECT_DETAIL = void 0;
exports.presentProject = presentProject;
const finance_1 = require("../finance");
const inventory_1 = require("../inventory");
const projects_rules_1 = require("./domain/projects.rules");
const USER_NAME = { select: { id: true, name: true } };
exports.PROJECT_DETAIL = {
    cliente: { select: { id: true, nombre: true, direccion: true } },
    categoria: { select: { id: true, label: true } },
    sucursal: { select: { id: true, nombre: true } },
    quotation: { select: { id: true, numero: true, titulo: true } },
    responsable: USER_NAME,
    schedules: { include: { tecnico: USER_NAME }, orderBy: { createdAt: 'asc' } },
    movements: {
        where: { estado: { not: 'anulado' } },
        include: { registradoPor: USER_NAME, schedule: { select: { id: true, descripcionTrabajo: true } } },
        orderBy: { fecha: 'desc' },
    },
    stockMovements: {
        where: { tipo: 'salida_proyecto' },
        include: { producto: { select: { id: true, codigo: true, nombre: true, unidad: true, tipo: true } } },
        orderBy: { fecha: 'desc' },
    },
};
const cents = (value) => Math.round(value * 100) / 100;
function presentProject(row, now = new Date()) {
    const { schedules, movements, stockMovements, ...project } = row;
    const monto = Number(row.montoOficial);
    const { cobrado, porValidar, adicionales } = (0, finance_1.incomeOf)(movements);
    const gastos = (0, finance_1.expensesOf)(movements);
    const costoMaterial = (0, inventory_1.materialCost)(stockMovements);
    const costo = cents(gastos + costoMaterial);
    const garantia = (0, projects_rules_1.warranty)(row.entregadoAt, row.garantiaMeses, now);
    return {
        ...project,
        cobrado,
        porValidar,
        adicionales,
        saldo: (0, finance_1.balanceOf)(monto, cobrado, row.estado === 'anulado'),
        pctCobrado: monto > 0 ? Math.min(100, Math.round((cobrado / monto) * 100)) : 0,
        costoGastos: gastos,
        costoMaterial,
        costo,
        margen: cents(monto + adicionales - costo),
        garantiaHasta: garantia.hasta,
        garantiaVigente: garantia.vigente,
        transicionesValidas: (0, projects_rules_1.nextProjectStates)(row),
        trabajos: schedules.map((s) => ({
            id: s.id,
            descripcionTrabajo: s.descripcionTrabajo,
            estado: s.estado,
            fechaProgramada: s.fechaProgramada,
            horario: s.horario,
            tecnico: s.tecnico,
        })),
        cobros: movements.filter((m) => m.tipo === 'ingreso'),
        gastos: movements.filter((m) => m.tipo === 'egreso'),
        material: stockMovements,
    };
}
//# sourceMappingURL=project.presenter.js.map