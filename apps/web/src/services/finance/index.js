import * as store from '@/mocks/store.js';

export const financeService = {
  async getMovimientos() {
    return store.list('movimientos', { sort: '-fecha,-created' });
  },
  async getCajas() {
    return store.list('cajas_bancos', { sort: 'nombre' });
  },
  async getGastos() {
    return store.list('gastos_operativos', { sort: '-fecha' });
  },
  async getCostos() {
    return store.list('costos_trabajo', { sort: '-fecha' });
  },
  async getPayments() {
    return store.list('schedule_payments', { sort: '-created' });
  },
  async createMovimiento(data) {
    return store.insert('movimientos', { estado: 'confirmado', ...data });
  },
};

export default financeService;
