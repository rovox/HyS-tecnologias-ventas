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
  cobro: 'Cobro',
  adicional: 'Adicional',
  ...CONCEPTOS.ingreso,
  ...CONCEPTOS.egreso,
  ...CONCEPTOS.transferencia,
};

export const ESTADO = STATUS.movement;

/** + money in, − money out, ↔ between boxes. */
export const sign = (m) => (m.tipo === 'ingreso' ? 1 : m.tipo === 'egreso' ? -1 : 0);
