import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../../common/prisma/prisma.service';
import { itemTotal, nextStates, orderCode, pedidoTotal } from './domain/pedidos-internos.rules';

const PERSON = { select: { id: true, name: true } } as const;

export const PEDIDO_INCLUDE = {
  responsable: PERSON,
  solicitante: PERSON,
  sucursalOrigen: { select: { id: true, nombre: true } },
  items: true,
  _count: { select: { comentarios: true } },
} satisfies Prisma.PedidoInternoInclude;

type PedidoRow = Prisma.PedidoInternoGetPayload<{ include: typeof PEDIDO_INCLUDE }>;

/**
 * API shape of internal orders: a readable code, who asked and who receives, where it goes (a branch, or a job with
 * its client and project), who delivered it, totals and the transitions the user may take. Destination branch, job
 * and deliverer are plain ids in the table, so their names are looked up in one query each.
 */
export async function presentPedidos(prisma: PrismaService, rows: PedidoRow[]) {
  const ids = (pick: (r: PedidoRow) => string | null) => [...new Set(rows.map(pick).filter((v): v is string => Boolean(v)))];
  const [branches, jobs, people] = await Promise.all([
    prisma.sucursal.findMany({ where: { id: { in: ids((r) => r.sucursalDestinoId) } }, select: { id: true, nombre: true } }),
    prisma.schedule.findMany({
      where: { id: { in: ids((r) => r.cronogramaId) } },
      select: {
        id: true,
        descripcionTrabajo: true,
        fechaProgramada: true,
        estado: true,
        cliente: { select: { id: true, nombre: true } },
        project: { select: { id: true, codigo: true } },
      },
    }),
    prisma.user.findMany({ where: { id: { in: ids((r) => r.entregadoPorId) } }, select: { id: true, name: true } }),
  ]);
  const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((x) => [x.id, x]));
  const branch = byId(branches);
  const job = byId(jobs);
  const person = byId(people);

  return rows.map((r) => {
    const items = r.items.map((i) => ({ ...i, cantidad: Number(i.cantidad), costoUnitario: i.costoUnitario == null ? null : Number(i.costoUnitario) }));
    const trabajo = r.cronogramaId ? job.get(r.cronogramaId) ?? null : null;
    return {
      ...r,
      items: items.map((i) => ({ ...i, costoTotal: itemTotal(i) })),
      codigo: orderCode(r.id),
      destino: trabajo
        ? { tipo: 'trabajo' as const, trabajo }
        : { tipo: 'sucursal' as const, sucursal: r.sucursalDestinoId ? branch.get(r.sucursalDestinoId) ?? null : null },
      entregadoPor: r.entregadoPorId ? person.get(r.entregadoPorId) ?? null : null,
      costoTotal: pedidoTotal(items),
      transicionesValidas: nextStates(r.estado),
    };
  });
}
