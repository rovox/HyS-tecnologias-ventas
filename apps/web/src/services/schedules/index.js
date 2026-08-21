import * as store from '@/mocks/store.js';
import { SCHEDULE_FLOW } from '@/mocks/schedules.js';
import { apiClient, authToken, isMockMode } from '@/api/http.js';

export function calculateBalance(trabajo) {
  const costo_total = parseFloat(trabajo.monto || trabajo.costo_total || 0);
  const adicionales = parseFloat(trabajo.adicionales || 0);
  const adelanto_recibido = parseFloat(trabajo.adelanto || trabajo.adelanto_recibido || 0);
  const cobros_realizados = parseFloat(trabajo.cobros_realizados || trabajo.cobros_registrados || 0);
  const saldo = costo_total + adicionales - adelanto_recibido - cobros_realizados;
  const estado_pago = saldo <= 0 ? 'Pagado' : 'Pendiente';
  return { saldo, estado_pago };
}

function mapApiSchedule(row) {
  if (!row) return row;
  const monto = Number(row.monto ?? 0);
  const adelanto = Number(row.adelanto ?? 0);
  const saldo = Number(row.saldo ?? Math.max(0, monto - adelanto));
  const fecha = row.fechaProgramada || row.fecha_programada;
  const dateStr = fecha ? String(fecha).slice(0, 10) : '';
  return {
    ...row,
    id: row.id,
    type: row.type,
    cliente_id: row.clienteId || row.cliente_id,
    cliente: row.cliente?.nombre || row.cliente || '',
    cliente_nombre: row.cliente?.nombre || row.cliente || 'Sin cliente',
    lugar: row.lugar || row.cliente?.direccion || 'Sin ubicación',
    descripcion_trabajo: row.descripcionTrabajo || row.descripcion_trabajo || '',
    monto,
    adelanto,
    saldo,
    estado_pago: saldo <= 0 ? 'Pagado' : 'Pendiente',
    costo_total: monto,
    fecha_programada: dateStr,
    horario: row.horario || null,
    fecha_finalizacion: row.fechaFinalizacion ? String(row.fechaFinalizacion).slice(0, 10) : '',
    estado: row.estado,
    sucursal_id: row.sucursalId || row.sucursal_id,
    sucursal_nombre: row.sucursal?.nombre || row.sucursalNombre || '',
    vendedor_responsable_id: row.vendedorId || row.vendedor_responsable_id,
    vendedor_id: row.vendedorId || row.vendedor_responsable_id,
    vendedor_nombre: row.vendedor?.name || row.vendedor_nombre || '',
    tecnico_responsable_id: row.tecnicoId || row.tecnico_responsable_id,
    tecnico_id: row.tecnicoId || row.tecnico_responsable_id,
    tecnico_nombre: row.tecnico?.name || row.tecnico_nombre || '',
    quotation_id: row.quotationId || row.quotation_id || '',
    observaciones: row.observaciones || '',
    google_maps_link: row.mapsLink || row.google_maps_link || '',
    maps_link: row.mapsLink || row.maps_link || '',
    clientData: row.cliente || null,
    tipo_trabajo: row.type,
  };
}

function normalize(record, clientsMap) {
  const { saldo, estado_pago } = calculateBalance(record);
  const clientData = clientsMap[record.cliente_id] || null;
  const fallbackLocation = clientData?.direccion?.trim() ? clientData.direccion : 'Sin ubicación';
  const dateStr = record.fecha_programada ? String(record.fecha_programada).split(' ')[0] : '';
  return {
    ...record,
    saldo,
    estado_pago,
    cliente_nombre: clientData?.nombre || record.cliente || 'Sin cliente',
    tipo_trabajo: record.type,
    lugar: record.lugar?.trim() ? record.lugar : fallbackLocation,
    fecha_programada: dateStr,
    vendedor_id: record.vendedor_responsable_id,
    tecnico_id: record.tecnico_responsable_id,
    costo_total: record.monto || 0,
    clientData,
  };
}

