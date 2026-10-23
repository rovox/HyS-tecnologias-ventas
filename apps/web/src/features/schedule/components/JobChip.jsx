import { cn } from '@/lib/utils';
import { DIVISION, JOB_STATE } from '../constants.js';

/** One job in the calendar: division color, time, client and what is done. Details open on click. */
export function JobChip({ job, onOpen, compact }) {
  const division = DIVISION[job.categoriaId] || DIVISION.seguridad_electronica;
  const state = JOB_STATE[job.estado];
  return (
    <button
      type="button"
      onClick={() => onOpen(job)}
      className={cn(
        'w-full rounded border border-border border-l-4 bg-card px-2 py-1 text-left text-xs shadow-sm hover:shadow',
        division.border,
        job.estado === 'cancelado' && 'opacity-60 line-through',
      )}
      title={`${job.cliente?.nombre} · ${job.descripcionTrabajo} · ${state?.label}`}
    >
      <span className="flex items-center gap-1">
        <span className={cn('h-2 w-2 shrink-0 rounded-full', state?.dot)} aria-label={state?.label} />
        {job.horario && <span className="shrink-0 text-muted-foreground">{job.horario.split(/[–-]/)[0]}</span>}
        <span className="truncate font-medium text-foreground">{job.cliente?.nombre}</span>
      </span>
      {!compact && <span className="mt-0.5 block truncate text-muted-foreground">{job.descripcionTrabajo}</span>}
      {!compact && job.tecnico && <span className="block truncate text-muted-foreground">{job.tecnico.name}</span>}
    </button>
  );
}

export function DivisionLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Leyenda">
      {Object.entries(DIVISION).map(([id, d]) => (
        <span key={id} className="inline-flex items-center gap-1">
          <span className={cn('h-2.5 w-2.5 rounded-sm', d.dot)} /> {d.short}
        </span>
      ))}
      <span className="mx-1 text-border">|</span>
      {Object.entries(JOB_STATE).map(([id, s]) => (
        <span key={id} className="inline-flex items-center gap-1">
          <span className={cn('h-2 w-2 rounded-full', s.dot)} /> {s.label}
        </span>
      ))}
    </div>
  );
}
