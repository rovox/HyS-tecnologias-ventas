import * as store from '@/mocks/store.js';
import { apiClient, authToken, isMockMode } from '@/api/http.js';

function mapRelevamiento(row) {
  if (!row) return row;
  const tipoRaw = row.tipoVisita || row.tipo_visita || 'relevamiento';
  const tipoLabel = String(tipoRaw).toLowerCase().startsWith('asist') ? 'Asistencia' : 'Relevamiento';
  return {
    ...row,
    fecha: row.fecha,
    fecha_inicio: row.fecha_inicio || row.fecha,
    fecha_fin: row.fecha_fin || row.fechaFin || null,
    lugar: row.lugar,
    notas: row.notas,
    sucursal_id: row.sucursalId || row.sucursal_id,
    sucursal_nombre: row.sucursal?.nombre || row.sucursal_nombre,
    cliente_id: row.clienteId || row.cliente_id,
    cliente_nombre: row.cliente?.nombre || row.cliente_nombre,
    quotation_id: row.cotizacionId || row.quotation_id || row.cotizacion_id,
    cotizacion_id: row.cotizacionId || row.cotizacion_id || row.quotation_id,
    tecnico_id: row.tecnicoId || row.tecnico_id || '',
    vendedor_id: row.vendedorId || row.vendedor_id || '',
    tecnico_nombre: row.tecnico_nombre || row.usuario?.name || '',
    vendedor_nombre: row.vendedor_nombre || '',
    tipo_visita: tipoLabel,
    tipoVisita: String(tipoRaw).toLowerCase(),
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
    if (!cotizacionId) return rows.map(mapRelevamiento);
    return rows
      .filter((row) => row.quotation_id === cotizacionId || row.cotizacion_id === cotizacionId)
      .map(mapRelevamiento);
  },

  async create(data) {
    if (!isMockMode) {
      const row = await apiClient.post('relevamientos', {
        cotizacionId: data.cotizacionId || data.quotation_id || data.cotizacion_id,
        fecha: data.fecha || data.fecha_inicio,
        fechaFin: data.fecha_fin || data.fechaFin || undefined,
        tipoVisita: data.tipoVisita || (data.tipo_visita === 'Asistencia' ? 'asistencia' : 'relevamiento'),
        vendedorId: data.vendedor_id || data.vendedorId || undefined,
        tecnicoId: data.tecnico_id || data.tecnicoId || undefined,
        lugar: data.lugar,
        notas: data.notas || data.observaciones,
        fotosUrl: data.fotosUrl || data.fotografias,
      }, { token: authToken() });
      return mapRelevamiento(row);
    }
    const quoteId = data.cotizacionId || data.quotation_id || data.cotizacion_id;
    const quote = quoteId ? store.findById('quotations', quoteId) : null;
    const row = store.insert('visitas_tecnicas', {
      tipo_visita: data.tipo_visita || (data.tipoVisita === 'asistencia' ? 'Asistencia' : 'Relevamiento'),
      quotation_id: quoteId,
      cotizacion_id: quoteId,
      fecha: data.fecha || data.fecha_inicio,
      fecha_fin: data.fecha_fin || data.fechaFin || null,
      vendedor_id: data.vendedor_id || '',
      vendedor_nombre: data.vendedor_nombre || '',
      tecnico_id: data.tecnico_id || '',
      tecnico_nombre: data.tecnico_nombre || '',
      ...data,
    });
    store.touchClientActivity(data.cliente_id || quote?.cliente_id);
    return mapRelevamiento(row);
  },

  async update(id, data) {
    if (!isMockMode) {
      return mapRelevamiento(await apiClient.patch(`relevamientos/${id}`, {
        fecha: data.fecha || data.fecha_inicio,
        fechaFin: data.fecha_fin !== undefined ? data.fecha_fin : data.fechaFin,
        tipoVisita: data.tipoVisita || (data.tipo_visita === 'Asistencia' ? 'asistencia' : data.tipo_visita === 'Relevamiento' ? 'relevamiento' : undefined),
        vendedorId: data.vendedor_id !== undefined ? data.vendedor_id : data.vendedorId,
        tecnicoId: data.tecnico_id !== undefined ? data.tecnico_id : data.tecnicoId,
        lugar: data.lugar,
        notas: data.notas || data.observaciones,
        fotosUrl: data.fotosUrl || data.fotografias,
      }, { token: authToken() }));
    }
    return mapRelevamiento(store.update('visitas_tecnicas', id, {
      ...data,
      fecha: data.fecha || data.fecha_inicio || data.fecha,
      fecha_fin: data.fecha_fin !== undefined ? data.fecha_fin : data.fechaFin,
    }));
  },
};

export default surveysService;
