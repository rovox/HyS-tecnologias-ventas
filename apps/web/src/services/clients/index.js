import { apiClient, authToken, mapClient } from '@/api/http.js';
import { isClienteContratado } from '@/lib/clientStatus.js';

export const clientsService = {
  async getAll(options = {}) {
    const rows = await apiClient.get('clients', { token: authToken(), query: { q: options.q, active: options.active } });
    return (rows || []).map(mapClient);
  },

  async search(query) {
    return this.getAll({ q: query });
  },

  async getHistory(id) {
    return apiClient.get(`clients/${id}/history`, { token: authToken() });
  },

  async getById(id) {
    const row = await apiClient.get(`clients/${id}`, { token: authToken() });
    return mapClient(row);
  },

  async create(data) {
    const row = await apiClient.post('clients', {
      nombre: data.nombre,
      tipo: data.tipo,
      contacto: data.contacto,
      email: data.email,
      telefono: data.telefono,
      direccion: data.direccion,
      sucursalId: data.sucursal_id,
      observaciones: data.observaciones,
    }, { token: authToken() });
    return mapClient(row);
  },

  async update(id, data) {
    const row = await apiClient.patch(`clients/${id}`, {
      nombre: data.nombre,
      tipo: data.tipo,
      contacto: data.contacto,
      email: data.email,
      telefono: data.telefono,
      direccion: data.direccion,
      sucursalId: data.sucursal_id,
      observaciones: data.observaciones,
    }, { token: authToken() });
    return mapClient(row);
  },
};

export default clientsService;
