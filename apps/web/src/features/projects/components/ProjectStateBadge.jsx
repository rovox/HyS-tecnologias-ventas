import { cn } from '@/lib/utils';
import { StatusBadge } from '@/shared/views';

export function ProjectStateBadge({ project, className }) {
  return <StatusBadge entity="project" state={project.estado} className={className} />;
}

/** Share collected as a bar with the percentage: green when fully paid, blue while it is being paid. */
export function CollectedBar({ pct }) {
  return (
    <div className="flex items-center gap-2" title={`${pct} % cobrado`}>
      <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full', pct >= 100 ? 'bg-success' : 'bg-info')} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={cn('text-xs font-semibold tabular-nums', pct >= 100 ? 'text-success-fg' : 'text-info-fg')}>{pct} %</span>
    </div>
  );
}
