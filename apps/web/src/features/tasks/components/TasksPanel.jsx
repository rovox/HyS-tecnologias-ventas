import { Suspense, lazy, useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useUserDirectory } from '@/features/catalogs';
import { ClientPicker } from '@/features/clients';
import { SearchSelect, useConfirm } from '@/shared/views';
import { notify } from '@/shared/lib/notify.js';
import { useClaimTask, useCreateTask, useTaskSummary, useTasks, useUpdateTask } from '../api.js';
import { TaskCountersLegend } from './TaskCounters.jsx';
import { TaskRow } from './TaskRow.jsx';
import { COMMERCIAL_ROLES } from '@/constants/roles.js';
import { cn } from '@/lib/utils';

// Loaded on demand: the panel lives in the header of every page.
const QuotationFormDialog = lazy(() => import('@/features/quotations').then((m) => ({ default: m.QuotationFormDialog })));

const EMPTY = { titulo: '', clienteId: '', asignadoId: '', plazo: '' };

/**
 * Side panel with the tasks (transient information, TSK-03): quick add; Mías, Sin responsable and (commercial roles)
 * Del equipo as lists that fold; completed or discarded tasks leave the list and stay 30 days under "Archivadas".
 */
export function TasksPanel({ open, onOpenChange }) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const commercial = COMMERCIAL_ROLES.includes(currentUser?.role);
  const [archived, setArchived] = useState(false);
  const { data: tasks = [], isLoading } = useTasks(open && !archived);
  const { data: closed = [], isLoading: loadingClosed } = useTasks(open && archived, { archivadas: true });
  const { data: summary } = useTaskSummary();
  const { data: users = [] } = useUserDirectory();
  const people = users.map((u) => ({ value: u.id, label: u.name }));
  const create = useCreateTask();
  const update = useUpdateTask();
  const claim = useClaimTask();
  const confirm = useConfirm();
  const [draft, setDraft] = useState(EMPTY);
  const [details, setDetails] = useState(false);
  const [converting, setConverting] = useState(null);
  const [folded, setFolded] = useState(() => new Set());

  // Same split as the counters (tasks.rules.ts pendingSummary): mine = I am in charge; red = nobody is.
  const mine = tasks.filter((t) => t.asignado?.id === userId);
  const unassigned = tasks.filter((t) => !t.asignado);
  const team = commercial ? tasks.filter((t) => t.asignado && t.asignado.id !== userId) : [];

  async function add(e) {
    e.preventDefault();
    if (!draft.titulo.trim()) return;
    try {
      await create.mutateAsync({
        titulo: draft.titulo.trim(),
        clienteId: draft.clienteId || undefined,
        asignadoId: draft.asignadoId || undefined,
        plazo: draft.plazo || undefined,
      });
      setDraft(EMPTY);
      notify.success('Tarea creada');
    } catch {
      /* shown by the query client */
    }
  }

  /** Resolves true when saved; the error is shown by the query client. */
  const change = (task, data, message) =>
    update.mutateAsync({ id: task.id, ...data }).then(
      () => {
        if (message) notify.success(message);
        return true;
      },
      () => false,
    );

  const take = (task) => claim.mutateAsync(task.id).then(() => notify.success('Tarea tomada: ahora es tuya'), () => null);

  async function discard(task) {
    const { ok } = await confirm({ title: '¿Descartar la tarea?', description: task.titulo, confirmLabel: 'Descartar', destructive: true });
    if (ok) change(task, { estado: 'descartada' }, 'Tarea descartada: pasa a Archivadas');
  }

  const row = (t) => (
    <TaskRow
      key={t.id}
      task={t}
      userId={userId}
      people={people}
      canTake={commercial}
      canQuote={commercial}
      onComplete={(task) => change(task, { estado: 'completada' }, `Completada: ${task.titulo}`)}
      onTake={take}
      onSave={(task, data) => change(task, data, 'Tarea actualizada')}
      onConvert={setConverting}
      onDiscard={discard}
      onReopen={(task) => change(task, { estado: 'pendiente' }, 'Tarea reabierta')}
    />
  );

  const section = (key, title, list, empty, tone) => {
    const isOpen = !folded.has(key);
    const toggle = () =>
      setFolded((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    return (
      <section className="space-y-2">
        <button type="button" aria-expanded={isOpen} onClick={toggle} className="flex w-full items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {title}
          <span className={cn('rounded-full px-1.5 py-0.5 text-xs font-bold normal-case', list.length ? tone : 'bg-success-soft text-success-fg')}>{list.length}</span>
        </button>
        {isOpen && (list.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : <ul className="space-y-2">{list.map(row)}</ul>)}
      </section>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full space-y-4 overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Tareas</SheetTitle>
          <SheetDescription>Pendientes cortas: una llamada, enviar un PDF, una visita. Se convierten en cotización.</SheetDescription>
        </SheetHeader>

        <form onSubmit={add} className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Nueva tarea y Enter…"
              value={draft.titulo}
              onChange={(e) => setDraft({ ...draft, titulo: e.target.value })}
              aria-label="Nueva tarea"
            />
            <Button type="submit" size="icon" disabled={create.isPending || !draft.titulo.trim()} aria-label="Agregar tarea">
              <Plus />
            </Button>
          </div>
          <button type="button" className="text-xs text-primary hover:underline" onClick={() => setDetails((v) => !v)}>
            {details ? 'Menos detalles' : 'Cliente, responsable y fecha'}
          </button>
          {details && (
            <div className="grid gap-2">
              <ClientPicker value={draft.clienteId} onChange={(clienteId) => setDraft({ ...draft, clienteId })} />
              <div className="grid grid-cols-2 gap-2">
                <SearchSelect
                  value={draft.asignadoId}
                  onChange={(asignadoId) => setDraft({ ...draft, asignadoId })}
                  emptyOption="Sin responsable"
                  placeholder="Responsable"
                  aria-label="Responsable de la nueva tarea"
                  options={people}
                />
                <Input type="date" aria-label="Fecha" value={draft.plazo} onChange={(e) => setDraft({ ...draft, plazo: e.target.value })} />
              </div>
            </div>
          )}
        </form>

        <TaskCountersLegend summary={summary} />
        <div className="flex gap-1 border-b border-border">
          {[
            [false, 'Pendientes'],
            [true, 'Archivadas (30 días)'],
          ].map(([value, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => setArchived(value)}
              className={cn('-mb-px border-b-2 px-3 py-1.5 text-sm font-medium', archived === value ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}
            >
              {label}
            </button>
          ))}
        </div>

        {archived ? (
          loadingClosed ? (
            <Skeleton className="h-24 w-full" />
          ) : closed.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nada archivado en los últimos 30 días.</p>
          ) : (
            <ul className="space-y-2">{closed.map(row)}</ul>
          )
        ) : isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <>
            {section('mias', 'Mías', mine, 'No tienes tareas pendientes.', 'bg-warning text-warning-foreground')}
            {section('sin', 'Sin responsable', unassigned, 'Todas tienen responsable.', 'bg-danger text-danger-foreground')}
            {commercial && section('equipo', 'Del equipo', team, 'El equipo no tiene tareas pendientes.', 'bg-neutral-soft text-neutral-fg')}
          </>
        )}
      </SheetContent>
      {converting && (
        <Suspense fallback={null}>
          <QuotationFormDialog
            open
            onOpenChange={(o) => !o && setConverting(null)}
            prefill={{ titulo: converting.titulo, clienteId: converting.cliente?.id, observacion: converting.descripcion || '', tareaId: converting.id }}
            onSaved={() => {
              setConverting(null);
              notify.success('Tarea convertida en cotización');
            }}
          />
        </Suspense>
      )}
    </Sheet>
  );
}
