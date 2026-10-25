import {
  AlertTriangle,
  Archive,
  Ban,
  CheckCircle2,
  CircleDashed,
  CircleDot,
  Clock,
  FileEdit,
  Hourglass,
  Loader,
  PackageCheck,
  Send,
  Truck,
  XCircle,
} from 'lucide-react';

/**
 * Narrative tones (DESIGN.md "Paleta narrativa"). The only place where a meaning becomes a colour:
 * danger = error or alert that must be seen · warning = waiting for someone · success = confirmed, validated, done ·
 * info = scheduled or sent · progress = being worked on · neutral = draft, void or archived.
 */
export const TONE = {
  danger: { badge: 'bg-danger-soft text-danger-fg border-danger-border', solid: 'bg-danger text-danger-foreground', text: 'text-danger-fg', bar: 'bg-danger', border: 'border-danger' },
  warning: { badge: 'bg-warning-soft text-warning-fg border-warning-border', solid: 'bg-warning text-warning-foreground', text: 'text-warning-fg', bar: 'bg-warning', border: 'border-warning' },
  success: { badge: 'bg-success-soft text-success-fg border-success-border', solid: 'bg-success text-success-foreground', text: 'text-success-fg', bar: 'bg-success', border: 'border-success' },
  info: { badge: 'bg-info-soft text-info-fg border-info-border', solid: 'bg-info text-info-foreground', text: 'text-info-fg', bar: 'bg-info', border: 'border-info' },
  progress: { badge: 'bg-progress-soft text-progress-fg border-progress-border', solid: 'bg-progress text-progress-foreground', text: 'text-progress-fg', bar: 'bg-progress', border: 'border-progress' },
  neutral: { badge: 'bg-neutral-soft text-neutral-fg border-neutral-border', solid: 'bg-neutral text-neutral-foreground', text: 'text-neutral-fg', bar: 'bg-neutral', border: 'border-neutral' },
};

/** Every state the UI shows: label, tone, icon. `strike` marks void records (they no longer count). */
export const STATUS = {
  quotation: {
    borrador: { label: 'Borrador', tone: 'neutral', icon: FileEdit },
    enviado: { label: 'Enviada', tone: 'info', icon: Send },
    aprobado: { label: 'Aprobada', tone: 'success', icon: CheckCircle2 },
    rechazado: { label: 'Rechazada', tone: 'danger', icon: XCircle },
    vencido: { label: 'Vencida', tone: 'warning', icon: Hourglass },
    eliminada: { label: 'Eliminada', tone: 'neutral', icon: Ban, strike: true },
  },
  project: {
    planificado: { label: 'Planificado', tone: 'info', icon: Clock },
    en_ejecucion: { label: 'En ejecución', tone: 'progress', icon: Loader },
    entregado: { label: 'Entregado', tone: 'success', icon: PackageCheck },
    cerrado: { label: 'Cerrado', tone: 'neutral', icon: CheckCircle2 },
    anulado: { label: 'Anulado', tone: 'neutral', icon: Ban, strike: true },
  },
  job: {
    programado: { label: 'Programado', tone: 'info', icon: Clock },
    en_proceso: { label: 'En proceso', tone: 'progress', icon: Loader },
    terminado: { label: 'Terminado', tone: 'success', icon: CheckCircle2 },
    cancelado: { label: 'Cancelado', tone: 'danger', icon: XCircle, strike: true },
  },
  movement: {
    por_validar: { label: 'Por validar', tone: 'warning', icon: Hourglass },
    validado: { label: 'Validado', tone: 'success', icon: CheckCircle2 },
    observado: { label: 'Observado', tone: 'danger', icon: AlertTriangle },
    anulado: { label: 'Anulado', tone: 'neutral', icon: Ban, strike: true },
  },
  order: {
    solicitado: { label: 'Solicitado', tone: 'warning', icon: Hourglass },
    aprobado: { label: 'Aprobado', tone: 'info', icon: CheckCircle2 },
    'en_preparación': { label: 'En preparación', tone: 'progress', icon: Loader },
    listo_para_entrega: { label: 'Listo para entregar', tone: 'progress', icon: Truck },
    entregado: { label: 'Entregado', tone: 'success', icon: PackageCheck },
    rechazado: { label: 'Rechazado', tone: 'danger', icon: XCircle },
    cancelado: { label: 'Cancelado', tone: 'neutral', icon: Ban, strike: true },
  },
  visit: {
    pendiente: { label: 'Pendiente', tone: 'warning', icon: Hourglass },
    programado: { label: 'Programado', tone: 'info', icon: Clock },
    en_camino: { label: 'En camino', tone: 'progress', icon: Truck },
    en_atencion: { label: 'En atención', tone: 'progress', icon: Loader },
    resuelto: { label: 'Resuelto', tone: 'success', icon: CheckCircle2 },
    cancelado: { label: 'Cancelado', tone: 'neutral', icon: Ban, strike: true },
  },
  lead: {
    nueva: { label: 'Nueva', tone: 'warning', icon: CircleDot },
    contactada: { label: 'Contactada', tone: 'info', icon: Send },
    convertida: { label: 'Cliente', tone: 'success', icon: CheckCircle2 },
    descartada: { label: 'Descartada', tone: 'neutral', icon: Ban, strike: true },
  },
  product: {
    activo: { label: 'Activo', tone: 'success', icon: CheckCircle2 },
    archivado: { label: 'Archivado', tone: 'neutral', icon: Archive },
  },
};

const UNKNOWN = { tone: 'neutral', icon: CircleDashed };

/** The state's definition, or a neutral one that shows the raw value (never hides an unexpected state). */
export const statusOf = (entity, state) => STATUS[entity]?.[state] || { ...UNKNOWN, label: state || '—' };

