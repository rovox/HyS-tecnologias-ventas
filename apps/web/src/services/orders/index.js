import * as store from '@/mocks/store.js';
import { PEDIDOS_FLOW } from '@/hooks/StateFlowValidator.js';

function nextNumero() {
  const rows = store.list('pedidos_internos');
  const nums = rows.map((row) => Number(String(row.numero_pedido).split('-').pop()) || 0);
  return `PI-2026-${String(Math.max(11, ...nums) + 1).padStart(3, '0')}`;
}

export const ordersService = {
  async getAll(filters = {}) {
    let rows = store.list('pedidos_internos', { sort: '-created' });
    if (filters.estado && filters.estado !== 'Todos') {
      const wanted = Array.isArray(filters.estado) ? filters.estado : [filters.estado];
      rows = rows.filter((row) => wanted.includes(row.estado));
    }
    if (filters.search) {
      const q = String(filters.search).toLowerCase();
      rows = rows.filter((row) => String(row.numero_pedido).toLowerCase().includes(q));
    }
    return rows;
  },

  async getById(id) {
    const pedido = store.findById('pedidos_internos', id);
    if (!pedido) return null;
    const detalles = store.list('detalles_pedidos_internos', { filter: `pedido_id="${id}"` });
    const comentarios = store.list('comentarios_pedidos_internos', { filter: `pedido_id="${id}"` });
    return { ...pedido, detalles, comentarios };
  },

  async create(data) {
    const pedido = store.insert('pedidos_internos', {
      ...data,
      numero_pedido: data.numero_pedido || nextNumero(),
      estado: data.estado || 'solicitado',
    });
    for (const item of data.detalles || data.items || []) {
      await this.addDetalle(pedido.id, item);
    }
    return pedido;
  },

  async addDetalle(pedidoId, item) {
    return store.insert('detalles_pedidos_internos', {
      pedido_id: pedidoId,
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      unidad: item.unidad || 'pza',
    });
  },

  async updateStatus(id, estado, extra = {}) {
    const current = store.findById('pedidos_internos', id);
    if (!current) throw new Error('Pedido no encontrado');
    const allowed = PEDIDOS_FLOW[current.estado] || [];
    if (!allowed.includes(estado)) {
      throw new Error(`Transición inválida: ${current.estado} → ${estado}`);
    }
    return store.update('pedidos_internos', id, { ...extra, estado });
  },

  async addComment(pedidoId, contenido, created_by) {
    return store.insert('comentarios_pedidos_internos', { pedido_id: pedidoId, contenido, created_by });
  },
};

export default ordersService;
