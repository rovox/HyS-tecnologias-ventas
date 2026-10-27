import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isSameMonth, today } from '../dates.js';
import { JobChip } from './JobChip.jsx';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MAX = 3;

/** Month grid: up to three jobs per day; "+N" opens that week; `onCreate(day)` (commercial roles) programs a job. */
export function MonthView({ grid, month, jobsByDay, onOpen, onShowWeek, onCreate }) {
  const now = today();
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <div className="grid min-w-[42rem] grid-cols-7">
        {WEEKDAYS.map((d) => (
          <div key={d} className="border-b border-border bg-muted/60 px-2 py-1.5 text-center text-xs font-semibold">{d}</div>
        ))}
        {grid.map((day) => {
          const jobs = jobsByDay.get(day) || [];
          return (
            <div key={day} className={cn('min-h-[6.5rem] border-b border-r border-border p-1', !isSameMonth(day, month) && 'bg-muted/40')}>
              <div className="mb-1 flex items-center justify-between">
                {onCreate ? (
                  <button type="button" aria-label={`Programar trabajo el ${day}`} title="Programar trabajo este día" onClick={() => onCreate(day)} className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                    <Plus className="h-3 w-3" />
                  </button>
                ) : <span />}
                <p className={cn('text-xs', day === now ? 'font-bold text-primary' : 'text-muted-foreground')}>{Number(day.slice(8))}</p>
              </div>
              <div className="space-y-1">
                {jobs.slice(0, MAX).map((job) => <JobChip key={job.id} job={job} onOpen={onOpen} compact />)}
                {jobs.length > MAX && (
                  <button type="button" className="w-full text-left text-xs text-primary hover:underline" onClick={() => onShowWeek(day)}>
                    +{jobs.length - MAX} más
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
