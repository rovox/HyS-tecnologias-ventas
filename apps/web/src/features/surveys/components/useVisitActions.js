import { useConfirm } from '@/shared/views';
import { formatDay } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { useVisitStatus } from '../api.js';
import { CANCEL_REASONS, TIPO, VISIT_TRANSITION } from '../constants.js';

const details = (v) => [
  ['Visita', `${TIPO[v.tipoVisita]?.label || v.tipoVisita} del ${formatDay(v.fecha)}${v.hora ? `, ${v.hora}` : ''}`],
  ['Cliente', v.cliente?.nombre],
  ['Lugar', v.lugar],
  ['Técnico', v.tecnico?.name || 'Sin asignar'],
  ['Fotos', String(v.fotos.length)],
];

/** Moves a visit to another state after a confirmation that says which visit it is (and why, to cancel). */
export function useVisitActions() {
  const confirm = useConfirm();
  const status = useVisitStatus();

  const change = async (visit, estado) => {
    const t = VISIT_TRANSITION[estado];
    const cancel = estado === 'cancelado';
    const { ok, reason } = await confirm({
      title: `¿${t.label}?`,
      details: details(visit),
      effect: estado === 'resuelto' ? 'La visita queda cerrada: ya no se edita (ventas puede corregir textos).' : undefined,
      reason: cancel ? 'Motivo de la cancelación' : undefined,
      reasonOptions: cancel ? CANCEL_REASONS : undefined,
      confirmLabel: t.label,
      destructive: cancel,
      tone: t.tone === 'success' ? 'success' : undefined,
    });
    if (!ok) return;
    try {
      await status.mutateAsync({ id: visit.id, estado, ...(cancel ? { motivo: reason } : {}) });
      notify.success(t.done);
    } catch {
      /* shown by the query client */
    }
  };

  return { change, busy: status.isPending };
}
