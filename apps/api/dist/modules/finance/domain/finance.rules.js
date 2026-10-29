"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QR_DESTINOS = exports.MOVEMENT_ESTADOS = exports.MOVEMENT_TIPOS = void 0;
exports.movementError = movementError;
exports.nextMovementStates = nextMovementStates;
exports.checkMovementTransition = checkMovementTransition;
exports.editMovementError = editMovementError;
exports.incomeOf = incomeOf;
exports.expensesOf = expensesOf;
exports.balanceOf = balanceOf;
exports.qrDestinationError = qrDestinationError;
exports.incomeConceptError = incomeConceptError;
exports.incomeError = incomeError;
exports.cashBoxBalance = cashBoxBalance;
exports.pendingRefund = pendingRefund;
exports.custody = custody;
exports.movementImpact = movementImpact;
exports.movementDate = movementDate;
exports.advanceError = advanceError;
exports.daysLate = daysLate;
exports.monthMoney = monthMoney;
const calendar_1 = require("../../../common/domain/calendar");
exports.MOVEMENT_TIPOS = ['ingreso', 'egreso', 'transferencia'];
const CONCEPTOS = {
    ingreso: ['adelanto', 'cobro', 'adicional', 'asistencia', 'venta_directa', 'diferencia_arqueo', 'devolucion_anticipo', 'saldo_inicial', 'otro'],
    egreso: ['material', 'combustible', 'mantenimiento_vehicular', 'viaticos', 'servicios', 'sueldos', 'alquiler', 'impuestos', 'marketing', 'anticipo_por_rendir', 'diferencia_arqueo', 'otro'],
    transferencia: ['deposito', 'retiro'],
};
const MOVEMENT_FLOW = {
    por_validar: ['validado', 'observado', 'anulado'],
    observado: ['por_validar', 'anulado'],
    validado: ['anulado'],
    anulado: [],
};
exports.MOVEMENT_ESTADOS = Object.keys(MOVEMENT_FLOW);
const BUDGET_INCOME = ['adelanto', 'cobro'];
const COUNTED = ['por_validar', 'validado'];
const cents = (value) => Math.round(value * 100) / 100;
const total = (rows) => cents(rows.reduce((sum, m) => sum + Number(m.monto), 0));
function movementError(input) {
    if (!exports.MOVEMENT_TIPOS.includes(input.tipo))
        return `Tipo de movimiento no válido: ${input.tipo}`;
    if (!(CONCEPTOS[input.tipo] ?? []).includes(input.concepto))
        return `Concepto no válido para ${input.tipo}: ${input.concepto}`;
    if (!(Number(input.monto) > 0))
        return 'El monto debe ser mayor a 0';
    if (input.tipo === 'transferencia') {
        if (!input.cajaId || !input.cajaDestinoId)
            return 'Una transferencia necesita caja de origen y de destino';
        if (input.cajaId === input.cajaDestinoId)
            return 'La caja de origen y destino deben ser distintas';
    }
    if (input.tipo === 'egreso' && !['empresa', 'empleado'].includes(input.pagadoPor || ''))
        return 'Indica quién pagó: empresa o empleado';
    return null;
}
function nextMovementStates(estado) {
    return MOVEMENT_FLOW[estado] ?? [];
}
function checkMovementTransition(movement, to, input) {
    if (!nextMovementStates(movement.estado).includes(to))
        return { ok: false, reason: `Transición inválida: ${movement.estado} → ${to}` };
    if (to === 'validado' && movement.tipo !== 'transferencia' && !input.cajaId)
        return { ok: false, reason: 'Elige la caja donde queda el dinero' };
    if ((to === 'observado' || to === 'anulado') && !input.motivo?.trim())
        return { ok: false, reason: 'Indica el motivo' };
    return { ok: true };
}
function editMovementError(movement, canManageMoney) {
    if (movement.estado === 'anulado')
        return 'El movimiento está anulado';
    if (movement.estado === 'validado' && !canManageMoney)
        return 'Solo Gerencia o Contabilidad corrigen un movimiento validado';
    return null;
}
function incomeOf(movements) {
    const budget = movements.filter((m) => m.tipo === 'ingreso' && BUDGET_INCOME.includes(m.concepto) && COUNTED.includes(m.estado));
    return {
        cobrado: total(budget),
        porValidar: total(budget.filter((m) => m.estado === 'por_validar')),
        adicionales: total(movements.filter((m) => m.tipo === 'ingreso' && m.concepto === 'adicional' && COUNTED.includes(m.estado))),
    };
}
function expensesOf(movements) {
    return total(movements.filter((m) => m.tipo === 'egreso' && COUNTED.includes(m.estado)));
}
function balanceOf(monto, cobrado, cancelled) {
    return cancelled ? 0 : Math.max(0, cents(Number(monto) - cobrado));
}
exports.QR_DESTINOS = { qr_empresa: 'caja_qr', qr_socia: 'caja_qr_socia', qr_personal: null };
function qrDestinationError(metodo, cuentaDestino) {
    const qr = (metodo || '').toLowerCase() === 'qr';
    if (qr && !cuentaDestino)
        return 'Indica a qué QR entró el cobro: QR primario, QR secundario o tu QR personal';
    if (!qr && cuentaDestino)
        return 'La cuenta destino es solo para cobros por QR';
    return null;
}
function incomeConceptError(target, concepto) {
    if (target === 'visita')
        return concepto === 'asistencia' ? null : 'Una visita se cobra como asistencia';
    return concepto === 'asistencia' ? 'El cobro de asistencia es solo para visitas' : null;
}
function incomeError(target, concepto, monto) {
    if (target.cancelled)
        return 'No se registran cobros en un proyecto o trabajo anulado';
    if (target.closed)
        return 'El proyecto está cerrado';
    if (!BUDGET_INCOME.includes(concepto))
        return null;
    const pending = balanceOf(target.monto, target.cobrado, false);
    if (cents(monto) > pending)
        return `El monto (${cents(monto)}) supera el saldo pendiente (${pending}). Registra el excedente como adicional.`;
    return null;
}
function cashBoxBalance(cajaId, movements) {
    const validated = movements.filter((m) => m.estado === 'validado');
    const into = validated.filter((m) => (m.tipo === 'ingreso' && m.cajaId === cajaId) || (m.tipo === 'transferencia' && m.cajaDestinoId === cajaId));
    const out = validated.filter((m) => (m.tipo === 'egreso' && m.cajaId === cajaId) || (m.tipo === 'transferencia' && m.cajaId === cajaId));
    return cents(total(into) - total(out));
}
function pendingRefund(m) {
    return m.tipo === 'egreso' && m.pagadoPor === 'empleado' && !m.reembolsadoAt && m.estado !== 'anulado';
}
function custody(movements) {
    const byPerson = new Map();
    for (const m of movements) {
        if (m.tipo !== 'ingreso' || m.estado !== 'por_validar' || !m.recibidoPorId)
            continue;
        byPerson.set(m.recibidoPorId, [...(byPerson.get(m.recibidoPorId) ?? []), m]);
    }
    return [...byPerson.entries()]
        .map(([userId, rows]) => ({ userId, total: total(rows), cantidad: rows.length, movimientos: rows }))
        .sort((a, b) => b.total - a.total);
}
function movementImpact(m, accion, ctx) {
    const amount = Number(m.monto);
    const out = [];
    const box = (cajaId, delta) => {
        if (!cajaId)
            return;
        const antes = ctx.boxes[cajaId] ?? 0;
        out.push({ tipo: 'caja', cajaId, antes, despues: cents(antes + delta) });
    };
    const sign = m.tipo === 'ingreso' ? 1 : -1;
    if (accion === 'validar') {
        if (m.tipo === 'transferencia') {
            box(m.cajaId, -amount);
            box(m.cajaDestinoId, amount);
        }
        else
            box(ctx.cajaId ?? m.cajaId, sign * amount);
        return out;
    }
    if (m.estado === 'validado') {
        if (m.tipo === 'transferencia') {
            box(m.cajaId, amount);
            box(m.cajaDestinoId, -amount);
        }
        else
            box(m.cajaId, -sign * amount);
    }
    const t = ctx.target;
    if (t && COUNTED.includes(m.estado)) {
        if (m.tipo === 'ingreso' && BUDGET_INCOME.includes(m.concepto)) {
            out.push({ tipo: 'saldo', antes: balanceOf(t.monto, t.cobrado, t.cancelled), despues: balanceOf(t.monto, cents(t.cobrado - amount), t.cancelled) });
        }
        if (m.tipo === 'egreso')
            out.push({ tipo: 'costo', antes: t.costo, despues: cents(t.costo - amount) });
    }
    return out;
}
function movementDate(fecha, now = new Date(), before) {
    if (!fecha)
        return before ?? now;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha))
        return new Date(fecha);
    if (before && (0, calendar_1.businessDay)(before) === fecha)
        return before;
    return (0, calendar_1.atBusinessTime)(fecha, now);
}
function advanceError(input) {
    if (input.concepto !== 'anticipo_por_rendir')
        return null;
    if (!input.responsableId)
        return 'Indica a quién se entrega el anticipo';
    if (!input.asunto?.trim())
        return 'Indica el asunto del anticipo';
    if (!input.fechaLimite)
        return 'Indica hasta cuándo se rinde';
    return null;
}
function daysLate(fechaLimite, today) {
    const limit = new Date(fechaLimite).toISOString().slice(0, 10);
    return Math.max(0, Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${limit}T00:00:00Z`)) / 86400e3));
}
function monthMoney(movements) {
    const sum = (list) => cents(list.reduce((s, m) => s + Number(m.monto), 0));
    const incomes = movements.filter((m) => m.tipo === 'ingreso' && COUNTED.includes(m.estado));
    const enCaja = sum(incomes.filter((m) => m.estado === 'validado'));
    const egresos = sum(movements.filter((m) => m.tipo === 'egreso' && m.estado === 'validado'));
    return { cobrado: sum(incomes), enCaja, egresosValidados: egresos, neto: cents(enCaja - egresos), porValidar: sum(incomes.filter((m) => m.estado === 'por_validar')) };
}
//# sourceMappingURL=finance.rules.js.map