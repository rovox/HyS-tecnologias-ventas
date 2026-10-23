import { apiClient, authToken, mapClient } from '@/api/http.js';

/** Legacy service kept only for the relevamientos form (VisitaFormModal); new code uses features/clients. */
const clientsService = {
  async getAll() {
    const rows = await apiClient.get('clients', { token: authToken() });
    return (rows || []).map(mapClient);
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
};

export default clientsService;
