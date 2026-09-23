import { apiClient, authToken } from '@/api/http.js';

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

export const schedulesService = {
  async getAll(filters = {}) {
    const rows = await apiClient.get('schedules', {
      token: authToken(),
      query: {
        estado: filters.estado,
        sucursalId: filters.sucursalId,
        from: filters.from,
        to: filters.to,
        tecnicoId: filters.tecnicoId,
        quotationId: filters.quotationId || filters.quotation_id,
        clienteId: filters.clienteId || filters.cliente_id,
      },
    });
    return (rows || []).map(mapApiSchedule);
  },

  async getById(id) {
    return mapApiSchedule(await apiClient.get(`schedules/${id}`, { token: authToken() }));
  },

  async create(data) {
    const payload = data instanceof FormData ? Object.fromEntries(data.entries()) : { ...data };
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
  },

  async update(id, data) {
    const payload = data instanceof FormData ? Object.fromEntries(data.entries()) : { ...data };
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
  },

  async updateStatus(id, estado, extra = {}) {
    return mapApiSchedule(await apiClient.post(`schedules/${id}/status`, {
      estado,
      fechaFinalizacion: extra.fecha_finalizacion || extra.fechaFinalizacion,
    }, { token: authToken() }));
  },

  async assignTechnician(id, tecnicoId) {
    return this.update(id, { tecnicoId });
  },

  async getObservations(trabajo_id) {
    const row = await this.getById(trabajo_id);
    const text = String(row?.observaciones || '').trim();
    if (!text) return [];
    return text.split('\n').filter(Boolean).map((observacion, index) => ({
      id: `${trabajo_id}-obs-${index}`,
      trabajo_id,
      observacion,
      tipo: 'nota',
      created: row?.updated || row?.updatedAt || null,
    }));
  },

  async addObservation(trabajo_id, observacion) {
    const row = await this.getById(trabajo_id);
    return this.update(trabajo_id, {
      observaciones: [row?.observaciones, observacion].filter(Boolean).join('\n'),
    });
  },

  async getPayments(trabajo_id) {
    if (!trabajo_id) return [];
    const rows = await apiClient.get(`schedules/${trabajo_id}/payments`, { token: authToken() });
    return (rows || []).map((p) => ({
      ...p,
      trabajo_id: p.scheduleId || trabajo_id,
      monto_cobrado: Number(p.monto ?? p.monto_cobrado ?? 0),
      medio_pago: p.metodo || p.medio_pago || '',
      tipo: p.tipo,
      created: p.at || p.createdAt,
    }));
  },

  async registerPayment(paymentData) {
    const trabajoId = paymentData.trabajo_id || paymentData.schedule_id;
    if (!trabajoId) throw new Error('Trabajo requerido');
    const tipoRaw = paymentData.tipo || paymentData.tipo_cobro || 'cobro';
    const tipo = tipoRaw === 'adelanto' ? 'adelanto' : tipoRaw === 'extra_asistencia' ? 'extra_asistencia' : 'cobro';
    const updated = await apiClient.post(`schedules/${trabajoId}/payments`, {
      tipo,
      monto: Number(paymentData.monto_cobrado ?? paymentData.monto ?? 0),
      metodo: paymentData.medio_pago || paymentData.metodo || '',
      nota: paymentData.observacion || paymentData.nota || '',
      relevamientoId: paymentData.relevamiento_id || paymentData.relevamientoId || undefined,
      quotationId: paymentData.quotation_id || paymentData.quotationId || undefined,
    }, { token: authToken() });
    return mapApiSchedule(updated);
  },
};

export default schedulesService;
