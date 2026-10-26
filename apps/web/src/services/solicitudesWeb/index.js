import { apiClient, authToken } from '@/api/http.js';

/** WEB-01: contact-form requests from hstecnologias.com. */
export const solicitudesWebService = {
  async getAll(filters = {}) {
    const rows = await apiClient.get('solicitudes-web', {
      token: authToken(),
      query: {
        estado: filters.estado && filters.estado !== 'todas' ? filters.estado : undefined,
        q: filters.q || undefined,
      },
    });
    return rows || [];
  },

  async update(id, data) {
    return apiClient.patch(`solicitudes-web/${id}`, data, { token: authToken() });
  },

  async convert(id) {
    return apiClient.post(`solicitudes-web/${id}/convertir`, {}, { token: authToken() });
  },
};
