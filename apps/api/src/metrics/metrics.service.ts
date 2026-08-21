import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { quotationWhere, relevamientoWhere, scheduleWhere, taskWhere } from '../auth/roles';
import type { User } from '@prisma/client';

const CATEGORY_LABELS: Record<string, string> = {
  seguridad_electronica: 'Seguridad Electrónica',
  insumos_tecnologicos: 'Tecnología',
  proyectos: 'Proyectos',
};

function emptyBucket(id: string, nombre: string) {
  return {
    id,
    nombre,
    cotizaciones: 0,
    ventas: 0,
    relevamientos: 0,
    montoCotizaciones: 0,
    montoVentas: 0,
  };
}

function pickTop(entries: Array<{ key: string; label: string; total: number }>) {
  if (!entries.length) return null;
  return entries.reduce((best, row) => (row.total > best.total ? row : best));
}

/** Por categoría: sucursal líder. Por vendedor activo: categoría que más registra. */
function categoryInsights(
  quotes: Array<{
    estado: string;
    categoriaId: string;
    categoria: string;
    sucursalId: string;
    sucursalNombre?: string;
    sucursal?: { nombre: string } | null;
    vendedorId: string;
    vendedor?: { name: string } | null;
    relevamientos?: { length: number } | unknown[];
  }>,
) {
  const catSuc = new Map<string, Map<string, { label: string; total: number }>>();
  const vendCat = new Map<string, { nombre: string; cats: Map<string, { label: string; total: number }> }>();

  for (const quote of quotes) {
    if (quote.estado === 'rechazado') continue;
    const catId = CATEGORY_LABELS[quote.categoriaId] ? quote.categoriaId : quote.categoriaId || 'otros';
    const catLabel = CATEGORY_LABELS[catId] || quote.categoria || catId;
    const sucId = quote.sucursalId || 'sin_sucursal';
    const sucLabel = quote.sucursal?.nombre || quote.sucursalNombre || sucId;
    const vendId = quote.vendedorId || 'sin_vendedor';
    const vendLabel = quote.vendedor?.name || vendId;
    const weight = 1 + (Array.isArray(quote.relevamientos) ? quote.relevamientos.length : 0);

    if (!catSuc.has(catId)) catSuc.set(catId, new Map());
    const sucMap = catSuc.get(catId)!;
    const sucRow = sucMap.get(sucId) || { label: sucLabel, total: 0 };
    sucRow.total += weight;
    sucMap.set(sucId, sucRow);

    if (!vendCat.has(vendId)) vendCat.set(vendId, { nombre: vendLabel, cats: new Map() });
    const vend = vendCat.get(vendId)!;
    const catRow = vend.cats.get(catId) || { label: catLabel, total: 0 };
    catRow.total += weight;
    vend.cats.set(catId, catRow);
  }

  const topSucursalPorCategoria = [...catSuc.entries()]
    .map(([catId, sucMap]) => {
      const top = pickTop([...sucMap.entries()].map(([key, row]) => ({ key, label: row.label, total: row.total })));
      if (!top || top.total <= 0) return null;
      return {
        categoriaId: catId,
        categoria: CATEGORY_LABELS[catId] || catId,
        sucursal: top.label,
        total: top.total,
      };
    })
    .filter(Boolean) as Array<{ categoriaId: string; categoria: string; sucursal: string; total: number }>;

  const topCategoriaPorVendedor = [...vendCat.entries()]
    .map(([vendedorId, row]) => {
      const top = pickTop([...row.cats.entries()].map(([key, cat]) => ({ key, label: cat.label, total: cat.total })));
      if (!top || top.total <= 0) return null;
      return {
        vendedorId,
        vendedor: row.nombre,
        categoria: top.label,
        total: top.total,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.total || 0) - (a?.total || 0)) as Array<{
      vendedorId: string;
      vendedor: string;
      categoria: string;
      total: number;
    }>;

  return { topSucursalPorCategoria, topCategoriaPorVendedor };
}

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  private monthRange(month?: string) {
    const prefix = month || new Date().toISOString().slice(0, 7);
    const start = new Date(`${prefix}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    return { prefix, start, end };
  }

  async sales(userId: string | undefined, month?: string) {
    const { prefix, start, end } = this.monthRange(month);
    const quotes = await this.prisma.quotation.findMany({
      where: {
        createdAt: { gte: start, lt: end },
        ...(userId ? { vendedorId: userId } : {}),
      },
      include: { sale: true },
    });
    const open = quotes.filter((row) => row.estado !== 'rechazado' && row.estado !== 'borrador');
    const sold = quotes.filter((row) => row.estado === 'aceptado' || Boolean(row.sale));
    const quotationsTotal = open.reduce((sum, row) => sum + Number(row.monto), 0);
    const salesTotal = sold.reduce((sum, row) => sum + Number(row.monto), 0);

    const goals = await this.prisma.sellerGoal.findMany({
      where: {
        mes: start,
        ...(userId ? { usuarioId: userId } : {}),
      },
    });
    const goalBs = goals.reduce((sum, row) => sum + Number(row.metaMonto), 0);

    return {
      month: prefix,
      quotationsTotal,
      salesTotal,
      goalBs,
      remainingBs: Math.max(0, goalBs - salesTotal),
    };
  }

  async activity(userId: string | undefined, month?: string) {
    const { prefix, start, end } = this.monthRange(month);
    const quotes = await this.prisma.quotation.findMany({
      where: {
        createdAt: { gte: start, lt: end },
        ...(userId ? { vendedorId: userId } : {}),
      },
      include: { sucursal: true, vendedor: true, relevamientos: true, sale: true },
    });

    const byVendedorMap = new Map<string, ReturnType<typeof emptyBucket>>();
    const bySucursalMap = new Map<string, ReturnType<typeof emptyBucket>>();
    const byCategoriaMap = new Map<string, ReturnType<typeof emptyBucket>>();
    for (const key of Object.keys(CATEGORY_LABELS)) {
      byCategoriaMap.set(key, emptyBucket(key, CATEGORY_LABELS[key]));
    }

    const bump = (bucket: ReturnType<typeof emptyBucket>, quote: (typeof quotes)[0]) => {
      const amount = Number(quote.monto);
      if (quote.estado !== 'rechazado') {
        bucket.cotizaciones += 1;
        bucket.montoCotizaciones += amount;
      }
      if (quote.estado === 'aceptado' || quote.sale) {
        bucket.ventas += 1;
        bucket.montoVentas += amount;
      }
      bucket.relevamientos += quote.relevamientos.length;
    };

    for (const quote of quotes) {
      const vendor = byVendedorMap.get(quote.vendedorId) || emptyBucket(quote.vendedorId, quote.vendedor?.name || '');
      bump(vendor, quote);
      byVendedorMap.set(quote.vendedorId, vendor);

      const sucursal = bySucursalMap.get(quote.sucursalId)
        || emptyBucket(quote.sucursalId, quote.sucursal?.nombre || quote.sucursalNombre);
      bump(sucursal, quote);
      bySucursalMap.set(quote.sucursalId, sucursal);

      const catId = CATEGORY_LABELS[quote.categoriaId] ? quote.categoriaId : quote.categoriaId || 'otros';
      const cat = byCategoriaMap.get(catId) || emptyBucket(catId, CATEGORY_LABELS[catId] || quote.categoria || catId);
      bump(cat, quote);
      byCategoriaMap.set(catId, cat);
    }

    const goals = await this.prisma.sellerGoal.findMany({
      where: { mes: start, ...(userId ? { usuarioId: userId } : {}) },
    });
    const goalBs = goals.reduce((sum, row) => sum + Number(row.metaMonto), 0);

    const scheduleWhereExtra = userId ? { OR: [{ vendedorId: userId }, { tecnicoId: userId }] } : {};
    const schedules = await this.prisma.schedule.findMany({
      where: {
        fechaProgramada: { gte: start, lt: end },
        ...scheduleWhereExtra,
      },
    });
    const byEstado = schedules.reduce(
      (acc, row) => {
        acc[row.estado] = (acc[row.estado] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      month: prefix,
      goalBs,
      byVendedor: [...byVendedorMap.values()],
      bySucursal: [...bySucursalMap.values()],
      byCategoria: [...byCategoriaMap.values()],
      categoryInsights: categoryInsights(quotes),
      schedules: {
        total: schedules.length,
        byEstado,
        montoTotal: schedules.reduce((sum, row) => sum + Number(row.monto), 0),
      },
    };
  }

  async feed(user: User) {
    const quoteFilter = quotationWhere(user);
    const [quotes, relevamientos, tasks, schedules] = await Promise.all([
      this.prisma.quotation.findMany({
        where: quoteFilter.id === '__none__' ? { id: '__none__' } : quoteFilter,
        include: { cliente: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.relevamiento.findMany({
        where: relevamientoWhere(user),
        include: { cliente: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.task.findMany({
        where: taskWhere(user),
        orderBy: { updatedAt: 'desc' },
        take: 20,
        include: { creador: { select: { name: true } }, asignado: { select: { name: true } } },
      }),
      this.prisma.schedule.findMany({
        where: scheduleWhere(user),
        include: { cliente: true },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      }),
    ]);

    const events = [
      ...quotes.map((row) => ({
        type: 'cotizacion',
        id: row.id,
        at: row.createdAt,
        titulo: `${row.numero} · ${row.titulo}`,
        detalle: `${row.cliente?.nombre || ''} · ${row.estado}`,
      })),
      ...relevamientos.map((row) => ({
        type: 'relevamiento',
        id: row.id,
        at: row.createdAt,
        titulo: row.lugar,
        detalle: row.cliente?.nombre || '',
      })),
      ...tasks.map((row) => ({
        type: 'tarea',
        id: row.id,
        at: row.updatedAt,
        titulo: row.titulo,
        detalle: `${row.estado} · ${row.asignado?.name || row.creador?.name || ''}`,
      })),
      ...schedules.map((row) => ({
        type: 'cronograma',
        id: row.id,
        at: row.updatedAt,
        titulo: row.descripcionTrabajo.slice(0, 80),
        detalle: `${row.cliente?.nombre || ''} · ${row.estado}`,
      })),
    ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    return events.slice(0, 40);
  }
}
