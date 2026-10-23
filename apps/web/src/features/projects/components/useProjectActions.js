import { useConfirm } from '@/shared/views';
import { notify } from '@/shared/lib/notify.js';
import { useChangeProjectStatus } from '../api.js';
import { PROJECT_TRANSITION } from '../constants.js';

/** Project state changes: always confirmed (with a reason to cancel), then notified. */
export function useProjectActions() {
  const confirm = useConfirm();
  const status = useChangeProjectStatus();

  async function changeStatus(project, estado) {
    const prompt = PROJECT_TRANSITION[estado](project);
    const { ok, reason } = await confirm(prompt);
    if (!ok) return;
    try {
      await status.mutateAsync({ id: project.id, estado, motivo: reason });
      notify.success(prompt.done);
    } catch {
      /* shown by the query client */
    }
  }

  return { changeStatus, busy: status.isPending };
}
