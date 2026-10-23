import { formatBs } from '@/shared/lib/format.js';

export const PROJECT_STATE = {
  planificado: { label: 'Planificado', className: 'bg-muted text-muted-foreground' },
  en_ejecucion: { label: 'En ejecución', className: 'bg-primary/10 text-primary' },
  entregado: { label: 'Entregado', className: 'bg-secondary/15 text-secondary' },
  cerrado: { label: 'Cerrado', className: 'border border-border bg-background text-foreground' },
  anulado: { label: 'Anulado', className: 'bg-destructive/10 text-destructive line-through' },
};

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

export const PAYMENT_TYPE = {
  adelanto: 'Adelanto',
  cobro: 'Cobro',
  extra_asistencia: 'Adicional',
  descuento: 'Condonado',
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
