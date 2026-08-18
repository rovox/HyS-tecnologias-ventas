/**
 * Quotations
 *
 * EXISTING product behavior: document library (titulo, categoria, archivo).
 * POC-ONLY extension: numbered commercial quotes with items, totals, and status workflow.
 * Field `kind`: 'library' | 'commercial'
 */

export const QUOTATION_STATUSES = ['borrador', 'enviada', 'aceptada', 'rechazada', 'convertida'];

export const QUOTATION_STATUS_LABEL = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  convertida: 'Convertida',
  documento: 'Biblioteca',
};

export const QUOTATION_STATUS_CLASS = {
  borrador: 'bg-slate-100 text-slate-700',
  enviada: 'bg-blue-100 text-blue-700',
  aceptada: 'bg-emerald-100 text-emerald-800',
  rechazada: 'bg-red-100 text-red-700',
  convertida: 'bg-violet-100 text-violet-800',
  documento: 'bg-muted text-muted-foreground',
};

export const QUOTATION_FLOW = {
  borrador: ['enviada', 'rechazada'],
  enviada: ['aceptada', 'rechazada', 'borrador'],
  aceptada: ['convertida', 'rechazada'],
  rechazada: ['borrador'],
  convertida: [],
};

/** Id de equipos (paneles, PCs, laptops, routers, impresoras). Se conserva el id del mock. */
export const EQUIPOS_TECNOLOGIA_ID = 'insumos_tecnologicos';

/** Categorías principales del formulario comercial y del alta de cliente */
export const QUOTATION_MAIN_CATEGORIES = [
  { id: 'seguridad_electronica', label: 'Seguridad Electrónica' },
  { id: EQUIPOS_TECNOLOGIA_ID, label: 'Equipos y tecnología' },
  { id: 'proyectos', label: 'Proyectos' },
];

/** Subcategorías por categoría principal */
export const QUOTATION_SUBCATEGORIES = {
  seguridad_electronica: ['Instalaciones', 'Asistencias'],
  insumos_tecnologicos: [],
  proyectos: ['Redes/Datos', 'Eléctrico'],
};

/** Sucursales disponibles en cotizaciones */
export const QUOTATION_SUCURSALES = [
  { id: 'suc_central', nombre: 'Central' },
  { id: 'suc_quillacollo', nombre: 'Quillacollo' },
  { id: 'suc_punata', nombre: 'Punata' },
];

export const COT_PREFIX = 'COT-';

