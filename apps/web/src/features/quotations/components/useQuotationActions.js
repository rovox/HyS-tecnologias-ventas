import { useConfirm } from '@/shared/views';
import { notify } from '@/shared/lib/notify.js';
import { useChangeQuotationStatus, useDeleteQuotation, useRestoreQuotation } from '../api.js';

const PROMPTS = {
  enviado: (q) => ({
    title: `¿Enviar ${q.numero}?`,
    description: 'Queda registrada como enviada al cliente y vence en 15 días si no hay respuesta.',
    confirmLabel: 'Enviar',
    done: 'Cotización enviada',
  }),
  aprobado: (q) => ({
    title: `¿Aprobar ${q.numero}?`,
    description: 'Se crea el proyecto con el monto de la cotización. Una cotización aprobada ya no se rechaza ni se elimina: se cancela su proyecto.',
    confirmLabel: 'Aprobar y crear proyecto',
    done: 'Cotización aprobada: proyecto creado',
  }),
  rechazado: (q) => ({
    title: `¿Rechazar ${q.numero}?`,
    description: 'Pasa a cotizaciones cerradas. Se puede reabrir después.',
    confirmLabel: 'Rechazar',
    destructive: true,
    reason: 'Motivo del rechazo',
    done: 'Cotización rechazada',
  }),
  borrador: (q) => ({
    title: `¿Reabrir ${q.numero}?`,
    description: 'Vuelve a borrador para editarla y enviarla de nuevo.',
    confirmLabel: 'Reabrir',
    done: 'Cotización reabierta',
  }),
};

/** Every quotation action asks for confirmation, then notifies the result (errors are toasted by the query client). */
export function useQuotationActions() {
  const confirm = useConfirm();
  const status = useChangeQuotationStatus();
  const remove = useDeleteQuotation();
  const restore = useRestoreQuotation();

  async function changeStatus(quote, estado) {
    const prompt = PROMPTS[estado](quote);
    const { ok, reason } = await confirm(prompt);
    if (!ok) return null;
    const updated = await status.mutateAsync({ id: quote.id, estado, motivoRechazo: reason });
    notify.success(prompt.done);
    return updated;
  }

  async function deleteQuote(quote) {
    const { ok, reason } = await confirm({
      title: `¿Eliminar ${quote.numero}?`,
      description: 'Se oculta de la lista y queda en "Cerradas › Eliminadas" con el motivo. Se puede restaurar.',
      confirmLabel: 'Eliminar',
      destructive: true,
      reason: 'Motivo de la eliminación',
    });
    if (!ok) return null;
    const updated = await remove.mutateAsync({ id: quote.id, motivo: reason });
    notify.success('Cotización eliminada');
    return updated;
  }

  async function restoreQuote(quote) {
    const { ok } = await confirm({ title: `¿Restaurar ${quote.numero}?`, description: 'Vuelve a su estado anterior.', confirmLabel: 'Restaurar' });
    if (!ok) return null;
    const updated = await restore.mutateAsync(quote.id);
    notify.success('Cotización restaurada');
    return updated;
  }

  const busy = status.isPending || remove.isPending || restore.isPending;
  /** Errors are already shown by the query client; callers only need to not crash. */
  const safe = (fn) => (...args) => fn(...args).catch(() => null);
  return { changeStatus: safe(changeStatus), deleteQuote: safe(deleteQuote), restoreQuote: safe(restoreQuote), busy };
}
