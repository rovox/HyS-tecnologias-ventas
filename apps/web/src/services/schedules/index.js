import * as store from '@/mocks/store.js';
import { SCHEDULE_FLOW } from '@/mocks/schedules.js';

export function calculateBalance(trabajo) {
  const costo_total = parseFloat(trabajo.monto || trabajo.costo_total || 0);
  const adicionales = parseFloat(trabajo.adicionales || 0);
  const adelanto_recibido = parseFloat(trabajo.adelanto || trabajo.adelanto_recibido || 0);
  const cobros_realizados = parseFloat(trabajo.cobros_realizados || trabajo.cobros_registrados || 0);
  const saldo = costo_total + adicionales - adelanto_recibido - cobros_realizados;
  const estado_pago = saldo <= 0 ? 'Pagado' : 'Pendiente';
  return { saldo, estado_pago };
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
  async getAll() {
    const records = store.list('schedules', { sort: '-fecha_programada' });
    const clients = store.list('clientes');
    const clientsMap = Object.fromEntries(clients.map((row) => [row.id, row]));
    return records.map((row) => normalize(row, clientsMap));
  },

  async getById(id) {
    const record = store.findById('schedules', id);
    if (!record) return null;
    const clients = store.list('clientes');
    const clientsMap = Object.fromEntries(clients.map((row) => [row.id, row]));
    return normalize(record, clientsMap);
  },

  async create(data) {
    const payload = data instanceof FormData ? Object.fromEntries(data.entries()) : { ...data };
    if (!payload.cliente_id) throw new Error('cliente_id es requerido');
    payload.estado = payload.estado || 'programado';
    const { saldo } = calculateBalance(payload);
    payload.saldo = saldo;
    return store.insert('schedules', payload);
  },

  async update(id, data) {
    const payload = data instanceof FormData ? Object.fromEntries(data.entries()) : { ...data };
    const updated = store.update('schedules', id, payload);
    if (!updated) throw new Error('Trabajo no encontrado');
    return updated;
  },

  async updateStatus(id, estado, extra = {}) {
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
    const tec = store.findById('tecnicos', tecnicoId);
    return store.update('schedules', id, {
      tecnico_responsable_id: tecnicoId,
      tecnico_nombre: tec?.nombre || '',
    });
  },

  async getObservations(trabajo_id) {
    return store.list('schedule_observations', { filter: `trabajo_id="${trabajo_id}"`, sort: '-created' });
  },

  async addObservation(trabajo_id, observacion, usuario_id, tipo = 'nota') {
    return store.insert('schedule_observations', {
      trabajo_id,
      usuario_id,
      observacion,
      tipo,
      created_by: usuario_id,
    });
  },

  async getPayments(trabajo_id) {
    return store.list('schedule_payments', { filter: `trabajo_id="${trabajo_id}"`, sort: '-created' });
  },

  async registerPayment(paymentData) {
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
