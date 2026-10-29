import { useConfirm } from '@/shared/views';
import { formatDay } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { useUpdateJob } from '../api.js';
import { JOB_ACTIONS, JOB_STATE } from '../constants.js';

/** Start, finish or cancel a job after a confirmation that shows which job it is (panel, cards and list rows). */
export function useJobState() {
  const update = useUpdateJob();
  const confirm = useConfirm();
  async function run(job, action) {
    const { ok, reason } = await confirm({
      title: action.confirm,
      details: [
        ['Cliente', job.cliente?.nombre],
        ['Trabajo', job.descripcionTrabajo],
        ['Fecha', `${formatDay(job.fechaProgramada)}${job.horario ? `, ${job.horario}` : ''}`],
        ['Técnico', job.tecnico?.name || 'Sin asignar'],
      ],
      confirmLabel: action.label,
      destructive: action.destructive,
      reason: action.reason,
    });
    if (!ok) return;
    const note = reason ? `${job.observaciones ? `${job.observaciones}\n` : ''}Cancelado: ${reason}` : undefined;
    await update
      .mutateAsync({ id: job.id, estado: action.estado, ...(note ? { observaciones: note } : {}) })
      .then(() => notify.success(`Trabajo ${JOB_STATE[action.estado].label.toLowerCase()}`), () => null);
  }
  /** The next step of an open job (Iniciar or Terminar), without the cancel. */
  const next = (job) => (JOB_ACTIONS[job.estado] || []).find((a) => !a.destructive);
  return { run, next, busy: update.isPending };
}
