"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEDGER_COLUMNS = void 0;
exports.ledgerRows = ledgerRows;
exports.ledgerSummary = ledgerSummary;
const calendar_1 = require("../../../common/domain/calendar");
const TIPO = { ingreso: 'Ingreso', egreso: 'Egreso', transferencia: 'Transferencia' };
const ESTADO = { por_validar: 'Por validar', validado: 'Validado', observado: 'Observado', anulado: 'Anulado' };
const CONCEPTO = {
    adelanto: 'Adelanto',
    cobro: 'Cobro',
    adicional: 'Adicional',
    asistencia: 'Asistencia',
    venta_directa: 'Venta directa',
    material: 'Material',
    combustible: 'Combustible',
    mantenimiento_vehicular: 'Mantenimiento vehicular',
    viaticos: 'Viáticos',
    servicios: 'Servicios',
    sueldos: 'Sueldos',
    alquiler: 'Alquiler',
    impuestos: 'Impuestos',
    marketing: 'Marketing',
    diferencia_arqueo: 'Diferencia de arqueo',
    anticipo_por_rendir: 'Anticipo por rendir',
    devolucion_anticipo: 'Devolución de anticipo',
    otro: 'Otro',
    deposito: 'Depósito',
    retiro: 'Retiro',
};
exports.LEDGER_COLUMNS = [
    ['fecha', 'Fecha'],
    ['hora', 'Hora'],
    ['tipo', 'Tipo'],
    ['concepto', 'Concepto'],
    ['monto', 'Monto Bs'],
    ['estado', 'Estado'],
    ['caja', 'Caja'],
    ['sucursal', 'Sucursal'],
    ['proyecto', 'Proyecto'],
    ['cliente', 'Cliente'],
    ['registro', 'Registró'],
    ['tieneDinero', 'Tiene el dinero'],
    ['nota', 'Nota'],
];
const sign = (tipo) => (tipo === 'ingreso' ? 1 : tipo === 'egreso' ? -1 : 0);
const cents = (value) => Math.round(value * 100) / 100;
const businessTime = (value) => new Date(new Date(value).getTime() - 4 * 60 * 60 * 1000).toISOString().slice(11, 16);
function ledgerRows(movements) {
    return movements.map((m) => {
        const amount = Number(m.monto);
        return {
            fecha: (0, calendar_1.businessDay)(m.fecha),
            hora: businessTime(m.fecha),
            tipo: TIPO[m.tipo] ?? m.tipo,
            concepto: CONCEPTO[m.concepto] ?? m.concepto,
            monto: cents(m.tipo === 'transferencia' ? amount : sign(m.tipo) * amount),
            estado: ESTADO[m.estado] ?? m.estado,
            caja: m.tipo === 'transferencia' ? `${m.caja?.nombre ?? '—'} → ${m.cajaDestino?.nombre ?? '—'}` : m.caja?.nombre ?? '',
            sucursal: m.sucursal?.nombre ?? '',
            proyecto: m.project?.codigo ?? '',
            cliente: m.cliente?.nombre ?? '',
            registro: m.registradoPor?.name ?? '',
            tieneDinero: m.tipo === 'ingreso' && m.estado === 'por_validar' ? m.recibidoPor?.name ?? '' : '',
            nota: m.nota ?? '',
        };
    });
}
function ledgerSummary(movements) {
    const live = movements.filter((m) => m.estado !== 'anulado' && m.tipo !== 'transferencia');
    const total = (list) => cents(list.reduce((sum, m) => sum + sign(m.tipo) * Number(m.monto), 0));
    const ingresos = total(live.filter((m) => m.tipo === 'ingreso'));
    const egresos = -total(live.filter((m) => m.tipo === 'egreso'));
    const pending = live.filter((m) => m.estado === 'por_validar');
    const byConcept = new Map();
    for (const m of live) {
        const label = CONCEPTO[m.concepto] ?? m.concepto;
        byConcept.set(label, cents((byConcept.get(label) ?? 0) + sign(m.tipo) * Number(m.monto)));
    }
    return {
        ingresos,
        egresos,
        neto: cents(ingresos - egresos),
        porValidar: { cantidad: pending.length, monto: total(pending) },
        anulados: movements.filter((m) => m.estado === 'anulado').length,
        porConcepto: [...byConcept.entries()].map(([concepto, monto]) => ({ concepto, monto })).sort((a, b) => a.concepto.localeCompare(b.concepto, 'es')),
    };
}
//# sourceMappingURL=ledger-export.rules.js.map