import { cn } from '@/lib/utils';
import { TONE, statusOf } from '@/shared/lib/status.js';
import { DIVISION, JOB_STATE } from '../constants.js';

const CARD = {
  info: 'bg-info-soft border-info-border border-l-info',
  progress: 'bg-progress-soft border-progress-border border-l-progress',
  success: 'bg-success-soft border-success-border border-l-success',
  danger: 'bg-danger-soft border-danger-border border-l-danger',
  warning: 'bg-warning-soft border-warning-border border-l-warning',
  neutral: 'bg-neutral-soft border-neutral-border border-l-neutral',
};

/** One job in the calendar, painted with its state's colour; the division is a small text tag. */
export function JobChip({ job, onOpen, compact }) {
  const division = DIVISION[job.categoriaId];
  const state = statusOf('job', job.estado);
  const StateIcon = state.icon;
  return (
    <button
      type="button"
      onClick={() => onOpen(job)}
      className={cn('w-full rounded-md border border-l-4 px-2 py-1 text-left text-xs shadow-sm hover:shadow-md', CARD[state.tone])}
      title={`${job.cliente?.nombre} — ${job.descripcionTrabajo} (${state.label})`}
    >
      <span className={cn('flex items-center gap-1 font-semibold', TONE[state.tone].text)}>
        <StateIcon className="h-3 w-3 shrink-0" aria-label={state.label} />
        {job.horario && <span className="shrink-0 tabular-nums">{job.horario.split(/[–-]/)[0]}</span>}
        <span className={cn('truncate text-foreground', state.strike && 'line-through')}>{job.cliente?.nombre}</span>
      </span>
      {!compact && <span className="mt-0.5 block truncate text-foreground/80">{job.descripcionTrabajo}</span>}
      {!compact && (
        <span className="mt-0.5 flex items-center justify-between gap-1 text-muted-foreground">
          <span className={cn('truncate', !job.tecnico && 'font-semibold text-danger-fg')}>{job.tecnico?.name || 'Sin técnico'}</span>
          {division && <DivisionTag id={job.categoriaId} />}
        </span>
      )}
    </button>
  );
}

export function DivisionTag({ id, label }) {
  const division = DIVISION[id];
  if (!division) return null;
  const Icon = division.icon;
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded border border-border bg-card px-1 text-[10px] font-medium text-muted-foreground">
      <Icon className="h-3 w-3" aria-hidden />
      {label || division.short}
    </span>
  );
}

/** Colours mean states only. */
export function StateLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs" aria-label="Leyenda">
      {Object.entries(JOB_STATE).map(([id, s]) => (
        <span key={id} className={cn('inline-flex items-center gap-1 rounded-md border border-l-4 px-2 py-0.5 font-medium', CARD[s.tone], TONE[s.tone].text)}>
          <s.icon className="h-3 w-3" aria-hidden /> {s.label}
        </span>
      ))}
    </div>
  );
}
