import { STATUS } from '@/shared/lib/status.js';

export const TIPO_LABEL = { ingreso: 'Ingreso', egreso: 'Egreso', transferencia: 'Transferencia' };

export const CONCEPTOS = {
  ingreso: { venta_directa: 'Venta directa', otro: 'Otro ingreso' },
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
    otro: 'Otro gasto',
  },
  transferencia: { deposito: 'Depósito', retiro: 'Retiro' },
};

/** Every concept, including the payments that come from projects and jobs. */
export const CONCEPTO_LABEL = {
  adelanto: 'Adelanto',
  asistencia: 'Asistencia',
  cobro: 'Cobro',
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
