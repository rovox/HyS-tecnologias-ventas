import { cn } from '@/lib/utils';
import { PROJECT_STATE } from '../constants.js';

export function ProjectStateBadge({ project, className }) {
  const state = PROJECT_STATE[project.estado] || PROJECT_STATE.planificado;
  return <span className={cn('inline-flex items-center rounded px-2 py-0.5 text-xs font-medium', state.className, className)}>{state.label}</span>;
}

/** Share collected as a thin bar with the percentage. */
export function CollectedBar({ pct }) {
  return (
    <div className="flex items-center gap-2" title={`${pct} % cobrado`}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-secondary" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{pct} %</span>
    </div>
  );
}
