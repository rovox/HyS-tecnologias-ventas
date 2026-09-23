import { apiClient, authToken } from '@/api/http.js';

export const ESTADO_PENDIENTE = 'Pendiente rendición';
export const ESTADO_CONFIRMADO = 'Confirmado';

const today = () => new Date().toISOString().split('T')[0];

export async function crearCobroRendicion({
  trabajo_id,
  tipo = 'Cobro final',
  monto = 0,
  metodo_pago = 'efectivo',
  cliente_nombre = '',
  sucursal_nombre = '',
  vendedor_nombre = '',
  cobrado_por_id = '',
  cobrado_por_nombre = '',
  origen = 'trabajo_cobro_final',
  confirmado = false,
  caja_banco_id = '',
  caja_banco_nombre = '',
  observacion = '',
  descuento = 0,
  adicional = 0,
  saldo_anterior = 0,
  saldo_nuevo = 0,
  visita_id = '',
} = {}) {
  if (!trabajo_id) throw new Error('trabajo_id requerido para registrar el cobro');

  const payload = {
    trabajo_id,
    fecha: today(),
    tipo,
    monto_cobrado: Number(monto) || 0,
    descuento: Number(descuento) || 0,
    adicional: Number(adicional) || 0,
    metodo_pago: metodo_pago || 'efectivo',
    cliente_nombre,
    sucursal: sucursal_nombre,
    vendedor_nombre,
    cobrado_por_id,
    cobrado_por_nombre,
    estado: confirmado ? ESTADO_CONFIRMADO : 'Pendiente',
    estado_rendicion: confirmado ? ESTADO_CONFIRMADO : ESTADO_PENDIENTE,
    caja_banco_id: confirmado ? caja_banco_id : '',
    caja_banco_nombre: confirmado ? caja_banco_nombre : '',
    origen,
    observacion,
    saldo_anterior: Number(saldo_anterior) || 0,
    saldo_nuevo: Number(saldo_nuevo) || 0,
    visita_id,
  };

  try {
    return await apiClient.post('schedule-payments', payload, { token: authToken() });
  } catch (err) {
    console.warn('[cobrosRendicion] schedule-payments endpoint not available, skipping:', err?.message);
    return { id: null, ...payload };
  }
}
