import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../../common/prisma/prisma.service';
import { inWarranty, nextVisitStates, visitPayments } from './domain/relevamientos.rules';

const PERSON = { select: { id: true, name: true } } as const;

export const VISIT_INCLUDE = {
  cliente: { select: { id: true, nombre: true, telefono: true, direccion: true, mapsLink: true } },
  sucursal: { select: { id: true, nombre: true } },
  cotizacion: { select: { id: true, numero: true, titulo: true } },
  usuario: PERSON,
  trabajoRelacionado: {
    select: { id: true, descripcionTrabajo: true, fechaProgramada: true, estado: true, project: { select: { id: true, codigo: true } } },
  },
  movements: {
    select: { id: true, monto: true, metodo: true, estado: true, fecha: true, recibidoPor: PERSON },
    orderBy: { fecha: 'desc' },
  },
} satisfies Prisma.RelevamientoInclude;

type VisitRow = Prisma.RelevamientoGetPayload<{ include: typeof VISIT_INCLUDE }>;

/** Photo URLs kept as an array (older rows stored `{ urls: [] }`). */
export function fotosOf(fotosUrl: unknown): string[] {
  if (Array.isArray(fotosUrl)) return fotosUrl.map(String).filter(Boolean);
  if (fotosUrl && typeof fotosUrl === 'object' && Array.isArray((fotosUrl as { urls?: unknown }).urls)) {
    return ((fotosUrl as { urls: unknown[] }).urls || []).map(String).filter(Boolean);
  }
  return [];
}

/**
 * API shape of a visit: names of the técnico and seller (plain ids in the table), photos as a list, warranty status,
 * the money taken on it (ledger) and the states it may move to.
 */
export async function presentVisits(prisma: PrismaService, rows: VisitRow[]) {
  const ids = [...new Set(rows.flatMap((r) => [r.tecnicoId, r.vendedorId]).filter((v): v is string => Boolean(v)))];
  const people = new Map((await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })).map((u) => [u.id, u]));
  return rows.map((r) => ({
    ...r,
    tecnico: r.tecnicoId ? people.get(r.tecnicoId) ?? null : null,
    vendedor: r.vendedorId ? people.get(r.vendedorId) ?? null : null,
    fotos: fotosOf(r.fotosUrl),
    enGarantia: inWarranty(r.garantiaHasta, r.fecha),
    movements: r.movements.map((m) => ({ ...m, monto: Number(m.monto) })),
    ...visitPayments(r.movements),
    transicionesValidas: nextVisitStates(r.estado),
  }));
}
