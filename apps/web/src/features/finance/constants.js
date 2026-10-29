import { STATUS } from '@/shared/lib/status.js';

export const TIPO_LABEL = { ingreso: 'Ingreso', egreso: 'Egreso', transferencia: 'Transferencia' };

export const CONCEPTOS = {
  // A direct sale is registered from Ventas directas (VD-01), not by hand.
  // "Saldo inicial": the money each box already had, registered by its operator on first use and validated into it.
  ingreso: { devolucion_anticipo: 'Devolución de anticipo', saldo_inicial: 'Saldo inicial', otro: 'Otro ingreso' },
  egreso: {
    material: 'Material',
    combustible: 'Combustible',
    mantenimiento_vehicular: 'Mantenimiento vehicular',
    viaticos: 'Viáticos',
    servicios: 'Servicios',
    sueldos: 'Sueldos',
    alquiler: 'Alquiler',
    impuestos: 'Impuestos',
    marketing: 'Marketing',
    anticipo_por_rendir: 'Anticipo por rendir',
    otro: 'Otro gasto',
  },
  transferencia: { deposito: 'Depósito', retiro: 'Retiro' },
};

/** Every concept, including the payments that come from projects and jobs. */
export const CONCEPTO_LABEL = {
  adelanto: 'Adelanto',
  asistencia: 'Asistencia',
  cobro: 'Cobro',
  venta_directa: 'Venta directa',
  saldo_inicial: 'Saldo inicial',
  diferencia_arqueo: 'Diferencia de arqueo',
  adicional: 'Adicional',
  ...CONCEPTOS.ingreso,
  ...CONCEPTOS.egreso,
  ...CONCEPTOS.transferencia,
};

export const ESTADO = STATUS.movement;

/** + money in, − money out, ↔ between boxes. */
export const sign = (m) => (m.tipo === 'ingreso' ? 1 : m.tipo === 'egreso' ? -1 : 0);

/** Field names of the API → labels in the history (chatter) of a movement. */
export const MOVEMENT_FIELDS = {
  estado: 'Estado',
  concepto: 'Concepto',
  monto: 'Monto',
  fecha: 'Fecha',
  metodo: 'Método',
  nota: 'Nota',
  motivo: 'Motivo',
  cajaId: 'Caja',
  recibidoPorId: 'Tiene el dinero',
  pagadoPor: 'Pagó',
  reembolsadoAt: 'Reembolsado el',
};
