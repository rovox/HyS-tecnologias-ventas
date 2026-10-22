// Schedules (today's Proyecto/Actividad): state machine and balance rules. Pure TS, no Nest, no Prisma.

import type { TransitionCheck } from './pedidos-internos';

const SCHEDULE_FLOW: Record<string, readonly string[]> = {
  programado: ['en_proceso', 'cancelado'],
  en_proceso: ['terminado', 'cancelado'],
  terminado: [],
  cancelado: [],
};

export function checkScheduleTransition(from: string, to: string): TransitionCheck {
  if (!(to in SCHEDULE_FLOW)) return { ok: false, reason: `Estado desconocido: ${to}` };
  if (!(SCHEDULE_FLOW[from] ?? []).includes(to)) return { ok: false, reason: `Transición inválida: ${from} → ${to}` };
  return { ok: true };
}

/** Payment types that reduce the balance: money received against the budget, or forgiven debt (descuento). */
const BUDGET_TIPOS = ['adelanto', 'cobro', 'descuento'] as const;
export const PAYMENT_TIPOS = [...BUDGET_TIPOS, 'extra_asistencia'] as const;

const cents = (value: number) => Math.round(value * 100) / 100;

const countsAgainstBudget = (tipo: string) => (BUDGET_TIPOS as readonly string[]).includes(tipo);

type PaymentRow = { tipo: string; monto: number | string | { toString(): string } };

/** Sum of the payments that reduce the balance. */
export function budgetPaid(payments: PaymentRow[]): number {
  return cents(payments.filter((p) => countsAgainstBudget(p.tipo)).reduce((sum, p) => sum + Number(p.monto), 0));
}

export function saldo(monto: number, paid: number): number {
  return Math.max(0, cents(Number(monto) - Number(paid)));
}

type PaymentInput = { tipo: string; monto: number };
type ScheduleMoney = { estado: string; monto: number; paid: number };

/** Why a payment cannot be registered, or null when it can. */
export function paymentError(schedule: ScheduleMoney, payment: PaymentInput): string | null {
  if (!(PAYMENT_TIPOS as readonly string[]).includes(payment.tipo)) return `Tipo de cobro no válido: ${payment.tipo}`;
  if (!(Number(payment.monto) > 0)) return 'El monto debe ser mayor a 0';
  if (schedule.estado === 'cancelado' && payment.tipo !== 'descuento') return 'No se registran cobros en un trabajo cancelado';
  if (!countsAgainstBudget(payment.tipo)) return null;
  const pending = saldo(schedule.monto, schedule.paid);
  if (cents(payment.monto) > pending) {
    return `El monto (${cents(payment.monto)}) supera el saldo pendiente (${pending}). Registra el excedente como adicional.`;
  }
  return null;
}

/**
 * Old rows kept the advance only in `schedule.adelanto`, without a payment row. Before the first payment
 * is registered that advance becomes a real payment, so the balance always derives from payment rows.
 */
export function legacyAdvance(adelanto: number, payments: PaymentRow[]): number {
  return payments.some((p) => countsAgainstBudget(p.tipo)) ? 0 : cents(Number(adelanto) || 0);
}

/** A project created from a quotation keeps the quotation total as its official amount. */
export function montoChangeError(current: { quotationId?: string | null; monto: number }, requested?: number): string | null {
  if (requested === undefined || !current.quotationId) return null;
  if (cents(requested) === cents(Number(current.monto))) return null;
  return 'El monto de un proyecto viene de la cotización aceptada y no se modifica';
}

/**
 * Editing `adelanto` on the form: unchanged is a no-op; a new advance on a job without payments becomes an
 * `adelanto` payment of the difference; once payments exist it must go through the payments endpoint.
 */
export function adelantoChange(paid: number, hasPayments: boolean, requested?: number): { ok: true; payment: number } | { ok: false; reason: string } {
  if (requested === undefined || cents(requested) === cents(paid)) return { ok: true, payment: 0 };
  if (hasPayments || cents(requested) < cents(paid)) {
    return { ok: false, reason: 'El adelanto se registra como cobro desde el detalle del trabajo' };
  }
  return { ok: true, payment: cents(requested - paid) };
}
