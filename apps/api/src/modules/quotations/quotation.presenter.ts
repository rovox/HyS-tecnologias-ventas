import type { Prisma } from '@prisma/client';
import { expiresAt, nextStates } from './domain/quotations.rules';

const CATEGORY = { select: { id: true, label: true } } as const;
const USER_NAME = { select: { id: true, name: true } } as const;
/** What every quotation response carries: client, division, sellers, project link and counters for smart buttons. */
export const DETAIL = {
  sellers: true,
  cliente: { select: { id: true, nombre: true, direccion: true } },
  sucursal: { select: { id: true, nombre: true } },
  categoria: CATEGORY,
  vendedor: USER_NAME,
  eliminadaPor: USER_NAME,
  sale: true,
  schedules: { select: { id: true, estado: true }, orderBy: { createdAt: 'asc' }, take: 1 },
  _count: { select: { relevamientos: true, tasks: true } },
} satisfies Prisma.QuotationInclude;

export type QuotationRow = Prisma.QuotationGetPayload<{ include: typeof DETAIL }>;

/** API shape: the row plus what the UI must not compute itself (allowed transitions, expiry, project link). */
export function present(row: QuotationRow) {
  return {
    ...row,
    proyectoId: row.schedules[0]?.id ?? null,
    venceEl: row.estado === 'enviado' ? expiresAt(row.fechaEnvio) : null,
    transicionesValidas: nextStates(row),
    puedeEliminar: !row.eliminadaAt && row.estado !== 'aprobado',
  };
}
