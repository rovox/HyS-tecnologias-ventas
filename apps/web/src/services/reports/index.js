import * as store from '@/mocks/store.js';
import { apiClient, authToken, isMockMode } from '@/api/http.js';
import mockAdapter from '@/api/mockAdapter.js';
import { ROLES } from '@/mocks/users.js';
import { QUOTATION_MAIN_CATEGORIES } from '@/mocks/quotations.js';

function emptyBucket(id, nombre) {
  return { id, nombre, cotizaciones: 0, ventas: 0, relevamientos: 0, montoCotizaciones: 0, montoVentas: 0 };
}

function pickTop(entries) {
  if (!entries.length) return null;
  return entries.reduce((best, row) => (row.total > best.total ? row : best));
}

function buildCategoryInsights(quotes, visits = []) {
  const catSuc = new Map();
  const vendCat = new Map();

  const bump = (catId, catLabel, sucId, sucLabel, vendId, vendLabel, weight = 1) => {
    if (!catSuc.has(catId)) catSuc.set(catId, new Map());
    const sucMap = catSuc.get(catId);
    const sucRow = sucMap.get(sucId) || { label: sucLabel, total: 0 };
    sucRow.total += weight;
    sucMap.set(sucId, sucRow);

    if (!vendId) return;
    if (!vendCat.has(vendId)) vendCat.set(vendId, { nombre: vendLabel, cats: new Map() });
    const vend = vendCat.get(vendId);
    const catRow = vend.cats.get(catId) || { label: catLabel, total: 0 };
    catRow.total += weight;
    vend.cats.set(catId, catRow);
  };

  for (const quote of quotes) {
    if (quote.estado === 'rechazado') continue;
    const catMeta = QUOTATION_MAIN_CATEGORIES.find((c) => c.id === quote.categoria_id);
    const catId = quote.categoria_id || 'otros';
    const catLabel = catMeta?.label || quote.categoria || catId;
    bump(
      catId,
      catLabel,
      quote.sucursal_id || 'sin_sucursal',
      quote.sucursal_nombre || quote.sucursal_id || 'Sin sucursal',
      quote.vendedor_id,
      quote.vendedor_nombre || quote.vendedor_id,
      1,
    );
  }

  for (const visit of visits) {
    const quote = store.findById('quotations', visit.cotizacion_id || visit.cotizacionId);
    const catId = quote?.categoria_id;
    if (!catId) continue;
    const catMeta = QUOTATION_MAIN_CATEGORIES.find((c) => c.id === catId);
    bump(
      catId,
      catMeta?.label || quote.categoria || catId,
      visit.sucursal_id || quote.sucursal_id || 'sin_sucursal',
      visit.sucursal_nombre || quote.sucursal_nombre || visit.sucursal_id || 'Sin sucursal',
      visit.created_by || visit.usuario_id || quote.vendedor_id,
      visit.usuario_nombre || quote.vendedor_nombre || '',
      1,
    );
  }

  const topSucursalPorCategoria = [...catSuc.entries()]
    .map(([catId, sucMap]) => {
      const top = pickTop([...sucMap.entries()].map(([key, row]) => ({ key, label: row.label, total: row.total })));
      if (!top || top.total <= 0) return null;
      const catMeta = QUOTATION_MAIN_CATEGORIES.find((c) => c.id === catId);
      return {
        categoriaId: catId,
        categoria: catMeta?.label || catId,
        sucursal: top.label,
        total: top.total,
      };
    })
    .filter(Boolean);

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
    .sort((a, b) => b.total - a.total);

  return { topSucursalPorCategoria, topCategoriaPorVendedor };
}

