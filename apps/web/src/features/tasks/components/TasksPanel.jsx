import { Suspense, lazy, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useUserDirectory } from '@/features/catalogs';
import { ClientPicker } from '@/features/clients';
import { SearchSelect, useConfirm } from '@/shared/views';
import { notify } from '@/shared/lib/notify.js';
import { useCreateTask, useTasks, useUpdateTask } from '../api.js';
import { TaskRow } from './TaskRow.jsx';

// Loaded on demand: the panel lives in the header of every page.
const QuotationFormDialog = lazy(() => import('@/features/quotations').then((m) => ({ default: m.QuotationFormDialog })));

const COMMERCIAL = ['ADMINISTRADOR', 'VENTAS / ADMINISTRACIÓN'];
const EMPTY = { titulo: '', clienteId: '', asignadoId: '', plazo: '' };

/** Side panel with the tasks: quick add, mine, unassigned and (for commercial roles) the team's. */
export function TasksPanel({ open, onOpenChange }) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const commercial = COMMERCIAL.includes(currentUser?.role);
  const { data: tasks = [], isLoading } = useTasks(open);
  const { data: users = [] } = useUserDirectory();
  const create = useCreateTask();
  const update = useUpdateTask();
  const confirm = useConfirm();
  const [draft, setDraft] = useState(EMPTY);
  const [details, setDetails] = useState(false);
  const [converting, setConverting] = useState(null);

  const mine = tasks.filter((t) => t.asignado?.id === userId || (!t.asignado && t.creador?.id === userId));
  const unassigned = tasks.filter((t) => !t.asignado && t.creador?.id !== userId);
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

  const change = (task, data, message) =>
    update.mutateAsync({ id: task.id, ...data }).then(() => message && notify.success(message), () => null);

  const complete = (task) =>
    change(task, { estado: 'completada' }).then(() =>
      notify.success(`Completada: ${task.titulo}`),
    );

  async function discard(task) {
    const { ok } = await confirm({ title: '¿Descartar la tarea?', description: task.titulo, confirmLabel: 'Descartar', destructive: true });
    if (ok) change(task, { estado: 'descartada' }, 'Tarea descartada');
  }

  const section = (title, list, empty) => (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title} ({list.filter((t) => t.estado === 'pendiente').length})
      </h3>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {list.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              userId={userId}
              canQuote={commercial}
              onComplete={complete}
              onTake={(task) => change(task, { asignadoId: userId }, 'Tarea tomada')}
              onConvert={setConverting}
              onDiscard={discard}
            />
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full space-y-5 sm:max-w-md">
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
                  emptyOption="Sin asignar"
                  placeholder="Responsable"
                  options={users.map((u) => ({ value: u.id, label: u.name }))}
                />
                <Input type="date" aria-label="Fecha" value={draft.plazo} onChange={(e) => setDraft({ ...draft, plazo: e.target.value })} />
              </div>
            </div>
          )}
        </form>

        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <>
            {section('Mías', mine, 'No tienes tareas pendientes.')}
            {section('Sin asignar', unassigned, 'Nada sin asignar.')}
            {commercial && section('Del equipo', team, 'El equipo no tiene tareas pendientes.')}
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
