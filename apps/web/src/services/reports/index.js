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
};

export default reportsService;