export const schedulesService = {
  async getAll(filters = {}) {
    if (!isMockMode) {
      const rows = await apiClient.get('schedules', {
        token: authToken(),
        query: {
          estado: filters.estado,
          sucursalId: filters.sucursalId,
          from: filters.from,
          to: filters.to,
          tecnicoId: filters.tecnicoId,
        },
      });
      return (rows || []).map(mapApiSchedule);
    }
    const records = store.list('schedules', { sort: '-fecha_programada' });
    const clients = store.list('clientes');
    const clientsMap = Object.fromEntries(clients.map((row) => [row.id, row]));
    return records.map((row) => normalize(row, clientsMap));
  },

  async getById(id) {
    if (!isMockMode) {
      return mapApiSchedule(await apiClient.get(`schedules/${id}`, { token: authToken() }));
    }
    const record = store.findById('schedules', id);
    if (!record) return null;
    const clients = store.list('clientes');
    const clientsMap = Object.fromEntries(clients.map((row) => [row.id, row]));
    return normalize(record, clientsMap);
  },

  async create(data) {
    const payload = data instanceof FormData ? Object.fromEntries(data.entries()) : { ...data };
    if (!isMockMode) {
      return mapApiSchedule(await apiClient.post('schedules', {
        type: payload.type || payload.tipo_trabajo || 'seguridad',
        clienteId: payload.clienteId || payload.cliente_id,
        descripcionTrabajo: payload.descripcionTrabajo || payload.descripcion_trabajo || '',
        sucursalId: payload.sucursalId || payload.sucursal_id,
        fechaProgramada: payload.fechaProgramada || payload.fecha_programada,
        lugar: payload.lugar,
        monto: Number(payload.monto ?? payload.costo_total ?? 0),
        adelanto: Number(payload.adelanto ?? 0),
        horario: payload.horario || undefined,
        vendedorId: payload.vendedorId || payload.vendedor_responsable_id || undefined,
        tecnicoId: payload.tecnicoId || payload.tecnico_responsable_id || undefined,
        quotationId: payload.quotationId || payload.quotation_id || undefined,
        observaciones: payload.observaciones || undefined,
        mapsLink: payload.mapsLink || payload.google_maps_link || undefined,
        estado: payload.estado || 'programado',
      }, { token: authToken() }));
    }
    if (!payload.cliente_id) throw new Error('cliente_id es requerido');
    payload.estado = payload.estado || 'programado';
    const { saldo } = calculateBalance(payload);
    payload.saldo = saldo;
    return store.insert('schedules', payload);
  },

  async update(id, data) {
    const payload = data instanceof FormData ? Object.fromEntries(data.entries()) : { ...data };
    if (!isMockMode) {
      return mapApiSchedule(await apiClient.patch(`schedules/${id}`, {
        lugar: payload.lugar,
        descripcionTrabajo: payload.descripcionTrabajo || payload.descripcion_trabajo,
        monto: payload.monto !== undefined ? Number(payload.monto) : undefined,
        adelanto: payload.adelanto !== undefined ? Number(payload.adelanto) : undefined,
        fechaProgramada: payload.fechaProgramada || payload.fecha_programada,
        horario: payload.horario,
        vendedorId: payload.vendedorId || payload.vendedor_responsable_id,
        tecnicoId: payload.tecnicoId || payload.tecnico_responsable_id,
        observaciones: payload.observaciones,
        mapsLink: payload.mapsLink || payload.google_maps_link,
        estado: payload.estado,
        fechaFinalizacion: payload.fechaFinalizacion || payload.fecha_finalizacion,
      }, { token: authToken() }));
    }
    const updated = store.update('schedules', id, payload);
    if (!updated) throw new Error('Trabajo no encontrado');
    return updated;
  },

  async updateStatus(id, estado, extra = {}) {
    if (!isMockMode) {
      return mapApiSchedule(await apiClient.post(`schedules/${id}/status`, {
        estado,
        fechaFinalizacion: extra.fecha_finalizacion || extra.fechaFinalizacion,
      }, { token: authToken() }));
    }
    const current = store.findById('schedules', id);
    if (!current) throw new Error('Trabajo no encontrado');
    if (current.estado !== estado) {
      const allowed = SCHEDULE_FLOW[current.estado] || [];
      if (!allowed.includes(estado) && estado !== 'cancelado') {
        throw new Error(`Transición inválida: ${current.estado} → ${estado}`);
      }
    }
    const payload = { ...extra, estado };
    if (estado === 'terminado') {
      payload.fecha_finalizacion = extra.fecha_finalizacion || new Date().toISOString().slice(0, 10);
    }
    return store.update('schedules', id, payload);
  },

  async assignTechnician(id, tecnicoId) {
    if (!isMockMode) {
      return this.update(id, { tecnicoId });
    }
    const tec = store.findById('tecnicos', tecnicoId);
    return store.update('schedules', id, {
      tecnico_responsable_id: tecnicoId,
      tecnico_nombre: tec?.nombre || '',
    });
  },

  async getObservations(trabajo_id) {
    if (!isMockMode) return [];
    return store.list('schedule_observations', { filter: `trabajo_id="${trabajo_id}"`, sort: '-created' });
  },

  async addObservation(trabajo_id, observacion, usuario_id, tipo = 'nota') {
    if (!isMockMode) {
      const row = await this.getById(trabajo_id);
      return this.update(trabajo_id, {
        observaciones: [row?.observaciones, observacion].filter(Boolean).join('\n'),
      });
    }
    return store.insert('schedule_observations', {
      trabajo_id,
      usuario_id,
      observacion,
      tipo,
      created_by: usuario_id,
    });
  },

  async getPayments() {
    if (!isMockMode) return [];
    return store.list('schedule_payments', { sort: '-created' });
  },

  async registerPayment(paymentData) {
    if (!isMockMode) {
      throw new Error('Pagos de cronograma siguen en dominio congelado (mock/finanzas)');
    }
    const trabajoId = paymentData.trabajo_id || paymentData.schedule_id;
    const job = store.findById('schedules', trabajoId);
    if (!job) throw new Error('Trabajo no encontrado');
    const payment = store.insert('schedule_payments', { ...paymentData, trabajo_id: trabajoId });
    const cobros = store.list('schedule_payments', { filter: `trabajo_id="${trabajoId}"` });
    const cobrado = cobros.reduce((sum, row) => sum + (Number(row.monto_cobrado) || 0), 0);
    const saldo = Math.max(0, (Number(job.monto) || 0) - cobrado);
    store.update('schedules', trabajoId, { adelanto: cobrado, saldo });
    return payment;
  },
};

export default schedulesService;
