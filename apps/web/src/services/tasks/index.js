import * as store from '@/mocks/store.js';
import { apiClient, authToken, isMockMode } from '@/api/http.js';
import mockAdapter from '@/api/mockAdapter.js';
import { ROLES } from '@/mocks/users.js';

function visible(row) {
  if (row.estado !== 'completada') return true;
  if (!row.completedAt) return true;
  return new Date(row.completedAt).getTime() > Date.now() - 24 * 60 * 60 * 1000;
}

function scoped(rows) {
  const me = mockAdapter.authStore.record;
  if (!me) return rows;
  if (me.role === ROLES.ADMIN) return rows;
  if (me.role === ROLES.VENTAS) {
    const suc = me.sucursalId || me.department;
    return rows.filter((row) => row.sucursalId === suc || row.sucursal_id === suc);
  }
  return rows.filter((row) => row.asignadoId === me.id || row.creadorId === me.id);
}

function normalizeTask(row) {
  return {
    ...row,
    cotizacionId: row.cotizacionId || row.cotizacion_id || null,
    scheduleId: row.scheduleId || row.schedule_id || null,
    horario: row.horario || null,
    plazo: row.plazo ? String(row.plazo).slice(0, 10) : null,
  };
}

export const tasksService = {
  async getAll() {
    if (!isMockMode) {
      const rows = await apiClient.get('tasks', { token: authToken() });
      return (rows || []).map(normalizeTask);
    }
    return scoped(store.list('tasks', { sort: '-created' }).filter(visible)).map(normalizeTask);
  },

  async create(data) {
    if (!isMockMode) {
      return normalizeTask(await apiClient.post('tasks', {
        titulo: data.titulo,
        descripcion: data.descripcion,
        sucursalId: data.sucursalId,
        asignadoId: data.asignadoId,
        prioridad: data.prioridad,
        plazo: data.plazo || undefined,
        horario: data.horario || undefined,
        cotizacionId: data.cotizacionId || undefined,
        scheduleId: data.scheduleId || undefined,
      }, { token: authToken() }));
    }
    const me = mockAdapter.authStore.record;
    return normalizeTask(store.insert('tasks', {
      titulo: data.titulo,
      descripcion: data.descripcion || '',
      sucursalId: data.sucursalId || me?.sucursalId || me?.department,
      sucursal_id: data.sucursalId || me?.sucursalId || me?.department,
      creadorId: me?.id,
      creador_nombre: me?.name,
      asignadoId: data.asignadoId || null,
      asignado_nombre: data.asignado_nombre || null,
      estado: data.estado || 'pendiente',
      prioridad: data.prioridad || 'media',
      plazo: data.plazo || null,
      horario: data.horario || null,
      cotizacionId: data.cotizacionId || null,
      cotizacion_numero: data.cotizacion_numero || '',
      scheduleId: data.scheduleId || null,
      schedule_label: data.schedule_label || '',
      archivosUrl: [],
      completedAt: null,
    }));
  },

  async update(id, data) {
    if (!isMockMode) {
      return normalizeTask(await apiClient.patch(`tasks/${id}`, data, { token: authToken() }));
    }
    const extra = {};
    if (data.estado === 'completada') extra.completedAt = new Date().toISOString();
    if (data.estado && data.estado !== 'completada') extra.completedAt = null;
    return normalizeTask(store.update('tasks', id, { ...data, ...extra }));
  },
};

export default tasksService;
