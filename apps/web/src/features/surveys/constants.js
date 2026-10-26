import { Ban, CheckCircle2, ClipboardList, Clock, Hourglass, Truck, Wrench } from 'lucide-react';
import { STATUS } from '@/shared/lib/status.js';

export const VISIT_STATE = STATUS.visit;

/** Relevamiento = see what the client needs (before a quotation); asistencia = fix something (support, warranty). */
export const TIPO = {
  relevamiento: { label: 'Relevamiento', icon: ClipboardList },
  asistencia: { label: 'Asistencia', icon: Wrench },
};

export const PRIORIDAD = {
  urgente: { label: 'Urgente', tone: 'danger' },
  alta: { label: 'Alta', tone: 'warning' },
  media: { label: 'Media', tone: 'neutral' },
  baja: { label: 'Baja', tone: 'neutral' },
};

/** Each state change the API may allow: button label, icon, tone and what the notice says. */
export const VISIT_TRANSITION = {
  programado: { label: 'Reprogramar', icon: Clock, tone: 'info', done: 'Visita reprogramada' },
  en_camino: { label: 'Salir a la visita', icon: Truck, tone: 'info', done: 'En camino' },
  en_atencion: { label: 'Atender', icon: Wrench, tone: 'progress', done: 'Visita en atención' },
  pendiente: { label: 'Dejar pendiente', icon: Hourglass, tone: 'warning', done: 'Visita pendiente' },
  resuelto: { label: 'Resolver', icon: CheckCircle2, tone: 'success', done: 'Visita resuelta' },
  cancelado: { label: 'Cancelar visita', icon: Ban, tone: 'danger', done: 'Visita cancelada' },
};

export const CANCEL_REASONS = ['El cliente reprogramó', 'El cliente canceló', 'No se pudo acceder al lugar', 'Se resolvió por teléfono'];

/** API field names → labels in the history. */
export const VISIT_FIELDS = {
  estado: 'Estado',
  fecha: 'Fecha',
  fechaFin: 'Terminada el',
  hora: 'Hora',
  tipoVisita: 'Tipo',
  prioridad: 'Prioridad',
  tecnicoId: 'Técnico',
  vendedorId: 'Vendedor',
  lugar: 'Lugar',
  mapsLink: 'Link de ubicación',
  motivo: 'Motivo',
  problemaReportado: 'Problema reportado',
  equipoAfectado: 'Equipo afectado',
  causaProbable: 'Causa probable',
  diagnostico: 'Diagnóstico',
  solucion: 'Solución',
  necesidadCliente: 'Necesidad del cliente',
  areaRevisar: 'Área a revisar',
  medidasPuntos: 'Medidas / puntos',
  cantidadEstimada: 'Cantidad estimada',
  observacionTecnica: 'Observación técnica',
  observacionFinal: 'Observación final',
  requiereMaterial: 'Requiere material',
  requiereVolver: 'Requiere volver',
  requiereCotizacion: 'Requiere cotización',
  trabajoRelacionadoId: 'Trabajo relacionado',
  garantiaHasta: 'Garantía hasta',
  motivoCancelacion: 'Motivo de cancelación',
  notas: 'Notas',
};
