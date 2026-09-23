export const financeService = {
  async getMovimientos() { return []; },
  async getCajas() { return []; },
  async getGastos() { return []; },
  async getCostos() { return []; },
  async getPayments() { return []; },
  async createMovimiento() { throw new Error('Finance module not yet implemented'); },
};

export default financeService;
