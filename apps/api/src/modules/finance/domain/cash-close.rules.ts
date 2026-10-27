// Daily cash close per branch (FIN-04, no shifts): count by denomination against the cash expected. Pure TS.

/** Bolivian notes and coins, largest first. */
const DENOMINATIONS = [200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1] as const;

const cents = (value: number) => Math.round(value * 100) / 100;

/** { "200": 3, "0.5": 4 } → total in Bs (unknown denominations and negative counts are errors, see countError). */
export function countTotal(conteo: Record<string, number>) {
  return cents(DENOMINATIONS.reduce((sum, d) => sum + d * (Number(conteo[String(d)]) || 0), 0));
}

export function countError(conteo: Record<string, unknown>): string | null {
  for (const [key, value] of Object.entries(conteo)) {
    if (!DENOMINATIONS.map(String).includes(key)) return `Denominación no válida: ${key}`;
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0) return 'Cada cantidad de billetes o monedas es un entero mayor o igual a 0';
  }
  return null;
}

export type CashMove = {
  id: string;
  tipo: string;
  concepto: string;
  monto: number | string | { toString(): string };
  estado: string;
  metodo?: string | null;
  medioPago?: string | null;
  pagadoPor?: string | null;
  cajaId?: string | null;
  cajaDestinoId?: string | null;
  recibidoPorId?: string | null;
};

const method = (m: CashMove) => (m.medioPago || m.metodo || '').toLowerCase();
const counted = (m: CashMove) => ['por_validar', 'validado'].includes(m.estado);

/**
 * How a movement of the day changes the cash of the branch box: cash incomes come in — validated, or still waiting
 * when the person who holds the money works at the counter of this branch (`counter`: not a técnico out on a job) —,
 * cash expenses paid by the company go out, validated transfers move between this box and another. 0 = not cash.
 */
function cashEffect(m: CashMove, cajaId: string, counter: Set<string> = new Set()): number {
  const amount = Number(m.monto);
  if (!counted(m)) return 0;
  if (m.tipo === 'transferencia') {
    if (m.estado !== 'validado') return 0;
    return m.cajaDestinoId === cajaId ? amount : m.cajaId === cajaId ? -amount : 0;
  }
  if (method(m) !== 'efectivo') return 0;
  if (m.cajaId && m.cajaId !== cajaId) return 0;
  if (m.tipo === 'ingreso') return m.estado === 'validado' || (m.recibidoPorId && counter.has(m.recibidoPorId)) ? amount : 0;
  if (m.tipo === 'egreso' && m.pagadoPor !== 'empleado') return -amount;
  return 0;
}

/** The expected cash and the lines that explain it (shown to the cashier before counting). */
export function expectedCash(saldoInicial: number, movimientos: CashMove[], cajaId: string, counter: Set<string> = new Set()) {
  const lines = movimientos.map((m) => ({ id: m.id, efecto: cents(cashEffect(m, cajaId, counter)) })).filter((l) => l.efecto !== 0);
  const ingresos = cents(lines.filter((l) => l.efecto > 0).reduce((s, l) => s + l.efecto, 0));
  const egresos = cents(-lines.filter((l) => l.efecto < 0).reduce((s, l) => s + l.efecto, 0));
  return { lines, ingresos, egresos, esperado: cents(saldoInicial + ingresos - egresos) };
}

/** Non-cash money of the day (it does not go in the drawer): QR and transfers received, for the summary. */
export function otherMethods(movimientos: CashMove[]) {
  const sum = (medio: string) => cents(movimientos.filter((m) => m.tipo === 'ingreso' && counted(m) && method(m) === medio).reduce((s, m) => s + Number(m.monto), 0));
  return { qr: sum('qr'), transferencia: sum('transferencia') };
}

/** A difference needs its reason; the close cannot be done without it (the light turns red). */
export function closeError(diferencia: number, motivo?: string | null): string | null {
  if (diferencia !== 0 && !motivo?.trim()) return `Hay una diferencia de Bs ${Math.abs(diferencia).toFixed(2)} (${diferencia < 0 ? 'faltante' : 'sobrante'}): indica el motivo`;
  return null;
}

/** The movement a difference creates (por validar, Contabilidad decides): a shortage is an expense, a surplus an income. */
export function differenceMovement(diferencia: number) {
  if (diferencia === 0) return null;
  return { tipo: diferencia < 0 ? 'egreso' : 'ingreso', concepto: 'diferencia_arqueo', monto: cents(Math.abs(diferencia)), label: diferencia < 0 ? 'Faltante' : 'Sobrante' };
}
