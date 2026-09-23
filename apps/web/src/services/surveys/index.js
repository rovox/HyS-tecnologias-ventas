import { apiClient, authToken } from '@/api/http.js';

function mapRelevamiento(row) {
  if (!row) return row;
  const tipoRaw = row.tipoVisita || row.tipo_visita || 'relevamiento';
  const tipoLabel = String(tipoRaw).toLowerCase().startsWith('asist') ? 'Asistencia' : 'Relevamiento';
  const fotos = Array.isArray(row.fotosUrl)
    ? row.fotosUrl
    : Array.isArray(row.fotografias)
      ? row.fotografias
      : [];
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
    prioridad: row.prioridad || 'media',
    fotosUrl: fotos,
    fotografias: fotos,
  };
}

export const surveysService = {
  async getAll(cotizacionId) {
    const rows = await apiClient.get('relevamientos', { token: authToken(), query: { cotizacionId } });
    return (rows || []).map(mapRelevamiento);
  },

  async create(data) {
    const row = await apiClient.post('relevamientos', {
      cotizacionId: data.cotizacionId || data.quotation_id || data.cotizacion_id || undefined,
      clienteId: data.cliente_id || data.clienteId || undefined,
      sucursalId: data.sucursal_id || data.sucursalId || undefined,
      fecha: data.fecha || data.fecha_inicio,
      fechaFin: data.fecha_fin || data.fechaFin || undefined,
      tipoVisita: data.tipoVisita || (data.tipo_visita === 'Asistencia' ? 'asistencia' : 'relevamiento'),
      estado: data.estado || 'programado',
      prioridad: data.prioridad || 'media',
      vendedorId: data.vendedor_id || data.vendedorId || undefined,
      tecnicoId: data.tecnico_id || data.tecnicoId || undefined,
      lugar: data.lugar,
      notas: data.notas || data.observaciones,
      fotosUrl: data.fotosUrl || data.fotografias,
    }, { token: authToken() });
    return mapRelevamiento(row);
  },

  async update(id, data) {
    return mapRelevamiento(await apiClient.patch(`relevamientos/${id}`, {
      fecha: data.fecha || data.fecha_inicio,
      fechaFin: data.fecha_fin !== undefined ? data.fecha_fin : data.fechaFin,
      tipoVisita: data.tipoVisita || (data.tipo_visita === 'Asistencia' ? 'asistencia' : data.tipo_visita === 'Relevamiento' ? 'relevamiento' : undefined),
      estado: data.estado,
      prioridad: data.prioridad,
      vendedorId: data.vendedor_id !== undefined ? data.vendedor_id : data.vendedorId,
      tecnicoId: data.tecnico_id !== undefined ? data.tecnico_id : data.tecnicoId,
      lugar: data.lugar,
      notas: data.notas || data.observaciones,
      fotosUrl: data.fotosUrl || data.fotografias,
    }, { token: authToken() }));
  },

  async uploadPhoto(id, file) {
    const form = new FormData();
    form.append('file', file);
    const row = await apiClient.post(`relevamientos/${id}/files`, form, { token: authToken() });
    return mapRelevamiento(row);
  },
};

export default surveysService;
