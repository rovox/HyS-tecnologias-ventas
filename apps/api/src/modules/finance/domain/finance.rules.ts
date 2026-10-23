// Finance: one ledger of money movements (ingreso, egreso, transferencia) validated into cash boxes (rendición).
// Pure TS, no Nest, no Prisma.

import type { TransitionCheck } from '../../../common/domain/state-machine';

export const MOVEMENT_TIPOS = ['ingreso', 'egreso', 'transferencia'] as const;

export const CONCEPTOS: Record<string, readonly string[]> = {
  ingreso: ['adelanto', 'cobro', 'adicional', 'venta_directa', 'otro'],
  egreso: ['material', 'combustible', 'mantenimiento_vehicular', 'viaticos', 'servicios', 'sueldos', 'alquiler', 'impuestos', 'marketing', 'otro'],
  transferencia: ['deposito', 'retiro'],
};

/** por_validar → validado | observado | anulado; observado → por_validar (corrected) | anulado. Validated is final. */
const MOVEMENT_FLOW: Record<string, readonly string[]> = {
  por_validar: ['validado', 'observado', 'anulado'],
  observado: ['por_validar', 'anulado'],
  validado: [],
  anulado: [],
};

export const MOVEMENT_ESTADOS = Object.keys(MOVEMENT_FLOW);
export const CASH_BOX_TIPOS = ['caja', 'caja_chica', 'banco', 'qr'] as const;

/** Money received against the official amount (an "adicional" is charged on top and does not reduce the balance). */
const BUDGET_INCOME = ['adelanto', 'cobro'];
/** Movements that count: registered (pending validation) or validated. Observed and cancelled ones do not. */
const COUNTED = ['por_validar', 'validado'];

const cents = (value: number) => Math.round(value * 100) / 100;

type Movement = {
  tipo: string;
  concepto: string;
  monto: number | string | { toString(): string };
  estado: string;
  cajaId?: string | null;
  cajaDestinoId?: string | null;
};

const total = (rows: Movement[]) => cents(rows.reduce((sum, m) => sum + Number(m.monto), 0));

export type MovementInput = {
  tipo: string;
  concepto: string;
  monto: number;
  cajaId?: string | null;
  cajaDestinoId?: string | null;
  pagadoPor?: string | null;
};

/** Why a movement cannot be registered, or null. */
export function movementError(input: MovementInput): string | null {
  if (!MOVEMENT_TIPOS.includes(input.tipo as never)) return `Tipo de movimiento no válido: ${input.tipo}`;
  if (!(CONCEPTOS[input.tipo] ?? []).includes(input.concepto)) return `Concepto no válido para ${input.tipo}: ${input.concepto}`;
  if (!(Number(input.monto) > 0)) return 'El monto debe ser mayor a 0';
  if (input.tipo === 'transferencia') {
    if (!input.cajaId || !input.cajaDestinoId) return 'Una transferencia necesita caja de origen y de destino';
    if (input.cajaId === input.cajaDestinoId) return 'La caja de origen y destino deben ser distintas';
  }
  if (input.tipo === 'egreso' && !['empresa', 'empleado'].includes(input.pagadoPor || '')) return 'Indica quién pagó: empresa o empleado';
  return null;
}

export function nextMovementStates(estado: string): readonly string[] {
  return MOVEMENT_FLOW[estado] ?? [];
}

/** Validation (rendición) assigns a cash box; observing and cancelling need a reason. */
export function checkMovementTransition(
  movement: { estado: string; tipo: string },
  to: string,
  input: { cajaId?: string | null; motivo?: string | null },
): TransitionCheck {
  if (!nextMovementStates(movement.estado).includes(to)) return { ok: false, reason: `Transición inválida: ${movement.estado} → ${to}` };
  if (to === 'validado' && movement.tipo !== 'transferencia' && !input.cajaId) return { ok: false, reason: 'Elige la caja donde queda el dinero' };
  if ((to === 'observado' || to === 'anulado') && !input.motivo?.trim()) return { ok: false, reason: 'Indica el motivo' };
  return { ok: true };
}

/** A movement can be edited while it is not validated nor cancelled; editing an observed one sends it back to validation. */
export function editMovementError(movement: { estado: string }): string | null {
  if (movement.estado === 'validado') return 'Un movimiento validado no se edita: se corrige con un movimiento inverso';
  if (movement.estado === 'anulado') return 'El movimiento está anulado';
  return null;
}

/** Collected for a project or job: advances and payments, registered or validated; also what still awaits validation. */
export function incomeOf(movements: Movement[]) {
  const budget = movements.filter((m) => m.tipo === 'ingreso' && BUDGET_INCOME.includes(m.concepto) && COUNTED.includes(m.estado));
  return {
    cobrado: total(budget),
    porValidar: total(budget.filter((m) => m.estado === 'por_validar')),
    adicionales: total(movements.filter((m) => m.tipo === 'ingreso' && m.concepto === 'adicional' && COUNTED.includes(m.estado))),
  };
}

/** Expenses charged to a project (part of its cost). */
export function expensesOf(movements: Movement[]): number {
  return total(movements.filter((m) => m.tipo === 'egreso' && COUNTED.includes(m.estado)));
}

/** Balance still owed; a cancelled project or job owes nothing. */
export function balanceOf(monto: number, cobrado: number, cancelled: boolean): number {
  return cancelled ? 0 : Math.max(0, cents(Number(monto) - cobrado));
}

/** Why an income cannot be registered on a project or job, or null. The excess over the balance is an "adicional". */
export function incomeError(target: { monto: number; cobrado: number; cancelled: boolean; closed?: boolean }, concepto: string, monto: number): string | null {
  if (target.cancelled) return 'No se registran cobros en un proyecto o trabajo anulado';
  if (target.closed) return 'El proyecto está cerrado';
  if (!BUDGET_INCOME.includes(concepto)) return null;
  const pending = balanceOf(target.monto, target.cobrado, false);
  if (cents(monto) > pending) return `El monto (${cents(monto)}) supera el saldo pendiente (${pending}). Registra el excedente como adicional.`;
  return null;
}

/** Validated money in a cash box: incomes in, expenses out, transfers out of the origin and into the destination. */
export function cashBoxBalance(cajaId: string, movements: Movement[]): number {
  const validated = movements.filter((m) => m.estado === 'validado');
  const into = validated.filter((m) => (m.tipo === 'ingreso' && m.cajaId === cajaId) || (m.tipo === 'transferencia' && m.cajaDestinoId === cajaId));
  const out = validated.filter((m) => (m.tipo === 'egreso' && m.cajaId === cajaId) || (m.tipo === 'transferencia' && m.cajaId === cajaId));
  return cents(total(into) - total(out));
}

/** Expense paid by an employee and not yet given back. */
export function pendingRefund(m: { tipo: string; pagadoPor?: string | null; reembolsadoAt?: Date | string | null; estado: string }): boolean {
  return m.tipo === 'egreso' && m.pagadoPor === 'empleado' && !m.reembolsadoAt && m.estado !== 'anulado';
}

/** The movement that cancels a validated one: same amount, opposite direction. */
export function reversalOf(m: { tipo: string; concepto: string; cajaId?: string | null; cajaDestinoId?: string | null }) {
  if (m.tipo === 'transferencia') return { tipo: 'transferencia', concepto: m.concepto, cajaId: m.cajaDestinoId ?? null, cajaDestinoId: m.cajaId ?? null };
  return { tipo: m.tipo === 'ingreso' ? 'egreso' : 'ingreso', concepto: 'otro', cajaId: m.cajaId ?? null, cajaDestinoId: null };
}
