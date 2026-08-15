import * as store from '@/mocks/store.js';
import { QUOTATION_FLOW } from '@/mocks/quotations.js';
import { schedulesService } from '@/services/schedules/index.js';

function sumItems(items = []) {
  return items.reduce((total, item) => {
    const qty = Number(item.cantidad) || 0;
    const price = Number(item.precio_unitario) || 0;
    return total + qty * price;
  }, 0);
}

function withTotals(data) {
  const items = (data.items || []).map((item) => {
    const cantidad = Number(item.cantidad) || 0;
    const precio_unitario = Number(item.precio_unitario) || 0;
    return { ...item, cantidad, precio_unitario, subtotal: cantidad * precio_unitario };
  });
  const subtotal = sumItems(items);
  return { ...data, items, subtotal, total: subtotal };
}

function nextNumero() {
  const commercial = store.list('quotations').filter((row) => row.kind === 'commercial' && row.numero);
  const nums = commercial.map((row) => Number(String(row.numero).split('-').pop()) || 0);
  const next = Math.max(20, ...nums) + 1;
  return `COT-2026-${String(next).padStart(3, '0')}`;
}

export const quotationsService = {
  async getAll() {
    return store.list('quotations', { sort: '-created' });
  },

  async getById(id) {
    return store.findById('quotations', id);
  },

  async getCategories() {
    return store.list('quotation_categories', { sort: 'orden,nombre' });
  },

  async createCategory(data) {
    const cats = store.list('quotation_categories');
    return store.insert('quotation_categories', { nombre: data.nombre, orden: data.orden ?? cats.length + 1 });
  },

  async updateCategory(id, data) {
    return store.update('quotation_categories', id, data);
  },

  async deleteCategory(id) {
    return store.remove('quotation_categories', id);
  },

  async create(data) {
    const kind = data.kind || (data.items?.length ? 'commercial' : 'library');
    const payload = withTotals({
      ...data,
      kind,
      estado: data.estado || (kind === 'commercial' ? 'borrador' : 'documento'),
      numero: data.numero || (kind === 'commercial' ? nextNumero() : ''),
      fecha: data.fecha || new Date().toISOString().slice(0, 10),
    });
    return store.insert('quotations', payload);
  },

  async update(id, data) {
    const current = store.findById('quotations', id);
    if (!current) throw new Error('Cotización no encontrada');
    const merged = withTotals({ ...current, ...data, items: data.items ?? current.items });
    return store.update('quotations', id, merged);
  },

  async delete(id) {
    return store.remove('quotations', id);
  },

  async updateStatus(id, estado) {
    const current = store.findById('quotations', id);
    if (!current) throw new Error('Cotización no encontrada');
    if (current.kind !== 'commercial') {
      throw new Error('Los documentos de biblioteca no tienen flujo de estado comercial.');
    }
    const allowed = QUOTATION_FLOW[current.estado] || [];
    if (!allowed.includes(estado)) {
      throw new Error(`Transición inválida: ${current.estado} → ${estado}`);
    }
    return store.update('quotations', id, { estado });
  },

  /**
   * POC-only: convert an accepted commercial quotation into a schedule/job.
   * Existing production app did not have this conversion.
   */
  async convertToSchedule(id, extras = {}) {
    const quote = store.findById('quotations', id);
    if (!quote) throw new Error('Cotización no encontrada');
    if (quote.kind !== 'commercial') throw new Error('Solo cotizaciones comerciales se convierten a trabajo.');
    if (quote.estado !== 'aceptada') throw new Error('La cotización debe estar ACEPTADA para convertirla.');
    if (quote.schedule_id) {
      return { quotation: quote, schedule: store.findById('schedules', quote.schedule_id), alreadyConverted: true };
    }

    const client = quote.cliente_id ? store.findById('clientes', quote.cliente_id) : null;
    const schedule = await schedulesService.create({
      type: extras.type || 'seguridad',
      cliente: client?.nombre || quote.cliente_nombre,
      cliente_id: quote.cliente_id,
      lugar: client?.direccion || extras.lugar || 'Por definir',
      descripcion_trabajo: `${quote.titulo} (${quote.numero})`,
      monto: quote.total || 0,
      adelanto: extras.adelanto || 0,
      saldo: (quote.total || 0) - (extras.adelanto || 0),
      estado: 'programado',
      fecha_programada: extras.fecha_programada || `${new Date().toISOString().slice(0, 10)} 00:00:00`,
      sucursal_id: client?.sucursal_id || extras.sucursal_id || '',
      vendedor_responsable_id: quote.vendedor_id || extras.vendedor_responsable_id || '',
      vendedor_nombre: quote.vendedor_nombre || '',
      tecnico_responsable_id: extras.tecnico_responsable_id || '',
      quotation_id: quote.id,
      observaciones: `POC: convertido desde ${quote.numero}`,
    });

    const quotation = store.update('quotations', id, { estado: 'convertida', schedule_id: schedule.id });
    return { quotation, schedule, alreadyConverted: false };
  },
};

export default quotationsService;
