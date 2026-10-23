import { CalendarDays, FileText, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDay } from '@/shared/lib/format.js';
import { cn } from '@/lib/utils';

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' });
/** Same rule as the API (tasks.rules.ts isOverdue): due day before today in Bolivia. */
const overdue = (t) => t.estado === 'pendiente' && t.plazo && String(t.plazo).slice(0, 10) < today();

/** One task: complete with the checkbox; take it, convert it into a quotation or discard it from the menu. */
export function TaskRow({ task, userId, canQuote, onComplete, onTake, onConvert, onDiscard }) {
  const done = task.estado !== 'pendiente';
  return (
    <li className={cn('flex items-start gap-3 rounded-md border border-border bg-card p-3', done && 'opacity-60')}>
      <Checkbox
        className="mt-0.5"
        checked={task.estado === 'completada'}
        disabled={done}
        aria-label={`Completar ${task.titulo}`}
        onCheckedChange={() => onComplete(task)}
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p className={cn('text-sm font-medium', done && 'line-through')}>{task.titulo}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {task.cliente && <span>{task.cliente.nombre}</span>}
          {task.plazo && (
            <span className={cn('inline-flex items-center gap-1', overdue(task) && 'font-medium text-destructive')}>
              <CalendarDays className="h-3 w-3" /> {formatDay(task.plazo)}
            </span>
          )}
          {task.asignado && task.asignado.id !== userId && <span>{task.asignado.name}</span>}
          {task.quotation && (
            <span className="inline-flex items-center gap-1 text-primary">
              <FileText className="h-3 w-3" /> {task.quotation.numero}
            </span>
          )}
        </div>
      </div>
      {!done && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Acciones de la tarea">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!task.asignado && <DropdownMenuItem onSelect={() => onTake(task)}>Tomar</DropdownMenuItem>}
            {canQuote && !task.quotation && (
              <DropdownMenuItem onSelect={() => onConvert(task)}>Convertir en cotización</DropdownMenuItem>
            )}
            <DropdownMenuItem className="text-destructive" onSelect={() => onDiscard(task)}>
              Descartar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  );
}
