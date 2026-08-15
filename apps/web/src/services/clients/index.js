import * as store from '@/mocks/store.js';

export const clientsService = {
  async getAll() {
    const clients = store.list('clientes', { sort: '-created' });
    const schedules = store.list('schedules', { filter: `cliente_id != ''` });
    return clients.map((client) => {
      const open = schedules.filter((job) => job.cliente_id === client.id && job.estado !== 'terminado' && job.estado !== 'cancelado');
      const monto_total = open.reduce((sum, job) => sum + (job.monto || 0), 0);
      const adelanto_total = open.reduce((sum, job) => sum + (job.adelanto || 0), 0);
      return {
        ...client,
        monto_total,
        adelanto_total,
        saldo_total: monto_total - adelanto_total,
        cantidad_trabajos: open.length,
      };
    });
  },

  async getById(id) {
    const client = store.findById('clientes', id);
    if (!client) return null;
    const schedules = store.list('schedules', { filter: `cliente_id="${id}"`, sort: '-fecha_programada' });
    const open = schedules.filter((job) => job.estado !== 'terminado' && job.estado !== 'cancelado');
    const monto_total = open.reduce((sum, job) => sum + (job.monto || 0), 0);
    const adelanto_total = open.reduce((sum, job) => sum + (job.adelanto || 0), 0);
    return { ...client, monto_total, adelanto_total, saldo_total: monto_total - adelanto_total, schedules };
  },

  async create(data) {
    const nombre = String(data.nombre || '').trim();
    if (!nombre) throw new Error('El nombre del cliente es requerido');
    const dup = store.list('clientes').find((row) => row.nombre.trim().toLowerCase() === nombre.toLowerCase());
    if (dup) throw new Error('Ya existe un cliente registrado con ese nombre.');
    return store.insert('clientes', { ...data, nombre });
  },

  async update(id, data) {
    if (data.nombre) {
      const nombre = data.nombre.trim();
      const dup = store.list('clientes').find((row) => row.id !== id && row.nombre.trim().toLowerCase() === nombre.toLowerCase());
      if (dup) throw new Error('Ya existe otro cliente registrado con ese nombre.');
    }
    const updated = store.update('clientes', id, data);
    if (!updated) throw new Error('Cliente no encontrado');
    return updated;
  },

  async delete(id) {
    return store.remove('clientes', id);
  },
};

export default clientsService;
