export const JOB_STATE = {
  programado: { label: 'Programado', dot: 'bg-muted-foreground' },
  en_proceso: { label: 'En proceso', dot: 'bg-primary' },
  terminado: { label: 'Terminado', dot: 'bg-secondary' },
  cancelado: { label: 'Cancelado', dot: 'bg-destructive' },
};

/** Static class names per division so Tailwind keeps them (tokens in index.css). */
export const DIVISION = {
  computo_comunicacion: { short: 'Cómputo', border: 'border-l-division-computo', bg: 'bg-division-computo/10', dot: 'bg-division-computo' },
  seguridad_electronica: { short: 'Seguridad', border: 'border-l-division-seguridad', bg: 'bg-division-seguridad/10', dot: 'bg-division-seguridad' },
  cableado_estructurado: { short: 'Cableado', border: 'border-l-division-cableado', bg: 'bg-division-cableado/10', dot: 'bg-division-cableado' },
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
  lugar: 'Lugar',
  descripcionTrabajo: 'Trabajo',
  monto: 'Monto',
  fechaFinalizacion: 'Terminado el',
};

export const formatJobValue = (field, value) => (field === 'estado' ? JOB_STATE[value]?.label : undefined);
