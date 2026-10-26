import { useState } from 'react';
import { ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTaskSummary } from '../api.js';
import { TasksPanel } from './TasksPanel.jsx';

/** Always-visible tasks button (Odoo systray): how many tasks are pending for me; red when some are overdue. */
export function TasksSystray() {
  const [open, setOpen] = useState(false);
  const { data } = useTaskSummary();
  const pending = data?.mias ?? 0;
  const overdue = data?.vencidas ?? 0;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="relative min-h-11"
        onClick={() => setOpen(true)}
        aria-label={`Tareas: ${pending} pendientes${overdue ? `, ${overdue} vencidas` : ''}`}
        title={data ? `${pending} pendientes, ${data.sinAsignar} sin asignar, ${overdue} vencidas` : 'Tareas'}
      >
        <ListTodo className="h-5 w-5" />
        <span className="hidden sm:inline">Tareas</span>
        {pending > 0 && (
          <span
            className={cn(
              'absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold',
              overdue ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground',
            )}
          >
            {pending}
          </span>
        )}
      </Button>
      <TasksPanel open={open} onOpenChange={setOpen} />
    </>
  );
}
