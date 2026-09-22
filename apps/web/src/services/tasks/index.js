import { apiClient, authToken } from '@/api/http.js';

function normalizeTask(row) {
  return {
    ...row,
    tipo: row.tipo || 'operativa',
    cotizacionId: row.cotizacionId || row.cotizacion_id || null,
    cotizacion_numero: row.cotizacion_numero || row.cotizacionNumero || row.quotation?.numero || '',
    scheduleId: row.scheduleId || row.schedule_id || null,
    horario: row.horario || null,
    plazo: row.plazo ? String(row.plazo).slice(0, 10) : null,
    prioridad: row.prioridad || 'media',
    prioridadMotivo: row.prioridadMotivo || row.prioridad_motivo || null,
    creador_nombre: row.creador_nombre || row.creador?.name || '',
    asignadoId: row.asignadoId || row.asignado_id || null,
    asignado_nombre: row.asignado_nombre || row.asignado?.name || '',
    asignadoAt: row.asignadoAt || row.asignado_at || null,
    asignadoPorId: row.asignadoPorId || row.asignado_por_id || null,
    created: row.created || row.createdAt || null,
  };
}

export const tasksService = {
  async getAll(opts = {}) {
    const tipo = opts.tipo || undefined;
    const rows = await apiClient.get('tasks', { token: authToken(), query: { tipo } });
    return (rows || []).map(normalizeTask);
  },

  async create(data) {
    return normalizeTask(await apiClient.post('tasks', {
      titulo: data.titulo,
      descripcion: data.descripcion,
      sucursalId: data.sucursalId,
      asignadoId: data.asignadoId || null,
      prioridad: data.prioridad,
      prioridadMotivo: data.prioridadMotivo || undefined,
      plazo: data.plazo || undefined,
      horario: data.horario || undefined,
      cotizacionId: data.cotizacionId || undefined,
      scheduleId: data.scheduleId || undefined,
      tipo: data.tipo || 'operativa',
      estado: data.estado || 'pendiente',
    }, { token: authToken() }));
  },

  async update(id, data) {
    return normalizeTask(await apiClient.patch(`tasks/${id}`, data, { token: authToken() }));
  },

  async claim(id) {
    return normalizeTask(await apiClient.post(`tasks/${id}/claim`, {}, { token: authToken() }));
  },
};

export default tasksService;
