"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countTotal = countTotal;
exports.countError = countError;
exports.expectedCash = expectedCash;
exports.otherMethods = otherMethods;
exports.closeError = closeError;
exports.differenceMovement = differenceMovement;
exports.closeRequirements = closeRequirements;
exports.reviewError = reviewError;
const DENOMINATIONS = [200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1];
const cents = (value) => Math.round(value * 100) / 100;
function countTotal(conteo) {
    return cents(DENOMINATIONS.reduce((sum, d) => sum + d * (Number(conteo[String(d)]) || 0), 0));
}
function countError(conteo) {
    for (const [key, value] of Object.entries(conteo)) {
        if (!DENOMINATIONS.map(String).includes(key))
            return `Denominación no válida: ${key}`;
        const n = Number(value);
        if (!Number.isInteger(n) || n < 0)
            return 'Cada cantidad de billetes o monedas es un entero mayor o igual a 0';
    }
    return null;
}
const method = (m) => (m.medioPago || m.metodo || '').toLowerCase();
const counted = (m) => ['por_validar', 'validado'].includes(m.estado);
function cashEffect(m, cajaId, counter = new Set()) {
    const amount = Number(m.monto);
    if (!counted(m))
        return 0;
    if (m.tipo === 'transferencia') {
        if (m.estado !== 'validado')
            return 0;
        return m.cajaDestinoId === cajaId ? amount : m.cajaId === cajaId ? -amount : 0;
    }
    if (method(m) !== 'efectivo')
        return 0;
    if (m.cajaId && m.cajaId !== cajaId)
        return 0;
    if (m.tipo === 'ingreso')
        return m.estado === 'validado' || (m.recibidoPorId && counter.has(m.recibidoPorId)) ? amount : 0;
    if (m.tipo === 'egreso' && m.pagadoPor !== 'empleado')
        return -amount;
    return 0;
}
function expectedCash(saldoInicial, movimientos, cajaId, counter = new Set()) {
    const lines = movimientos.map((m) => ({ id: m.id, efecto: cents(cashEffect(m, cajaId, counter)) })).filter((l) => l.efecto !== 0);
    const ingresos = cents(lines.filter((l) => l.efecto > 0).reduce((s, l) => s + l.efecto, 0));
    const egresos = cents(-lines.filter((l) => l.efecto < 0).reduce((s, l) => s + l.efecto, 0));
    return { lines, ingresos, egresos, esperado: cents(saldoInicial + ingresos - egresos) };
}
function otherMethods(movimientos) {
    const sum = (medio) => cents(movimientos.filter((m) => m.tipo === 'ingreso' && counted(m) && method(m) === medio).reduce((s, m) => s + Number(m.monto), 0));
    return { qr: sum('qr'), transferencia: sum('transferencia') };
}
function closeError(diferencia, motivo) {
    if (diferencia !== 0 && !motivo?.trim())
        return `Hay una diferencia de Bs ${Math.abs(diferencia).toFixed(2)} (${diferencia < 0 ? 'faltante' : 'sobrante'}): indica el motivo`;
    return null;
}
function differenceMovement(diferencia) {
    if (diferencia === 0)
        return null;
    return { tipo: diferencia < 0 ? 'egreso' : 'ingreso', concepto: 'diferencia_arqueo', monto: cents(Math.abs(diferencia)), label: diferencia < 0 ? 'Faltante' : 'Sobrante' };
}
function closeRequirements(input) {
    const future = input.dia > input.today;
    return [
        { ok: !future, texto: future ? 'Es un día que todavía no llegó' : 'El día ya llegó' },
        { ok: !input.closed, texto: input.closed ? 'Este día ya está cerrado' : 'Este día todavía no está cerrado' },
        {
            ok: !input.pendingDay,
            texto: input.pendingDay ? `Falta cerrar el ${input.pendingDay}: los días con movimientos se cierran en orden` : 'Los días anteriores con movimientos están cerrados',
        },
    ];
}
function reviewError(revisionEstado, action, motivo) {
    if (revisionEstado === 'aprobado')
        return 'Este cierre ya está aprobado';
    if (action === 'observar' && !motivo?.trim())
        return 'Indica qué hay que revisar del cierre';
    return null;
}
//# sourceMappingURL=cash-close.rules.js.map