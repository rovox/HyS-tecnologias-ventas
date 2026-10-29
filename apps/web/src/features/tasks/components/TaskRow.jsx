import { useState } from 'react';
import { CalendarDays, Check, FileText, Hand, MoreHorizontal, Pencil, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SearchSelect } from '@/shared/views';
import { businessDayOf, formatBusinessDay, formatDay } from '@/shared/lib/format.js';
import { cn } from '@/lib/utils';

/** Same rule as the API (tasks.rules.ts isOverdue): due day before today in Bolivia. */
const overdue = (t) => t.estado === 'pendiente' && t.plazo && String(t.plazo).slice(0, 10) < businessDayOf();

/**
 * One task with its quick actions (TSK-03): Tomar when nobody is in charge, Completar in green, the pencil changes who
 * is in charge and the deadline in place; the ⋯ menu converts it into a quotation or discards it. An archived task
 * (completed or discarded) shows when it was closed and can be reopened.
 */
export function TaskRow({ task, userId, people, canTake, canQuote, onComplete, onTake, onSave, onConvert, onDiscard, onReopen }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ asignadoId: '', plazo: '' });
  const pending = task.estado === 'pendiente';
  const startEdit = () => {
    setDraft({ asignadoId: task.asignado?.id || '', plazo: task.plazo ? String(task.plazo).slice(0, 10) : '' });
    setEditing(true);
  };
  const save = async (e) => {
    e.preventDefault();
    const ok = await onSave(task, { asignadoId: draft.asignadoId || null, plazo: draft.plazo || null });
    if (ok) setEditing(false);
  };

  return (
    <li className={cn('space-y-2 rounded-md border border-border bg-card p-3', overdue(task) && 'border-l-4 border-l-danger')}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <p className={cn('text-sm font-medium', task.estado === 'descartada' && 'line-through text-muted-foreground')}>{task.titulo}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {task.cliente && <span>{task.cliente.nombre}</span>}
            {task.plazo && (
              <span className={cn('inline-flex items-center gap-1', overdue(task) && 'font-semibold text-danger-fg')}>
                <CalendarDays className="h-3 w-3" /> {formatDay(task.plazo)}
              </span>
            )}
            {pending && !task.asignado && <span className="font-semibold text-danger-fg">Sin responsable</span>}
            {task.asignado && task.asignado.id !== userId && <span>{task.asignado.name}</span>}
            {task.quotation && (
              <span className="inline-flex items-center gap-1 text-primary">
                <FileText className="h-3 w-3" /> {task.quotation.numero}
              </span>
            )}
            {!pending && (
              <span className={cn('font-semibold', task.estado === 'completada' ? 'text-success-fg' : 'text-muted-foreground')}>
                {task.estado === 'completada' ? 'Completada' : 'Descartada'} el {formatBusinessDay(task.archivadaAt || task.updatedAt)}
              </span>
            )}
          </div>
        </div>
        {pending ? (
          <div className="flex shrink-0 items-center gap-1">
            {canTake && !task.asignado && (
              <Button size="sm" variant="outline" className="h-8" onClick={() => onTake(task)}>
                <Hand /> Tomar
              </Button>
            )}
            <Button size="sm" variant="success" className="h-8" aria-label={`Completar ${task.titulo}`} onClick={() => onComplete(task)}>
              <Check /> Completar
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Responsable y plazo" title="Responsable y plazo" onClick={() => (editing ? setEditing(false) : startEdit())}>
              <Pencil />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Acciones de la tarea">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canQuote && !task.quotation && <DropdownMenuItem onSelect={() => onConvert(task)}>Convertir en cotización</DropdownMenuItem>}
                {canQuote && !task.quotation && <DropdownMenuSeparator />}
                <DropdownMenuItem className="text-danger-fg" onSelect={() => onDiscard(task)}>
                  Descartar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button size="sm" variant="ghost" className="h-8 shrink-0" onClick={() => onReopen(task)}>
            <RotateCcw /> Reabrir
          </Button>
        )}
      </div>
      {editing && (
        <form onSubmit={save} className="grid grid-cols-3 gap-2">
          <SearchSelect
            value={draft.asignadoId}
            onChange={(asignadoId) => setDraft({ ...draft, asignadoId })}
            emptyOption="Sin responsable"
            placeholder="Responsable"
            aria-label="Responsable"
            className="col-span-2"
            options={people}
          />
          <Input type="date" aria-label="Plazo" value={draft.plazo} onChange={(e) => setDraft({ ...draft, plazo: e.target.value })} />
          <div className="col-span-3 flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm">
              Guardar
            </Button>
          </div>
        </form>
      )}
    </li>
  );
}
