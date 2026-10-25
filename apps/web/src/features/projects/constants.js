import { formatBs } from '@/shared/lib/format.js';
import { STATUS } from '@/shared/lib/status.js';

export const PROJECT_STATE = STATUS.project;

const MAIN = ['planificado', 'en_ejecucion', 'entregado', 'cerrado'];

export function projectStages(estado) {
  const keys = MAIN.includes(estado) ? MAIN : [...MAIN.slice(0, 3), estado];
  return keys.map((key) => ({ key, label: PROJECT_STATE[key].label }));
}

export const PROJECT_TRANSITION = {
  en_ejecucion: (p) => ({
    label: p.estado === 'entregado' ? 'Volver a ejecución' : 'Iniciar ejecución',
    title: `¿${p.estado === 'entregado' ? 'Volver a ejecución' : 'Iniciar la ejecución de'} ${p.codigo}?`,
    confirmLabel: 'Confirmar',
    done: 'Proyecto en ejecución',
  }),
  entregado: (p) => ({
    label: 'Marcar entregado',
    title: `¿Marcar ${p.codigo} como entregado?`,
    description: `Empieza la garantía de ${p.garantiaMeses} meses desde hoy.`,
    confirmLabel: 'Marcar entregado',
    done: 'Proyecto entregado: empieza la garantía',
  }),
  cerrado: (p) => ({
    label: 'Cerrar',
    title: `¿Cerrar ${p.codigo}?`,
    description: 'Un proyecto cerrado ya no admite cambios. Solo se cierra sin saldo pendiente.',
    confirmLabel: 'Cerrar proyecto',
    done: 'Proyecto cerrado',
  }),
  anulado: (p) => ({
    label: 'Anular',
    title: `¿Anular ${p.codigo}?`,
    description: 'Solo Gerencia. Los trabajos pendientes se cancelan y el saldo deja de cobrarse.',
    confirmLabel: 'Anular',
    destructive: true,
    reason: 'Motivo de la anulación',
    done: 'Proyecto anulado',
  }),
};

/** Ledger concepts shown on a project (payments and expenses). */
export const PAYMENT_TYPE = {
  adelanto: 'Adelanto',
  cobro: 'Cobro',
  adicional: 'Adicional',
  material: 'Material',
  combustible: 'Combustible',
  viaticos: 'Viáticos',
  servicios: 'Servicios',
  otro: 'Otro',
};

export const PROJECT_FIELDS = {
  titulo: 'Título',
  estado: 'Estado',
  garantiaMeses: 'Meses de garantía',
  responsableId: 'Responsable',
  entregadoAt: 'Entregado el',
  cerradoAt: 'Cerrado el',
  motivoAnulacion: 'Motivo de anulación',
  montoOficial: 'Monto oficial',
};

export function formatProjectValue(field, value) {
  if (field === 'estado') return PROJECT_STATE[value]?.label;
  if (field === 'montoOficial' && value !== null) return formatBs(value);
  return undefined;
}
