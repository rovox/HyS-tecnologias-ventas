import * as store from '@/mocks/store.js';
import { QUOTATION_FLOW, buildQuotationDateCode } from '@/mocks/quotations.js';
import { schedulesService } from '@/services/schedules/index.js';
import { API_URL } from '@/api/config.js';
import { apiClient, authToken, isMockMode, mapQuote } from '@/api/http.js';
import mockAdapter from '@/api/mockAdapter.js';
import { ROLES } from '@/mocks/users.js';

function withTotals(data) {
  const explicitTotal = data.total ?? data.monto;
  const total = Number(explicitTotal) || 0;
  return { ...data, items: [], subtotal: total, total, monto: total };
}

function nextNumero() {
  const base = buildQuotationDateCode(new Date());
  const commercial = store.list('quotations').filter(
    (row) => row.numero && (row.numero === base || row.numero.startsWith(`${base}-`))
  );
  if (commercial.length === 0) return base;
  return `${base}-${commercial.length + 1}`;
}

function normalizeVendedores(data) {
  const rows = Array.isArray(data.vendedores) ? data.vendedores.filter((row) => row?.user_id) : [];
  if (rows.length > 0) return rows;
  if (data.vendedor_id) {
    return [{ user_id: data.vendedor_id, nombre: data.vendedor_nombre || '', comision_pct: 100 }];
  }
  return [];
}

function vendorPayload(data) {
  return (Array.isArray(data.vendedores) ? data.vendedores : []).map((row) => ({
    userId: row.user_id,
    nombre: row.nombre,
    commissionPct: Number(row.comision_pct) || 0,
  }));
}

