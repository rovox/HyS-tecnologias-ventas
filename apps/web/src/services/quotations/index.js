import { API_URL } from '@/api/config.js';
import { apiClient, authToken, mapQuote } from '@/api/http.js';

function vendorPayload(data) {
  return (Array.isArray(data.vendedores) ? data.vendedores : []).map((row) => ({
    userId: row.user_id,
    nombre: row.nombre,
    commissionPct: Number(row.comision_pct) || 0,
  }));
}

const quotationsService = {
  async getAll() {
    const rows = await apiClient.get('quotations', { token: authToken() });
    return (rows || []).map(mapQuote);
  },

  async getById(id) {
    return mapQuote(await apiClient.get(`quotations/${id}`, { token: authToken() }));
  },

  async getCategories() {
    const { default: categoriesService } = await import('@/services/categories/index.js');
    return categoriesService.getAll();
  },

  async create(data, files = []) {
    const row = await apiClient.post('quotations', {
      titulo: data.titulo,
      ...(data.cliente_id ? { clienteId: data.cliente_id } : {}),
      categoriaId: data.categoria_id,
      subcategoria: data.subcategoria,
      sucursalId: data.sucursal_id,
      sucursalNombre: data.sucursal_nombre,
      monto: Number(data.monto ?? data.total ?? 1),
      observacion: data.observacion,
      vendedores: vendorPayload(data),
      tieneLicitacion: Boolean(data.tiene_licitacion),
      licitacionNumero: data.licitacion_numero || undefined,
      licitacionEntidad: data.licitacion_entidad || undefined,
      plazoFinal: data.plazo_final || undefined,
    }, { token: authToken() });
    let quote = mapQuote(row);
    const pdfFiles = files.filter((f) => f._kind !== 'licitacion');
    const licitacionFiles = files.filter((f) => f._kind === 'licitacion');
    for (const file of pdfFiles) {
      quote = await this.attachFile(quote.id, file);
    }
    for (const file of licitacionFiles) {
      quote = await this.attachFile(quote.id, file, 'licitacion');
    }
    if (data.estado === 'enviado') {
      quote = await this.updateStatus(quote.id, 'enviado');
    }
    return quote;
  },

  async attachFile(id, file, kind = 'pdf') {
    const body = new FormData();
    body.append('file', file);
    const docKind = kind === 'licitacion' || kind === 'prerequisito' ? kind : undefined;
    return mapQuote(await apiClient.post(`quotations/${id}/files`, body, {
      token: authToken(),
      query: docKind ? { kind: docKind } : undefined,
    }));
  },

  async update(id, data) {
    return mapQuote(await apiClient.patch(`quotations/${id}`, {
      ...(data.titulo !== undefined ? { titulo: data.titulo } : {}),
      ...(data.categoriaId !== undefined || data.categoria_id !== undefined ? { categoriaId: data.categoriaId || data.categoria_id } : {}),
      ...(data.subcategoria !== undefined ? { subcategoria: data.subcategoria } : {}),
      ...(data.monto !== undefined ? { monto: Number(data.monto) } : {}),
      ...(data.clienteId !== undefined || data.cliente_id !== undefined ? { clienteId: data.clienteId || data.cliente_id } : {}),
      ...(data.fechaEnvio !== undefined || data.fecha_envio !== undefined ? { fechaEnvio: data.fechaEnvio || data.fecha_envio } : {}),
      ...(data.observacion !== undefined ? { observacion: data.observacion } : {}),
      ...(data.vendedores ? { vendedores: vendorPayload(data) } : {}),
      ...(data.tiene_licitacion !== undefined ? { tieneLicitacion: Boolean(data.tiene_licitacion) } : {}),
      ...(data.licitacion_numero !== undefined ? { licitacionNumero: data.licitacion_numero } : {}),
      ...(data.licitacion_entidad !== undefined ? { licitacionEntidad: data.licitacion_entidad } : {}),
      ...(data.plazo_final !== undefined ? { plazoFinal: data.plazo_final || null } : {}),
    }, { token: authToken() }));
  },

  async updateStatus(id, estado, extra = {}) {
    return mapQuote(await apiClient.post(`quotations/${id}/status`, { estado, ...extra }, { token: authToken() }));
  },

  async openAttachment(quote) {
    const local = quote.archivo_pdf_url || quote.archivoPdfUrl;
    if (!local) throw new Error('No hay archivo adjunto');
    const path = local.replace(/^\/api\//, '');
    const response = await fetch(`${API_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`, {
      headers: { Authorization: `Bearer ${authToken()}` },
    });
    if (!response.ok) throw new Error('No se pudo abrir el PDF');
    const blob = await response.blob();
    window.open(URL.createObjectURL(blob), '_blank');
  },

  /** Accepts the quotation; the API creates the sale and the project (schedule) once and returns them. */
  async convertToSchedule(id, extras = {}) {
    const result = await apiClient.post(`quotations/${id}/accept`, {
      type: extras.type,
      fechaProgramada: extras.fecha_programada,
      lugar: extras.lugar,
      tecnicoId: extras.tecnico_id,
    }, { token: authToken() });
    return {
      quotation: mapQuote(result.quotation),
      sale: result.sale,
      schedule: result.schedule,
      alreadyConverted: Boolean(result.alreadyConverted),
    };
  },
};

export default quotationsService;
