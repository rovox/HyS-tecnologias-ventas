import pb from '@/lib/pocketbaseClient.js';

export const ESTADO_PENDIENTE = 'Pendiente rendición';
export const ESTADO_CONFIRMADO = 'Confirmado';

const today = () => new Date().toISOString().split('T')[0];

/**
 * Crea un registro real en la colección `schedule_payments`
 * (la que lee la pestaña Cobros / Rendición de Finanzas).
 * Usa exclusivamente campos que existen en el esquema.
 */
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

  const usuarioId = cobrado_por_id || pb.authStore.record?.id || '';
  const estado = confirmado ? ESTADO_CONFIRMADO : 'Pendiente';
  const estadoRendicion = confirmado ? ESTADO_CONFIRMADO : ESTADO_PENDIENTE;

  const payload = {
    trabajo_id,
    usuario_id: usuarioId,
    fecha: today(),
    tipo,
    tipo_cobro: tipo === 'Adelanto' ? 'adelanto' : 'cobro',
    monto_cobrado: Number(monto) || 0,
    descuento: Number(descuento) || 0,
    adicional: Number(adicional) || 0,
    metodo_pago: metodo_pago || 'efectivo',
    cliente_nombre: cliente_nombre || '',
    sucursal: sucursal_nombre || '',
    vendedor_nombre: vendedor_nombre || '',
    cobrado_por_id: usuarioId,
    cobrado_por_nombre: cobrado_por_nombre || pb.authStore.record?.name || pb.authStore.record?.email || '',
    estado,
    estado_rendicion: estadoRendicion,
    caja_banco_id: confirmado ? (caja_banco_id || '') : '',
    caja_banco_nombre: confirmado ? (caja_banco_nombre || '') : '',
    origen,
    id_origen: `${trabajo_id}:${origen}:${Date.now()}`,
    observacion: observacion || '',
    saldo_anterior: Number(saldo_anterior) || 0,
    saldo_nuevo: Number(saldo_nuevo) || 0,
    visita_id: visita_id || '',
  };

  try {
    return await pb.collection('schedule_payments').create(payload, { $autoCancel: false });
  } catch (err) {
    console.error('Error creando Cobro/Rendición:', err?.response?.data || err);
    throw err;
  }
}