export const reportsService = {
  async getDashboard() {
    const schedules = store.list('schedules');
    const payments = store.list('schedule_payments');
    const gastos = store.list('gastos_operativos');
    const costos = store.list('costos_trabajo');
    const goals = store.list('salesperson_goals');
    const sucursales = store.list('sucursales', { filter: 'activa = true' });
    const vehicles = store.list('vehiculos', { filter: 'estado = activo' });
    const pedidos = store.list('pedidos_internos', { sort: '-created' });
    const campaigns = store.list('campaigns_new', { filter: 'status = "active"' });

    const ventas = schedules.reduce((sum, job) => sum + (Number(job.monto) || 0), 0);
    const cobrado = payments.reduce((sum, row) => sum + (Number(row.monto_cobrado) || 0), 0);
    const cxc = schedules.reduce((sum, job) => sum + Math.max(0, Number(job.saldo) || 0), 0);
    const gastosMes = gastos.reduce((sum, row) => sum + (Number(row.monto) || 0), 0);
    const costosMes = costos.reduce((sum, row) => sum + (Number(row.costo_total) || 0), 0);
    const meta = goals.reduce((sum, row) => sum + (Number(row.monthly_goal) || 0), 0);

    return {
      ventas,
      cobrado,
      cxc,
      gastosMes,
      costosMes,
      utilidadEstimada: ventas - costosMes - gastosMes,
      meta,
      metaPct: meta > 0 ? Math.round((cobrado / meta) * 100) : 0,
      byEstado: {
        programado: schedules.filter((row) => row.estado === 'programado').length,
        en_proceso: schedules.filter((row) => row.estado === 'en_proceso').length,
        terminado: schedules.filter((row) => row.estado === 'terminado').length,
        cancelado: schedules.filter((row) => row.estado === 'cancelado').length,
      },
      sucursales,
      vehicles,
      pedidos: pedidos.slice(0, 8),
      campaigns,
      schedules,
      payments,
      goals,
    };
  },

  /** Cotizaciones, ventas y meta mensual. Sin costos ni estado de resultados. */
  async getSalesMetrics({ userId, month } = {}) {
    if (!isMockMode) {
      return apiClient.get('metrics/sales', { token: authToken(), query: { userId, month } });
    }
    const prefix = month || new Date().toISOString().slice(0, 7);
    const inMonth = (quote) => String(quote.fecha || quote.created || '').startsWith(prefix);
    const amount = (quote) => Number(quote.total ?? quote.monto) || 0;
    const isVendor = (quote) => {
      if (!userId) return true;
      if (quote.vendedor_id === userId) return true;
      return Array.isArray(quote.vendedores) && quote.vendedores.some((row) => row.user_id === userId);
    };
    const isSale = (quote) => quote.estado === 'aceptado' || Boolean(quote.schedule_id);

    const quotes = store
      .list('quotations')
      .filter((row) => row.kind === 'commercial' && inMonth(row) && isVendor(row));
    const quotationsTotal = quotes
      .filter((row) => row.estado !== 'rechazado' && row.estado !== 'borrador')
      .reduce((sum, row) => sum + amount(row), 0);
    const salesTotal = quotes.filter(isSale).reduce((sum, row) => sum + amount(row), 0);
    const goals = store.list('salesperson_goals');
    const goalBs = userId
      ? Number(goals.find((row) => row.user_id === userId)?.monthly_goal) || 0
      : goals.reduce((sum, row) => sum + (Number(row.monthly_goal) || 0), 0);

    return {
      month: prefix,
      quotationsTotal,
      salesTotal,
      goalBs,
      remainingBs: Math.max(0, goalBs - salesTotal),
    };
  },

  async getSalesActivity({ userId, month } = {}) {
    if (!isMockMode) {
      return apiClient.get('metrics/activity', { token: authToken(), query: { userId, month } });
    }
    const me = mockAdapter.authStore.record;
    const scopedId = me?.role === ROLES.VENTAS ? me.id : userId;
    const prefix = month || new Date().toISOString().slice(0, 7);
    const quotes = store.list('quotations').filter((row) => {
      if (row.kind === 'library') return false;
      return String(row.fecha || row.created || '').startsWith(prefix);
    });
    const visits = store.list('visitas_tecnicas') || [];
    const byVendedorMap = new Map();
    const bySucursalMap = new Map();
    const byCategoriaMap = new Map();
    QUOTATION_MAIN_CATEGORIES.forEach((cat) => byCategoriaMap.set(cat.id, emptyBucket(cat.id, cat.label)));

    const bump = (bucket, quote) => {
      const amount = Number(quote.total ?? quote.monto) || 0;
      if (quote.estado !== 'rechazado') {
        bucket.cotizaciones += 1;
        bucket.montoCotizaciones += amount;
      }
      if (quote.estado === 'aceptado' || quote.schedule_id) {
        bucket.ventas += 1;
        bucket.montoVentas += amount;
      }
    };

    for (const quote of quotes) {
      if (scopedId && quote.vendedor_id !== scopedId) continue;
      const vendor = byVendedorMap.get(quote.vendedor_id) || emptyBucket(quote.vendedor_id, quote.vendedor_nombre || '');
      bump(vendor, quote);
      byVendedorMap.set(quote.vendedor_id, vendor);
      const sucursal = bySucursalMap.get(quote.sucursal_id) || emptyBucket(quote.sucursal_id, quote.sucursal_nombre || quote.sucursal_id);
      bump(sucursal, quote);
      bySucursalMap.set(quote.sucursal_id, sucursal);
      const catId = quote.categoria_id || 'otros';
      const catMeta = QUOTATION_MAIN_CATEGORIES.find((c) => c.id === catId);
      const cat = byCategoriaMap.get(catId) || emptyBucket(catId, catMeta?.label || quote.categoria || catId);
      bump(cat, quote);
      byCategoriaMap.set(catId, cat);
    }
    visits.forEach((row) => {
      if (scopedId && row.created_by !== scopedId && row.usuario_id !== scopedId) return;
      const sucursal = bySucursalMap.get(row.sucursal_id);
      if (sucursal) sucursal.relevamientos += 1;
      const vendor = byVendedorMap.get(row.created_by || row.usuario_id);
      if (vendor) vendor.relevamientos += 1;
      const quote = store.findById('quotations', row.cotizacion_id || row.cotizacionId);
      const catId = quote?.categoria_id;
      if (catId && byCategoriaMap.has(catId)) byCategoriaMap.get(catId).relevamientos += 1;
    });
    const goals = store.list('salesperson_goals');
    const goalBs = scopedId
      ? Number(goals.find((row) => row.user_id === scopedId)?.monthly_goal) || 0
      : goals.reduce((sum, row) => sum + (Number(row.monthly_goal) || 0), 0);
    const scopedQuotes = quotes.filter((q) => !scopedId || q.vendedor_id === scopedId);
    const scopedVisits = visits.filter((row) => {
      if (scopedId && row.created_by !== scopedId && row.usuario_id !== scopedId) return false;
      return true;
    });
    return {
      month: prefix,
      goalBs,
      byVendedor: [...byVendedorMap.values()],
      bySucursal: [...bySucursalMap.values()],
      byCategoria: [...byCategoriaMap.values()],
      categoryInsights: buildCategoryInsights(scopedQuotes, scopedVisits),
    };
  },

  async getFeed() {
    if (!isMockMode) {
      return apiClient.get('metrics/feed', { token: authToken() });
    }
    const me = mockAdapter.authStore.record;
    const quotes = store.list('quotations', { sort: '-created' }).filter((row) => {
      if (row.kind === 'library') return false;
      if (me?.role === ROLES.VENTAS) return row.vendedor_id === me.id;
      return true;
    }).slice(0, 12).map((row) => ({
      type: 'cotizacion',
      id: row.id,
      at: row.created || row.fecha,
      titulo: `${row.numero || ''} · ${row.titulo}`,
      detalle: `${row.cliente_nombre || ''} · ${row.estado}`,
    }));
    const surveys = store.list('visitas_tecnicas', { sort: '-created' }).filter((row) => {
      if (me?.role === ROLES.VENTAS) return row.created_by === me.id || row.usuario_id === me.id;
      return true;
    }).slice(0, 12).map((row) => ({
      type: 'relevamiento',
      id: row.id,
      at: row.created || row.fecha,
      titulo: row.lugar || row.tipo_visita || 'Relevamiento',
      detalle: row.cliente_nombre || '',
    }));
    const sales = store.list('schedules', { sort: '-created' }).filter((row) => {
      if (me?.role === ROLES.VENTAS) return row.vendedor_responsable_id === me.id;
      return true;
    }).slice(0, 12).map((row) => ({
      type: 'venta',
      id: row.id,
      at: row.created || row.fecha_programada,
      titulo: row.descripcion_trabajo || row.lugar || 'Venta',
      detalle: `${row.cliente || ''} · ${row.estado}`,
    }));
    const suc = me?.sucursalId || me?.department;
    const tasks = store.list('tasks', { sort: '-created' }).filter((row) => {
      if (me?.role === ROLES.ADMIN) return true;
      if (me?.role === ROLES.VENTAS) return row.sucursalId === suc || row.sucursal_id === suc;
      return row.asignadoId === me?.id || row.creadorId === me?.id;
    }).slice(0, 12).map((row) => ({
      type: 'tarea',
      id: row.id,
      at: row.updated || row.created,
      titulo: row.titulo,
      detalle: row.estado,
    }));
    return [...quotes, ...surveys, ...sales, ...tasks]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 40);
  },
};

export default reportsService;
