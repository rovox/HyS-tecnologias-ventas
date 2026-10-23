import type { Prisma } from '@prisma/client';
import { nextMovementStates, pendingRefund } from './domain/finance.rules';

const USER_NAME = { select: { id: true, name: true } } as const;
const BOX = { select: { id: true, nombre: true } } as const;

export const MOVEMENT_DETAIL = {
  project: { select: { id: true, codigo: true, titulo: true } },
  schedule: { select: { id: true, descripcionTrabajo: true } },
  cliente: { select: { id: true, nombre: true } },
  caja: BOX,
  cajaDestino: BOX,
  sucursal: { select: { id: true, nombre: true } },
  registradoPor: USER_NAME,
  validadoPor: USER_NAME,
} satisfies Prisma.CashMovementInclude;

type MovementRow = Prisma.CashMovementGetPayload<{ include: typeof MOVEMENT_DETAIL }>;

/** API shape: the movement plus what the UI must not decide (allowed transitions, refund owed). */
export function presentMovement(row: MovementRow) {
  return {
    ...row,
    transicionesValidas: nextMovementStates(row.estado),
    reembolsoPendiente: pendingRefund(row),
  };
}
