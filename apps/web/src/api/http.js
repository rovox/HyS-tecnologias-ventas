import { isMockMode } from '@/api/config.js';
import apiClient from '@/api/client.js';
import mockAdapter from '@/api/mockAdapter.js';

export const authToken = () => mockAdapter.authStore.token;

export function mapClient(row) {
  if (!row) return row;
  return {
    ...row,
    sucursal_id: row.sucursal_id || row.sucursalId || '',
    created: row.created || row.createdAt,
    updated: row.updated || row.updatedAt,
  };
}

export function mapQuote(row) {
  if (!row) return row;
  return {
    ...row,
    kind: row.kind || 'commercial',
    cliente_id: row.cliente_id || row.clienteId,
    cliente_nombre: row.cliente_nombre || row.cliente?.nombre || '',
    sucursal_id: row.sucursal_id || row.sucursalId,
    sucursal_nombre: row.sucursal_nombre || row.sucursalNombre,
    categoria_id: row.categoria_id || row.categoriaId,
    vendedor_id: row.vendedor_id || row.vendedorId,
    vendedor_nombre: row.vendedor_nombre || row.vendedor?.name || row.sellers?.[0]?.nombre || '',
    vendedores: row.vendedores || (row.sellers || []).map((s) => ({
      user_id: s.userId || s.user_id,
      nombre: s.nombre,
      comision_pct: Number(s.commissionPct ?? s.comision_pct ?? 0),
    })),
    total: Number(row.total ?? row.monto ?? 0),
    monto: Number(row.monto ?? row.total ?? 0),
    archivo: row.archivo || '',
    archivo_pdf_url: row.archivo_pdf_url || row.archivoPdfUrl || '',
    motivo_rechazo: row.motivo_rechazo || row.motivoRechazo || '',
    tiene_licitacion: Boolean(row.tiene_licitacion ?? row.tieneLicitacion ?? row.es_licitacion ?? row.esLicitacion),
    licitacion_numero: row.licitacion_numero || row.licitacionNumero || '',
    licitacion_entidad: row.licitacion_entidad || row.licitacionEntidad || '',
    plazo_final: row.plazo_final || row.plazoFinal || null,
    fecha_envio: row.fecha_envio || row.fechaEnvio || null,
    licitacion_archivos: row.licitacion_archivos || row.licitacionArchivos || [],
    subtotal: Number(row.subtotal ?? row.monto ?? row.total ?? 0),
    items: row.items || [],
    created: row.created || row.createdAt,
  };
}

export { isMockMode, apiClient };
