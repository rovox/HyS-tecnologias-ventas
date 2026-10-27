import { CheckCircle2, Copy, ListTodo, Send, XCircle } from 'lucide-react';
import { useCreateTask } from '@/features/tasks';
import { RowQuickActions, useConfirm } from '@/shared/views';
import { notify } from '@/shared/lib/notify.js';
import { useQuotationActions } from './useQuotationActions.js';

/**
 * Quick actions of a quotation row (QUO-03): Enviar, Aprobar → Proyecto (green), Rechazar with quick reasons (red),
 * Duplicar and Tarea. Only what the API allows in its state (`transicionesValidas`); every one asks for confirmation.
 */
export function QuotationRowActions({ quote, onDuplicate }) {
  const actions = useQuotationActions();
  const createTask = useCreateTask();
  const confirm = useConfirm();
  const can = (estado) => !quote.eliminadaAt && quote.transicionesValidas?.includes(estado);

  async function addTask() {
    const { ok, reason } = await confirm({
      title: `Tarea para ${quote.numero}`,
      details: [['Cotización', quote.titulo], ['Cliente', quote.cliente?.nombre]],
      reason: 'Qué hay que hacer',
      reasonOptions: ['Llamar al cliente', 'Enviar el PDF', 'Coordinar visita', 'Revisar la licitación'],
      confirmLabel: 'Crear tarea',
    });
    if (!ok) return;
    createTask
      .mutateAsync({ titulo: `${reason} — ${quote.numero}`, tipo: 'cotizacion', cotizacionId: quote.id, clienteId: quote.clienteId || undefined })
      .then(() => notify.success('Tarea creada: está en Tareas, sin responsable'), () => null);
  }

  return (
    <RowQuickActions
      actions={[
        { key: 'send', icon: Send, label: 'Enviar al cliente', tone: 'info', hidden: !can('enviado'), disabled: actions.busy, onClick: () => actions.changeStatus(quote, 'enviado') },
        { key: 'ok', icon: CheckCircle2, label: 'Aprobar y crear el proyecto', tone: 'success', hidden: !can('aprobado'), disabled: actions.busy, onClick: () => actions.changeStatus(quote, 'aprobado') },
        { key: 'no', icon: XCircle, label: 'Rechazar (pide motivo)', tone: 'danger', hidden: !can('rechazado'), disabled: actions.busy, onClick: () => actions.changeStatus(quote, 'rechazado') },
        { key: 'copy', icon: Copy, label: 'Duplicar', onClick: () => onDuplicate(quote) },
        { key: 'task', icon: ListTodo, label: 'Nueva tarea de esta cotización', hidden: Boolean(quote.eliminadaAt), disabled: createTask.isPending, onClick: addTask },
      ]}
    />
  );
}
