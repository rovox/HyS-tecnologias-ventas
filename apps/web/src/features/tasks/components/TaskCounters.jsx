import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TONE } from '@/shared/lib/status.js';

/**
 * The two counters of the tasks (TSK-03): red = pending tasks nobody is in charge of; mine = red if one is overdue,
 * amber while I have pending ones, green with ✓ when I have none. `summary` = { mias, sinAsignar, vencidas }.
 */
export function TaskCounters({ summary, className }) {
  if (!summary) return null;
  const mine = summary.mias;
  const mineTone = summary.vencidas ? 'danger' : mine ? 'warning' : 'success';
  const pill = 'inline-flex h-5 min-w-5 items-center justify-center gap-0.5 rounded-full px-1.5 text-xs font-bold';
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {summary.sinAsignar > 0 && (
        <span className={cn(pill, TONE.danger.solid)} title={`${summary.sinAsignar} sin responsable`}>
          {summary.sinAsignar}
        </span>
      )}
      <span className={cn(pill, TONE[mineTone].solid)} title={mine ? `${mine} mías${summary.vencidas ? `, ${summary.vencidas} vencidas` : ''}` : 'No tienes tareas pendientes'}>
        {mine ? mine : <Check className="h-3 w-3" />}
      </span>
    </span>
  );
}

/** The same counters with words, for the panel header. */
export function TaskCountersLegend({ summary }) {
  if (!summary) return null;
  const mineTone = summary.vencidas ? 'danger' : summary.mias ? 'warning' : 'success';
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      <span className={cn('rounded-md border px-2 py-1 font-semibold', summary.sinAsignar ? TONE.danger.badge : TONE.neutral.badge)}>
        {summary.sinAsignar} sin responsable
      </span>
      <span className={cn('rounded-md border px-2 py-1 font-semibold', TONE[mineTone].badge)}>
        {summary.mias ? `${summary.mias} mías${summary.vencidas ? ` (${summary.vencidas} vencidas)` : ''}` : '✓ Sin tareas pendientes'}
      </span>
    </div>
  );
}
