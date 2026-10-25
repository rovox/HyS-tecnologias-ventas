import { Cable, Cctv, Monitor } from 'lucide-react';
import { STATUS } from '@/shared/lib/status.js';

export const JOB_STATE = STATUS.job;

/** The division is a text tag with an icon (the colour belongs to the state, so the two are never confused). */
export const DIVISION = {
  computo_comunicacion: { short: 'Cómputo', icon: Monitor },
  seguridad_electronica: { short: 'Seguridad', icon: Cctv },
  cableado_estructurado: { short: 'Cableado', icon: Cable },
};

/** What can be done to a job from each state (the API checks the same flow). */
export const JOB_ACTIONS = {
  programado: [
    { estado: 'en_proceso', label: 'Iniciar', confirm: '¿Iniciar el trabajo?' },
    { estado: 'cancelado', label: 'Cancelar', confirm: '¿Cancelar el trabajo?', destructive: true, reason: 'Motivo de la cancelación' },
  ],
  en_proceso: [
    { estado: 'terminado', label: 'Terminar', confirm: '¿Marcar el trabajo como terminado?' },
    { estado: 'cancelado', label: 'Cancelar', confirm: '¿Cancelar el trabajo?', destructive: true, reason: 'Motivo de la cancelación' },
  ],
  terminado: [],
  cancelado: [],
};

export const JOB_FIELDS = {
  estado: 'Estado',
  tecnicoId: 'Técnico',
  fechaProgramada: 'Fecha',
  horario: 'Horario',
  observaciones: 'Notas',
  vendedorId: 'Vendedor',
  categoriaId: 'Categoría',
  lugar: 'Lugar',
  mapsLink: 'Link de ubicación',
  descripcionTrabajo: 'Trabajo',
  monto: 'Monto',
  fechaFinalizacion: 'Terminado el',
};
