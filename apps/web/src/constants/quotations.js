export const QUOTATION_STATUSES = ['borrador', 'enviado', 'aceptado', 'rechazado'];

export const QUOTATION_STATUS_LABEL = {
  borrador: 'Borrador',
  enviado: 'Enviado',
  aceptado: 'Aceptado',
  rechazado: 'Rechazado',
};

export const QUOTATION_STATUS_CLASS = {
  borrador: 'bg-slate-200 text-slate-800 ring-1 ring-slate-400/80',
  enviado: 'bg-blue-100 text-blue-700',
  aceptado: 'bg-emerald-100 text-emerald-800',
  rechazado: 'bg-red-100 text-red-700',
};

export const EQUIPOS_TECNOLOGIA_ID = 'insumos_tecnologicos';

export const QUOTATION_MAIN_CATEGORIES = [
  { id: 'seguridad_electronica', label: 'Seguridad Electrónica' },
  { id: EQUIPOS_TECNOLOGIA_ID, label: 'Equipos y tecnología' },
  { id: 'proyectos', label: 'Proyectos' },
];

export const QUOTATION_SUBCATEGORIES = {
  seguridad_electronica: ['Instalaciones', 'Asistencias'],
  insumos_tecnologicos: [],
  proyectos: ['Redes/Datos', 'Eléctrico'],
};

export const QUOTATION_SUCURSALES = [];

export const QUOTATION_FLOW = {
  borrador: ['enviado', 'rechazado'],
  enviado: ['aceptado', 'rechazado'],
  aceptado: [],
  rechazado: ['borrador'],
};

export const COT_PREFIX = 'COT-';

export function buildQuotationDateCode(date = new Date()) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${COT_PREFIX}${mm}${dd}${yy}`;
}

export function peekNextQuotationNumero(existing = [], date = new Date()) {
  const base = buildQuotationDateCode(date);
  const sameDay = existing.filter(
    (q) => q.kind === 'commercial' && q.numero && (q.numero === base || q.numero.startsWith(`${base}-`))
  );
  if (sameDay.length === 0) return base;
  return `${base}-${sameDay.length + 1}`;
}

export function formatQuotationTitle(quote) {
  const code = quote?.numero?.startsWith(COT_PREFIX) ? quote.numero : `${COT_PREFIX}${quote?.numero || ''}`;
  const summary = (quote?.titulo || '').trim();
  return summary ? `${code} — ${summary}` : code;
}