/** COT-MMDDYY según fecha de creación (mes, día, año 2 dígitos) */
export function buildQuotationDateCode(date = new Date()) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${COT_PREFIX}${mm}${dd}${yy}`;
}

/** Vista previa del próximo código (misma lógica que al guardar) */
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

export const mockQuotationCategories = [
  { id: 'qcat_camaras', nombre: 'Cámaras', orden: 1, created: '2026-01-01 00:00:00', updated: '2026-01-01 00:00:00' },
  { id: 'qcat_alarmas', nombre: 'Alarmas', orden: 2, created: '2026-01-01 00:00:00', updated: '2026-01-01 00:00:00' },
  { id: 'qcat_cercos', nombre: 'Cercos eléctricos', orden: 3, created: '2026-01-01 00:00:00', updated: '2026-01-01 00:00:00' },
  { id: 'qcat_acceso', nombre: 'Control de acceso', orden: 4, created: '2026-01-01 00:00:00', updated: '2026-01-01 00:00:00' },
];

export const mockQuotations = [
  {
    id: 'quo_andina',
    kind: 'commercial',
    numero: 'COT-080426',
    titulo: 'CCTV 16 canales — Comercial Andina',
    categoria: 'Seguridad Electrónica',
    categoria_id: 'seguridad_electronica',
    subcategoria: 'Instalaciones',
    subcategoria_custom: '',
    sucursal_id: 'suc_central',
    sucursal_nombre: 'Central',
    cliente_id: 'cli_andina',
    cliente_nombre: 'Comercial Andina SRL',
    fecha: '2026-08-04',
    estado: 'aceptada',
    vendedor_id: 'usr_ventas',
    vendedor_nombre: 'Dennis',
    vendedores: [{ user_id: 'usr_ventas', nombre: 'Dennis', comision_pct: 100 }],
    items: [
      { descripcion: 'Cámara IP 4MP dome', cantidad: 12, precio_unitario: 780, subtotal: 9360 },
      { descripcion: 'NVR 16ch + HDD 4TB', cantidad: 1, precio_unitario: 4200, subtotal: 4200 },
      { descripcion: 'Instalación y cableado UTP', cantidad: 1, precio_unitario: 4940, subtotal: 4940 },
    ],
    subtotal: 18500,
    total: 18500,
    observacion: 'POC: cotización aceptada lista para convertir a trabajo',
    archivo: 'cot-andina-cctv.pdf',
    imagen_preview: '',
    uploaded_by: 'Dennis',
    schedule_id: 'sch_andina',
    created: '2026-08-04 09:15:00',
    updated: '2026-08-06 14:00:00',
  },
  {
    id: 'quo_hospital',
    kind: 'commercial',
    numero: 'COT-080926',
    titulo: 'Control de acceso — Clínica Horizonte',
    categoria: 'Seguridad Electrónica',
    categoria_id: 'seguridad_electronica',
    subcategoria: 'Instalaciones',
    subcategoria_custom: '',
    sucursal_id: 'suc_quillacollo',
    sucursal_nombre: 'Quillacollo',
    cliente_id: 'cli_hospital',
    cliente_nombre: 'Clínica Horizonte',
    fecha: '2026-08-09',
    estado: 'enviada',
    vendedor_id: 'usr_wilson',
    vendedor_nombre: 'Wilson',
    vendedores: [{ user_id: 'usr_wilson', nombre: 'Wilson', comision_pct: 100 }],
    items: [
      { descripcion: 'Lector biométrico', cantidad: 4, precio_unitario: 1100, subtotal: 4400 },
      { descripcion: 'Cerradura electromagnética', cantidad: 4, precio_unitario: 650, subtotal: 2600 },
      { descripcion: 'Software y puesta en marcha', cantidad: 1, precio_unitario: 1800, subtotal: 1800 },
    ],
    subtotal: 8800,
    total: 8800,
    observacion: 'Enviada al cliente — pendiente de aceptación',
    archivo: 'cot-horizonte-acceso.pdf',
    imagen_preview: '',
    uploaded_by: 'Wilson',
    schedule_id: '',
    created: '2026-08-09 11:00:00',
    updated: '2026-08-09 11:20:00',
  },
  {
    id: 'quo_pino',
    kind: 'commercial',
    numero: 'COT-081226',
    titulo: 'Cerco eléctrico — Residencial Los Pinos',
    categoria: 'Seguridad Electrónica',
    categoria_id: 'seguridad_electronica',
    subcategoria: 'Instalaciones',
    subcategoria_custom: '',
    sucursal_id: 'suc_punata',
    sucursal_nombre: 'Punata',
    cliente_id: 'cli_resid',
    cliente_nombre: 'Residencial Los Pinos',
    fecha: '2026-08-12',
    estado: 'enviada',
    vendedor_id: 'usr_vanesa',
    vendedor_nombre: 'Vanesa',
    vendedores: [{ user_id: 'usr_vanesa', nombre: 'Vanesa', comision_pct: 100 }],
    items: [
      { descripcion: 'Kit cerco 400 m', cantidad: 1, precio_unitario: 6200, subtotal: 6200 },
      { descripcion: 'Energizador 30J', cantidad: 1, precio_unitario: 1450, subtotal: 1450 },
    ],
    subtotal: 7650,
    total: 7650,
    observacion: 'Borrador interno',
    archivo: '',
    imagen_preview: '',
    uploaded_by: 'Vanesa',
    schedule_id: '',
    created: '2026-08-12 16:40:00',
    updated: '2026-08-12 16:40:00',
  },
  {
    id: 'quo_mall_equipos',
    kind: 'commercial',
    numero: 'COT-081526',
    titulo: 'Laptops y red — Plaza Norte Retail',
    categoria: 'Equipos y tecnología',
    categoria_id: 'insumos_tecnologicos',
    subcategoria: 'Laptops, router y panel solar',
    subcategoria_custom: 'Laptops, router y panel solar',
    sucursal_id: 'suc_norte',
    sucursal_nombre: 'Norte El Alto',
    cliente_id: 'cli_mall',
    cliente_nombre: 'Plaza Norte Retail',
    fecha: '2026-08-15',
    estado: 'enviada',
    vendedor_id: 'usr_ventas',
    vendedor_nombre: 'Dennis',
    vendedores: [{ user_id: 'usr_ventas', nombre: 'Dennis', comision_pct: 100 }],
    items: [],
    subtotal: 12500,
    total: 12500,
    observacion: 'Equipos de cómputo y red — detalle en adjunto',
    archivo: 'cot-plaza-equipos.pdf',
    imagen_preview: '',
    uploaded_by: 'Dennis',
    schedule_id: '',
    created: '2026-08-15 10:00:00',
    updated: '2026-08-15 10:00:00',
  },
  {
    id: 'quo_lib_cam',
    kind: 'library',
    numero: '',
    titulo: 'Listado de precios cámaras 2026-Q3',
    categoria: 'Cámaras',
    cliente_id: '',
    cliente_nombre: '',
    fecha: '2026-07-01',
    estado: 'documento',
    vendedor_id: 'usr_admin',
    vendedor_nombre: 'Julio',
    items: [],
    subtotal: 0,
    total: 0,
    observacion: 'Documento de referencia (comportamiento original de biblioteca)',
    archivo: 'lista-camaras-2026.pdf',
    imagen_preview: '',
    uploaded_by: 'Julio',
    schedule_id: '',
    created: '2026-07-01 10:00:00',
    updated: '2026-07-01 10:00:00',
  },
];
