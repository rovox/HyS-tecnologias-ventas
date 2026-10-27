import { Skeleton } from '@/components/ui/skeleton';
import { formatRelative } from '@/shared/lib/format.js';
import { useActivityFeed } from '../api.js';

/** What the records are called, for "who did what" (entity of the audit row). */
const ENTITY = {
  quotation: 'cotización', project: 'proyecto', schedule: 'trabajo', movement: 'movimiento', client: 'cliente', task: 'tarea',
  stock: 'inventario', product: 'producto', directSale: 'venta directa', cashClose: 'cierre de caja', relevamiento: 'visita', pedido_interno: 'pedido interno',
};

/** The latest changes of the whole app (Gerencia, on the dashboard): who, what, when — the old control panel's audit. */
export function ActivityFeed() {
  const { data = [], isLoading, isError, error } = useActivityFeed(15);
  if (isError) return <p className="text-sm text-danger-fg">No se pudo cargar la actividad: {error?.message}</p>;
  if (isLoading) return <Skeleton className="h-32 w-full" />;
  return (
    <section className="rounded-md border border-border bg-card p-3">
      <h2 className="mb-2 text-sm font-semibold">Actividad reciente</h2>
      <ul className="space-y-1.5 text-sm">
        {data.map((a) => (
          <li key={a.id} className="flex justify-between gap-2">
            <span className="truncate"><span className="font-medium">{a.user?.name || 'Sistema'}</span> · {a.action.split('.').pop()} {ENTITY[a.entityType] || a.entityType}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(a.at)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