export const quotationsService = {
  async getAll() {
    if (!isMockMode) {
      const rows = await apiClient.get('quotations', { token: authToken() });
      return (rows || []).map(mapQuote);
    }
    const me = mockAdapter.authStore.record;
    return store.list('quotations', { sort: '-created' }).filter((row) => {
      if (row.kind === 'library') return false;
      if (me?.role === ROLES.TEC) return false;
      return true;
    });
  },

  async getById(id) {
    if (!isMockMode) {
      return mapQuote(await apiClient.get(`quotations/${id}`, { token: authToken() }));
    }
    return store.findById('quotations', id);
  },

  async getCategories() {
    const { default: categoriesService } = await import('@/services/categories/index.js');
    return categoriesService.getAll();
  },

  async create(data, files = []) {
    if (!isMockMode) {
      const row = await apiClient.post('quotations', {
        titulo: data.titulo,
        ...(data.cliente_id ? { clienteId: data.cliente_id } : {}),
        categoria: data.categoria,
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
    }
    const me = mockAdapter.authStore.record;
    const vendedores = normalizeVendedores(data);
    const resolvedVendors = vendedores.length
      ? vendedores
      : (me ? [{ user_id: me.id, nombre: me.name, comision_pct: 100 }] : []);
    const primaryVendor = resolvedVendors[0];
    const first = files.find((f) => f._kind !== 'licitacion' && f._kind !== 'prerequisito') || files[0];
    const licitacionFiles = files.filter((f) => f._kind === 'licitacion' || f._kind === 'prerequisito');
    const payload = withTotals({
      ...data,
      kind: 'commercial',
      vendedores: resolvedVendors,
      vendedor_id: primaryVendor?.user_id || data.vendedor_id || '',
      vendedor_nombre: primaryVendor?.nombre || data.vendedor_nombre || '',
      estado: data.estado === 'enviado' ? 'enviado' : 'borrador',
      numero: data.numero || nextNumero(),
      fecha: data.fecha || new Date().toISOString().slice(0, 10),
      archivo: first?.name || data.archivo || '',
      archivo_pdf_url: first ? URL.createObjectURL(first) : '',
      tiene_licitacion: Boolean(data.tiene_licitacion),
      licitacion_numero: data.licitacion_numero || '',
      licitacion_entidad: data.licitacion_entidad || '',
      plazo_final: data.plazo_final || null,
      licitacion_archivos: licitacionFiles.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
        kind: file._kind || 'licitacion',
      })),
    });
    const created = store.insert('quotations', payload);
    if (created.cliente_id) store.touchClientActivity(created.cliente_id);
    return created;
  },

  async attachFile(id, file, kind = 'pdf') {
    if (!isMockMode) {
      const body = new FormData();
      body.append('file', file);
      const docKind = kind === 'licitacion' || kind === 'prerequisito' ? kind : undefined;
      return mapQuote(await apiClient.post(`quotations/${id}/files`, body, {
        token: authToken(),
        query: docKind ? { kind: docKind } : undefined,
      }));
    }
    if (kind === 'licitacion' || kind === 'prerequisito') {
      const current = store.findById('quotations', id);
      const prev = Array.isArray(current?.licitacion_archivos) ? current.licitacion_archivos : [];
      return store.update('quotations', id, {
        ...(kind === 'licitacion' ? { tiene_licitacion: true } : {}),
        licitacion_archivos: [...prev, { name: file.name, url: URL.createObjectURL(file), kind }],
      });
    }
    return store.update('quotations', id, {
      archivo: file.name,
      archivo_pdf_url: URL.createObjectURL(file),
    });
  },

  async update(id, data) {
    if (!isMockMode) {
      return mapQuote(await apiClient.patch(`quotations/${id}`, {
      ...(data.titulo !== undefined ? { titulo: data.titulo } : {}),
      ...(data.categoria !== undefined ? { categoria: data.categoria } : {}),
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
    }
    const current = store.findById('quotations', id);
    if (!current) throw new Error('Cotización no encontrada');
    const vendedores = data.vendedores ? normalizeVendedores(data) : current.vendedores;
    const primary = vendedores?.[0];
    return store.update('quotations', id, withTotals({
      ...current,
      ...data,
      vendedores,
      vendedor_id: primary?.user_id || data.vendedor_id || current.vendedor_id,
      vendedor_nombre: primary?.nombre || data.vendedor_nombre || current.vendedor_nombre,
    }));
  },

  async updateStatus(id, estado, extra = {}) {
    if (!isMockMode) {
      return mapQuote(await apiClient.post(`quotations/${id}/status`, { estado, ...extra }, { token: authToken() }));
    }
    const current = store.findById('quotations', id);
    if (!current) throw new Error('Cotización no encontrada');
    const allowed = QUOTATION_FLOW[current.estado] || [];
    if (!allowed.includes(estado)) {
      throw new Error(`Transición inválida: ${current.estado} → ${estado}`);
    }
    if (estado === 'enviado' && !current.archivo && !current.archivo_pdf_url) {
      throw new Error('Adjunta el PDF antes de enviar la cotización');
    }
    const updated = store.update('quotations', id, {
      estado,
      ...(extra.motivoRechazo ? { motivo_rechazo: extra.motivoRechazo } : {}),
      ...(extra.fecha_envio || extra.fechaEnvio ? { fecha_envio: extra.fecha_envio || extra.fechaEnvio } : {}),
    });
    if (estado === 'aceptado' || estado === 'enviado') store.touchClientActivity(current.cliente_id);
    return updated;
  },

  async openAttachment(quote) {
    const local = quote.archivo_pdf_url || quote.archivoPdfUrl;
    if (isMockMode) {
      if (local) {
        window.open(local, '_blank');
        return;
      }
      if (quote.archivo) {
        window.open('/branding/document-placeholder.svg', '_blank');
        return;
      }
      throw new Error('No hay archivo adjunto');
    }
    if (!local) throw new Error('No hay archivo adjunto');
    const path = local.replace(/^\/api\//, '');
    const response = await fetch(`${API_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`, {
      headers: { Authorization: `Bearer ${authToken()}` },
    });
    if (!response.ok) throw new Error('No se pudo abrir el PDF');
    const blob = await response.blob();
    window.open(URL.createObjectURL(blob), '_blank');
  },

  async convertToSchedule(id, extras = {}) {
    if (!isMockMode) {
      const result = await apiClient.post(`quotations/${id}/accept`, {}, { token: authToken() });
      const quotation = mapQuote(result.quotation);
      const job = result.sale?.jobs?.[0];
      const clientNombre = quotation.cliente_nombre || extras.cliente || 'Cliente';
      const schedule = await schedulesService.create({
        type: extras.type || 'seguridad',
        cliente: clientNombre,
        cliente_id: quotation.cliente_id,
        lugar: extras.lugar || 'Por definir',
        descripcion_trabajo: `${quotation.titulo} (${quotation.numero})`,
        monto: quotation.total || 0,
        adelanto: extras.adelanto || 0,
        saldo: (quotation.total || 0) - (extras.adelanto || 0),
        estado: job?.estado || 'programado',
        fecha_programada: extras.fecha_programada || `${new Date().toISOString().slice(0, 10)} 00:00:00`,
        sucursal_id: quotation.sucursal_id || extras.sucursal_id || '',
        vendedor_responsable_id: quotation.vendedor_id || extras.vendedor_responsable_id || '',
        vendedor_nombre: quotation.vendedor_nombre || '',
        quotation_id: quotation.id,
        observaciones: `API: convertido desde ${quotation.numero}`,
      });
      return { quotation, sale: result.sale, schedule, alreadyConverted: Boolean(result.alreadyConverted) };
    }
    const quote = store.findById('quotations', id);
    if (!quote) throw new Error('Cotización no encontrada');
    if (quote.estado !== 'aceptado') throw new Error('La cotización debe estar ACEPTADA para convertirla.');
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
      sucursal_id: quote.sucursal_id || client?.sucursal_id || extras.sucursal_id || '',
      vendedor_responsable_id: quote.vendedor_id || extras.vendedor_responsable_id || '',
      vendedor_nombre: quote.vendedor_nombre || '',
      tecnico_responsable_id: extras.tecnico_responsable_id || '',
      quotation_id: quote.id,
      observaciones: `POC: convertido desde ${quote.numero}`,
    });
    const quotation = store.update('quotations', id, { schedule_id: schedule.id });
    store.touchClientActivity(quote.cliente_id);
    return { quotation, schedule, alreadyConverted: false };
  },
};

export default quotationsService;
