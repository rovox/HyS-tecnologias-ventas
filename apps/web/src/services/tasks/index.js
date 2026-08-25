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

function poolVisible(rows) {
  return rows.filter((row) => row.estado !== 'completada');
}

/** Ventas/Admin ven el pool de cotización en todas las sucursales. */
function scopeCotizacion(rows) {
  const me = mockAdapter.authStore.record;
  if (!me) return rows;
  if (me.role === ROLES.ADMIN || me.role === ROLES.VENTAS) return rows;
  return rows.filter((row) => row.asignadoId === me.id || row.creadorId === me.id);
}

export const tasksService = {
  async getAll(opts = {}) {
    const tipo = opts.tipo || undefined;
    if (!isMockMode) {
      const rows = await apiClient.get('tasks', { token: authToken(), query: { tipo } });
      return (rows || []).map(normalizeTask);
    }
    let rows = store.list('tasks', { sort: '-created' });
    if (tipo) {
      rows = rows.filter((row) => (row.tipo || 'operativa') === tipo);
    }
    if (tipo === 'cotizacion') {
      return scopeCotizacion(poolVisible(rows)).map(normalizeTask);
    }
    return scoped(rows.filter(visible)).map(normalizeTask);
  },

  async create(data) {
    if (!isMockMode) {
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
    }
    const me = mockAdapter.authStore.record;
    const assigned = Boolean(data.asignadoId);
    return normalizeTask(store.insert('tasks', {
      titulo: data.titulo,
      descripcion: data.descripcion || '',
      tipo: data.tipo || 'operativa',
      sucursalId: data.sucursalId || me?.sucursalId || me?.department,
      sucursal_id: data.sucursalId || me?.sucursalId || me?.department,
      creadorId: me?.id,
      creador_nombre: me?.name,
      asignadoId: data.asignadoId || null,
      asignado_nombre: data.asignado_nombre || null,
      asignadoAt: assigned ? new Date().toISOString() : null,
      asignadoPorId: assigned ? (data.asignadoPorId || me?.id) : null,
      estado: data.estado || 'pendiente',
      prioridad: data.prioridad || 'media',
      prioridadMotivo: data.prioridadMotivo || null,
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
    if (data.asignadoId !== undefined) {
      if (data.asignadoId) {
        extra.asignadoAt = data.asignadoAt || new Date().toISOString();
        if (data.asignadoPorId !== undefined) extra.asignadoPorId = data.asignadoPorId;
        else if (!store.findById('tasks', id)?.asignadoId) {
          const me = mockAdapter.authStore.record;
          extra.asignadoPorId = me?.id || null;
        }
      } else {
        extra.asignadoAt = null;
        extra.asignadoPorId = null;
        extra.asignado_nombre = null;
      }
    }
    return normalizeTask(store.update('tasks', id, { ...data, ...extra }));
  },

  /** Reclamar tarea del pool (asignadoId null → usuario actual). */
  async claim(id) {
    if (!isMockMode) {
      return normalizeTask(await apiClient.post(`tasks/${id}/claim`, {}, { token: authToken() }));
    }
    const me = mockAdapter.authStore.record;
    const row = store.findById('tasks', id);
    if (!row) throw new Error('Tarea no encontrada');
    if (row.asignadoId) {
      const err = new Error('Esta tarea ya tiene encargado');
      err.status = 409;
      throw err;
    }
    return normalizeTask(store.update('tasks', id, {
      asignadoId: me?.id || null,
      asignado_nombre: me?.name || '',
      asignadoPorId: me?.id || null,
      asignadoAt: new Date().toISOString(),
    }));
  },
};

export default tasksService;
