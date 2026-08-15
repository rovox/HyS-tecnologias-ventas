import * as store from '@/mocks/store.js';

export const vehiclesService = {
  async getAll() {
    return store.list('vehiculos', { sort: 'placa' });
  },
  async getById(id) {
    const vehiculo = store.findById('vehiculos', id);
    if (!vehiculo) return null;
    return {
      ...vehiculo,
      combustible: store.list('registros_combustible', { filter: `vehiculo_id="${id}"`, sort: '-fecha' }),
      mantenimiento: store.list('registros_mantenimiento', { filter: `vehiculo_id="${id}"`, sort: '-fecha' }),
    };
  },
  async create(data) {
    return store.insert('vehiculos', { estado: 'activo', kilometraje_actual: 0, ...data });
  },
  async update(id, data) {
    return store.update('vehiculos', id, data);
  },
  async addFuel(vehiculoId, data) {
    const record = store.insert('registros_combustible', { ...data, vehiculo_id: vehiculoId });
    if (data.kilometraje) {
      store.update('vehiculos', vehiculoId, { kilometraje_actual: data.kilometraje });
    }
    return record;
  },
};

export default vehiclesService;
