import * as store from '@/mocks/store.js';
import { apiClient, authToken, isMockMode, mapClient } from '@/api/http.js';
import mockAdapter from '@/api/mockAdapter.js';
import { ROLES } from '@/mocks/users.js';
import { sucursalOf } from '@/config/nav.js';

function scopeClients(rows) {
  const me = mockAdapter.authStore.record;
  if (!me) return rows;
  if (me.role === ROLES.ADMIN || me.role === ROLES.CONT) return rows;
  const suc = sucursalOf(me);
  if (!suc) return rows;
  return rows.filter((row) => (row.sucursal_id || row.sucursalId) === suc);
}

function isActiveClient(client, quotes, jobs) {
  const hace90 = Date.now() - 90 * 24 * 60 * 60 * 1000;
  if (client.lastActivityAt && new Date(client.lastActivityAt).getTime() >= hace90) return true;
  const mine = quotes.filter((row) => row.cliente_id === client.id || row.clienteId === client.id);
  if (mine.some((row) => row.estado === 'borrador' || row.estado === 'enviado')) return true;
  return jobs.some((job) =>
    (job.cliente_id === client.id || job.clienteId === client.id)
    && job.estado !== 'terminado'
    && job.estado !== 'cancelado',
  );
}

export const clientsService = {
  async getAll(options = {}) {
    if (!isMockMode) {
      const rows = await apiClient.get('clients', { token: authToken(), query: { q: options.q, active: options.active } });
      return (rows || []).map(mapClient);
    }
    let clients = store.list('clientes', { sort: '-lastActivityAt' });
    if (options.q) {
      const q = String(options.q).toLowerCase();
      clients = clients.filter((row) =>
        [row.nombre, row.telefono, row.email, row.contacto].some((v) => String(v || '').toLowerCase().includes(q)),
      ).slice(0, 10);
    }
    clients = scopeClients(clients);
    const quotes = store.list('quotations');
    const schedules = store.list('schedules', { filter: `cliente_id != ''` });
    const tasks = store.list('tasks');
    if (options.active === 1 || options.active === '1' || options.active === true) {
      clients = clients.filter((row) => isActiveClient(row, quotes, schedules));
    }
    return clients.map((client) => {
      const clientQuotes = quotes.filter((row) => row.cliente_id === client.id || row.clienteId === client.id);
      const clientJobs = schedules.filter((job) => job.cliente_id === client.id || job.clienteId === client.id);
      const open = clientJobs.filter((job) => job.estado !== 'terminado' && job.estado !== 'cancelado');
      const quoteIds = new Set(clientQuotes.map((row) => row.id));
      const jobIds = new Set(clientJobs.map((row) => row.id));
      const clientTasks = tasks
        .filter((task) =>
          (task.cotizacionId && quoteIds.has(task.cotizacionId))
          || (task.scheduleId && jobIds.has(task.scheduleId))
          || task.cliente_id === client.id
          || task.clienteId === client.id,
        )
        .sort((a, b) => new Date(b.updated || b.plazo || b.created || 0) - new Date(a.updated || a.plazo || a.created || 0));
      return {
        ...client,
        cotizacionesCount: clientQuotes.length,
        trabajosEnProceso: open.length,
        tareasCount: clientTasks.length,
        tareasRecientes: clientTasks.slice(0, 3).map((task) => ({
          id: task.id,
          titulo: task.titulo || 'Tarea',
          estado: task.estado || 'pendiente',
          at: task.plazo || task.updated || task.created,
        })),
        esActivo: isActiveClient(client, quotes, schedules),
      };
    });
  },

  async search(query) {
    return this.getAll({ q: query });
  },

  async getHistory(id) {
    if (!isMockMode) {
      return apiClient.get(`clients/${id}/history`, { token: authToken() });
    }
    const client = store.findById('clientes', id);
    const quotations = store.list('quotations').filter((row) => row.cliente_id === id);
    const relevamientos = store.list('visitas_tecnicas').filter((row) => row.cliente_id === id);
    const ventas = store.list('schedules').filter((row) => row.cliente_id === id);
    const events = [
      ...quotations.map((row) => ({
        type: 'cotizacion',
        id: row.id,
        at: row.created || row.fecha,
        titulo: `${row.numero || ''} · ${row.titulo}`,
        detalle: row.estado,
        monto: Number(row.total || row.monto || 0),
      })),
      ...relevamientos.map((row) => ({
        type: 'relevamiento',
        id: row.id,
        at: row.created || row.fecha,
        titulo: row.lugar || 'Relevamiento',
        detalle: row.notas || row.necesidad_cliente || '',
      })),
      ...ventas.map((row) => ({
        type: 'venta',
        id: row.id,
        at: row.created || row.fecha_programada,
        titulo: row.descripcion_trabajo || row.lugar || 'Venta',
        detalle: row.estado,
        monto: Number(row.monto || 0),
      })),
    ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return { client, events };
  },

  async getById(id) {
    if (!isMockMode) {
      const row = await apiClient.get(`clients/${id}`, { token: authToken() });
      return mapClient(row);
    }
    const client = store.findById('clientes', id);
    if (!client) return null;
    const schedules = store.list('schedules', { filter: `cliente_id="${id}"`, sort: '-fecha_programada' });
    const open = schedules.filter((job) => job.estado !== 'terminado' && job.estado !== 'cancelado');
    const monto_total = open.reduce((sum, job) => sum + (job.monto || 0), 0);
    const adelanto_total = open.reduce((sum, job) => sum + (job.adelanto || 0), 0);
    return { ...client, monto_total, adelanto_total, saldo_total: monto_total - adelanto_total, schedules };
  },

  async create(data) {
    if (!isMockMode) {
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
    }
    const nombre = String(data.nombre || '').trim();
    if (!nombre) throw new Error('El nombre del cliente es requerido');
    const dup = store.list('clientes').find((row) => row.nombre.trim().toLowerCase() === nombre.toLowerCase());
    if (dup) throw new Error('Ya existe un cliente registrado con ese nombre.');
    return store.insert('clientes', { ...data, nombre, lastActivityAt: new Date().toISOString() });
  },

  async update(id, data) {
    if (!isMockMode) {
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
    }
    if (data.nombre) {
      const nombre = data.nombre.trim();
      const dup = store.list('clientes').find((row) => row.id !== id && row.nombre.trim().toLowerCase() === nombre.toLowerCase());
      if (dup) throw new Error('Ya existe otro cliente registrado con ese nombre.');
    }
    const updated = store.update('clientes', id, data);
    if (!updated) throw new Error('Cliente no encontrado');
    return updated;
  },

};

export default clientsService;
