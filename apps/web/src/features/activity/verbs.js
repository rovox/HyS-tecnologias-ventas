/** What each audit action (`<entity>.<verb>`, the last part) did, in Spanish: the chatter and the activity feed. */
const VERBS = {
  create: 'creó el registro',
  created: 'creó el registro',
  update: 'editó',
  upsert: 'guardó',
  status: 'cambió el estado',
  accept: 'aprobó',
  approve: 'aprobó',
  aprobar: 'aprobó',
  observar: 'observó',
  review: 'revisó',
  reject: 'rechazó',
  file: 'adjuntó un archivo',
  photo: 'subió una foto',
  payment: 'registró un movimiento',
  amount: 'cambió el monto',
  delete: 'eliminó',
  restore: 'restauró',
  convert: 'convirtió',
  complete: 'completó',
  claim: 'tomó',
  annul: 'anuló',
  deactivate: 'desactivó',
  expire: 'venció',
  // Sessions
  login: 'inició sesión',
  logout: 'cerró sesión',
  forgot_password: 'pidió cambiar su contraseña',
  // Ledger (movement.*)
  income: 'registró un cobro',
  ingreso: 'registró un ingreso',
  egreso: 'registró un gasto',
  transferencia: 'registró una transferencia',
  validado: 'validó en caja',
  observado: 'observó',
  anulado: 'anuló',
  por_validar: 'envió a validar',
  rendido: 'marcó como rendido',
  refund: 'marcó como reembolsado',
  reverse: 'revirtió',
  comment: 'comentó',
  // Inventory (stock.*)
  entrada: 'registró una entrada',
  salida: 'registró una salida',
  salida_proyecto: 'sacó material para un proyecto',
  ajuste: 'ajustó el stock',
  baja: 'dio de baja material',
};

export const verbOf = (action) => {
  const last = action.split('.').pop().split('-').pop();
  return VERBS[last] || 'hizo un cambio';
};
