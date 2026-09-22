import { apiClient, authToken } from '@/api/http.js';

export const ordersService = {
  async getAll(filters = {}) {
    const rows = await apiClient.get('pedidos-internos', {
      token: authToken(),
      query: {
        estado: filters.estado && filters.estado !== 'Todos' ? filters.estado : undefined,
        search: filters.search || undefined,
        prioridad: filters.prioridad && filters.prioridad !== 'Todas' ? filters.prioridad : undefined,
        sucursal: filters.sucursal && filters.sucursal !== 'Todas' ? filters.sucursal : undefined,
      },
    });
    return rows || [];
  },

  async getById(id) {
    return apiClient.get(`pedidos-internos/${id}`, { token: authToken() });
  },

  async create(data) {
    return apiClient.post('pedidos-internos', data, { token: authToken() });
  },

  async update(id, data) {
    return apiClient.patch(`pedidos-internos/${id}`, data, { token: authToken() });
  },

  async updateStatus(id, estado, extra = {}) {
    return apiClient.patch(`pedidos-internos/${id}/status`, { estado, ...extra }, { token: authToken() });
  },

  async addComment(pedidoId, contenido) {
    return apiClient.post(`pedidos-internos/${pedidoId}/comments`, { contenido }, { token: authToken() });
  },

  async delete(id) {
    return apiClient.delete(`pedidos-internos/${id}`, { token: authToken() });
  },
};

export default ordersService;
