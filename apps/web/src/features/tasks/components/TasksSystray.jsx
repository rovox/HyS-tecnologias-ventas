import { useState } from 'react';
import { ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTaskSummary } from '../api.js';
import { TaskCounters } from './TaskCounters.jsx';
import { TasksPanel } from './TasksPanel.jsx';

/** Always-visible tasks button (Odoo systray): red = nobody in charge; mine = green ✓ when I have none (TSK-03). */
export function TasksSystray() {
  const [open, setOpen] = useState(false);
  const { data } = useTaskSummary();

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        onClick={() => setOpen(true)}
        aria-label={data ? `Tareas: ${data.sinAsignar} sin responsable, ${data.mias} mías${data.vencidas ? `, ${data.vencidas} vencidas` : ''}` : 'Tareas'}
      >
        <ListTodo className="h-5 w-5" />
        <span className="hidden sm:inline">Tareas</span>
        <TaskCounters summary={data} />
      </Button>
      <TasksPanel open={open} onOpenChange={setOpen} />
    </>
  );
}
