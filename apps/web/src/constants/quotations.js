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

/** Division whose subcategory is free text (equipment, software, telephony…). */
export const EQUIPOS_TECNOLOGIA_ID = 'computo_comunicacion';

/** The 3 divisions, the mandatory category (CAT-01). The API (GET /categories, principal) is the source of truth. */
export const QUOTATION_MAIN_CATEGORIES = [
  { id: 'computo_comunicacion', label: 'Cómputo y comunicación' },
  { id: 'seguridad_electronica', label: 'Seguridad electrónica' },
  { id: 'cableado_estructurado', label: 'Cableado estructurado' },
];

export const QUOTATION_SUBCATEGORIES = {
  computo_comunicacion: [],
  seguridad_electronica: ['Instalaciones', 'Asistencias'],
  cableado_estructurado: ['Redes/Datos', 'Eléctrico', 'Certificación'],
};

export const QUOTATION_FLOW = {
  borrador: ['enviado', 'rechazado'],
  enviado: ['aceptado', 'rechazado'],
  aceptado: [],
  rechazado: ['borrador'],
};

export const COT_PREFIX = 'COT-';

function buildQuotationDateCode(date = new Date()) {
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
