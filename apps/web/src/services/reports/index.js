import * as store from '@/mocks/store.js';

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
    const prefix = month || new Date().toISOString().slice(0, 7);
    const inMonth = (quote) => String(quote.fecha || quote.created || '').startsWith(prefix);
    const amount = (quote) => Number(quote.total ?? quote.monto) || 0;
    const isVendor = (quote) => {
      if (!userId) return true;
      if (quote.vendedor_id === userId) return true;
      return Array.isArray(quote.vendedores) && quote.vendedores.some((row) => row.user_id === userId);
    };
    const isSale = (quote) => quote.estado === 'convertida' || Boolean(quote.schedule_id);

    const quotes = store
      .list('quotations')
      .filter((row) => row.kind === 'commercial' && inMonth(row) && isVendor(row));
    const quotationsTotal = quotes
      .filter((row) => row.estado !== 'rechazada')
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
};

export default reportsService;
