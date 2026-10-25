// Finance: one ledger of money movements (ingreso, egreso, transferencia) validated into cash boxes (rendición).
// Pure TS, no Nest, no Prisma.

import type { TransitionCheck } from '../../../common/domain/state-machine';

export const MOVEMENT_TIPOS = ['ingreso', 'egreso', 'transferencia'] as const;

const CONCEPTOS: Record<string, readonly string[]> = {
  ingreso: ['adelanto', 'cobro', 'adicional', 'venta_directa', 'otro'],
  egreso: ['material', 'combustible', 'mantenimiento_vehicular', 'viaticos', 'servicios', 'sueldos', 'alquiler', 'impuestos', 'marketing', 'otro'],
  transferencia: ['deposito', 'retiro'],
};

/**
 * por_validar → validado | observado | anulado; observado → por_validar (corrected) | anulado; validado → anulado
 * (Gerencia or Contabilidad, with a reason: it leaves the box). Anulado is final. A validated movement is corrected by
 * editing it (FIN-03, owner 2026-10-24): every change stays in its history.
 */
const MOVEMENT_FLOW: Record<string, readonly string[]> = {
  por_validar: ['validado', 'observado', 'anulado'],
  observado: ['por_validar', 'anulado'],
  validado: ['anulado'],
  anulado: [],
};

export const MOVEMENT_ESTADOS = Object.keys(MOVEMENT_FLOW);

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

/**
 * Who may edit: whoever registered it while it waits (por_validar, observado); Gerencia and Contabilidad also once
 * validated. An annulled movement is never edited. Editing an observed one sends it back to validation.
 */
export function editMovementError(movement: { estado: string }, canManageMoney: boolean): string | null {
  if (movement.estado === 'anulado') return 'El movimiento está anulado';
  if (movement.estado === 'validado' && !canManageMoney) return 'Solo Gerencia o Contabilidad corrigen un movimiento validado';
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

/** Incomes registered and not yet validated, per person who holds the money ("por rendir"). Largest first. */
export function custody<T extends Movement & { recibidoPorId?: string | null }>(movements: T[]) {
  const byPerson = new Map<string, T[]>();
  for (const m of movements) {
    if (m.tipo !== 'ingreso' || m.estado !== 'por_validar' || !m.recibidoPorId) continue;
    byPerson.set(m.recibidoPorId, [...(byPerson.get(m.recibidoPorId) ?? []), m]);
  }
  return [...byPerson.entries()]
    .map(([userId, rows]) => ({ userId, total: total(rows), cantidad: rows.length, movimientos: rows }))
    .sort((a, b) => b.total - a.total);
}

export type Impact =
  | { tipo: 'caja'; cajaId: string; antes: number; despues: number }
  | { tipo: 'saldo'; antes: number; despues: number }
  | { tipo: 'costo'; antes: number; despues: number };

/**
 * What changes when a movement is validated into a box or annulled, so the person sees it before confirming:
 * the box balances, and the balance owed or the cost of its project or job.
 * boxes: validated balance per box; target: the project or job it belongs to (amount, collected, cost).
 */
export function movementImpact(
  m: Movement & { monto: number | string | { toString(): string } },
  accion: 'validar' | 'anular',
  ctx: { boxes: Record<string, number>; cajaId?: string | null; target?: { monto: number; cobrado: number; costo: number; cancelled: boolean } | null },
): Impact[] {
  const amount = Number(m.monto);
  const out: Impact[] = [];
  const box = (cajaId: string | null | undefined, delta: number) => {
    if (!cajaId) return;
    const antes = ctx.boxes[cajaId] ?? 0;
    out.push({ tipo: 'caja', cajaId, antes, despues: cents(antes + delta) });
  };
  const sign = m.tipo === 'ingreso' ? 1 : -1;
  if (accion === 'validar') {
    if (m.tipo === 'transferencia') {
      box(m.cajaId, -amount);
      box(m.cajaDestinoId, amount);
    } else box(ctx.cajaId ?? m.cajaId, sign * amount);
    return out;
  }
  if (m.estado === 'validado') {
    if (m.tipo === 'transferencia') {
      box(m.cajaId, amount);
      box(m.cajaDestinoId, -amount);
    } else box(m.cajaId, -sign * amount);
  }
  const t = ctx.target;
  if (t && COUNTED.includes(m.estado)) {
    if (m.tipo === 'ingreso' && BUDGET_INCOME.includes(m.concepto)) {
      out.push({ tipo: 'saldo', antes: balanceOf(t.monto, t.cobrado, t.cancelled), despues: balanceOf(t.monto, cents(t.cobrado - amount), t.cancelled) });
    }
    if (m.tipo === 'egreso') out.push({ tipo: 'costo', antes: t.costo, despues: cents(t.costo - amount) });
  }
  return out;
}
