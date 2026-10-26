import { cn } from '@/lib/utils';
import { dayLabel, today } from '../dates.js';
import { JobChip } from './JobChip.jsx';

/** Seven columns on desktop; on phones only the days that have jobs (and today), one under the other. */
export function WeekView({ days, jobsByDay, onOpen, phone }) {
  const now = today();
  if (phone) {
    const visible = days.filter((d) => jobsByDay.get(d)?.length || d === now);
    return (
      <div className="space-y-3">
        {visible.map((day) => (
          <section key={day}>
            <h3 className={cn('mb-1 text-sm font-semibold capitalize', day === now && 'text-primary')}>{dayLabel(day)}{day === now && <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">Hoy</span>}</h3>
            <div className="space-y-1.5">
              {(jobsByDay.get(day) || []).map((job) => <JobChip key={job.id} job={job} onOpen={onOpen} />)}
              {!jobsByDay.get(day)?.length && <p className="text-xs text-muted-foreground">Sin trabajos</p>}
            </div>
          </section>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-7 overflow-hidden rounded-md border border-border bg-card">
      {days.map((day) => (
        <section key={day} className="min-h-[24rem] border-r border-border last:border-r-0">
          <h3 className={cn('border-b border-border px-2 py-1.5 text-xs font-semibold capitalize', day === now ? 'bg-primary text-primary-foreground' : 'bg-muted/60')}>
            {dayLabel(day)}
          </h3>
          <div className="space-y-1.5 p-1.5">
            {(jobsByDay.get(day) || []).map((job) => <JobChip key={job.id} job={job} onOpen={onOpen} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
