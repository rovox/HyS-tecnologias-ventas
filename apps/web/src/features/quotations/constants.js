import { formatBs } from '@/shared/lib/format.js';
import { STATUS } from '@/shared/lib/status.js';

// Quotation states as the UI shows them. Transitions are not here: the API returns `transicionesValidas`.

export const QUOTATION_STATE = STATUS.quotation;

/** A deleted quotation keeps its state but is shown as "Eliminada". */
export const displayState = (quote) => (quote.eliminadaAt ? 'eliminada' : quote.estado);

/** Status bar: the main path, plus the closing state when the quotation ended elsewhere. */
export function statusStages(estado) {
  const main = ['borrador', 'enviado', 'aprobado'];
  const stages = main.includes(estado) ? main : [...main.slice(0, 2), estado];
  return stages.map((key) => ({ key, label: QUOTATION_STATE[key].label }));
}

/** How a stored value reads in the history. */
export function formatQuotationValue(field, value) {
  if (field === 'estado') return QUOTATION_STATE[value]?.label;
  if (field === 'monto' && value !== null) return formatBs(value);
  return undefined;
}

/** Action label for each transition the API allows. */
export const TRANSITION_LABEL = {
  enviado: 'Enviar',
  aprobado: 'Aprobar',
  rechazado: 'Rechazar',
  borrador: 'Reabrir',
};

/** Field names of the API → labels in the history (chatter); fields not listed are not shown there. */
export const QUOTATION_FIELDS = {
  titulo: 'Título',
  estado: 'Estado',
  monto: 'Monto',
  clienteId: 'Cliente',
  categoriaId: 'Categoría',
  subcategoria: 'Subcategoría',
  observacion: 'Observación',
  motivoRechazo: 'Motivo de rechazo',
  fechaEnvio: 'Enviada el',
  plazoFinal: 'Plazo final',
  vendedorId: 'Vendedor',
  eliminadaAt: 'Eliminada el',
  motivoEliminacion: 'Motivo de eliminación',
  licitacionNumero: 'N.º licitación',
  licitacionEntidad: 'Entidad',
  archivo: 'Archivo',
};

export const SUBCATEGORY_SUGGESTIONS = {
  computo_comunicacion: ['Equipos', 'Redes', 'Telefonía', 'Software'],
  seguridad_electronica: ['Instalaciones', 'Asistencias', 'CCTV', 'Control de acceso', 'Alarmas'],
  cableado_estructurado: ['Redes/Datos', 'Eléctrico', 'Certificación', 'Energía'],
};
