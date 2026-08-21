import * as store from '@/mocks/store.js';
import { apiClient, authToken, isMockMode } from '@/api/http.js';

function mapRelevamiento(row) {
  if (!row) return row;
  return {
    ...row,
    fecha: row.fecha,
    lugar: row.lugar,
    notas: row.notas,
    sucursal_id: row.sucursalId || row.sucursal_id,
    sucursal_nombre: row.sucursal?.nombre || row.sucursal_nombre,
    cliente_id: row.clienteId || row.cliente_id,
    cliente_nombre: row.cliente?.nombre || row.cliente_nombre,
    quotation_id: row.cotizacionId || row.quotation_id,
    tecnico_nombre: row.usuario?.name || row.tecnico_nombre || '',
    tipo_visita: row.tipo_visita || 'Relevamiento',
    estado: row.estado || 'programado',
  };
}

export const surveysService = {
  async getAll(cotizacionId) {
    if (!isMockMode) {
      const rows = await apiClient.get('relevamientos', { token: authToken(), query: { cotizacionId } });
      return (rows || []).map(mapRelevamiento);
    }
    const rows = store.list('visitas_tecnicas', { sort: '-created' });
    if (!cotizacionId) return rows;
    return rows.filter((row) => row.quotation_id === cotizacionId || row.cotizacion_id === cotizacionId);
  },

  async create(data) {
    if (!isMockMode) {
      const row = await apiClient.post('relevamientos', {
        cotizacionId: data.cotizacionId || data.quotation_id,
        fecha: data.fecha,
        lugar: data.lugar,
        notas: data.notas || data.observaciones,
        fotosUrl: data.fotosUrl || data.fotografias,
      }, { token: authToken() });
      return mapRelevamiento(row);
    }
    const quoteId = data.cotizacionId || data.quotation_id;
    const quote = quoteId ? store.findById('quotations', quoteId) : null;
    const row = store.insert('visitas_tecnicas', {
      tipo_visita: 'Relevamiento',
      quotation_id: quoteId,
      ...data,
    });
    store.touchClientActivity(data.cliente_id || quote?.cliente_id);
    return row;
  },

  async update(id, data) {
    if (!isMockMode) {
      return mapRelevamiento(await apiClient.patch(`relevamientos/${id}`, {
        fecha: data.fecha,
        lugar: data.lugar,
        notas: data.notas || data.observaciones,
        fotosUrl: data.fotosUrl || data.fotografias,
      }, { token: authToken() }));
    }
    return store.update('visitas_tecnicas', id, data);
  },
};

export default surveysService;
