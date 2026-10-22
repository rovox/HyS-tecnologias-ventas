import { History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime, formatRelative } from '@/shared/lib/format.js';
import { useRecordHistory } from '../api.js';

const VERBS = {
  create: 'creó el registro',
  created: 'creó el registro',
  update: 'editó',
  status: 'cambió el estado',
  accept: 'aprobó',
  approve: 'aprobó',
  reject: 'rechazó',
  file: 'adjuntó un archivo',
  payment: 'registró un movimiento',
  delete: 'eliminó',
  restore: 'restauró',
  convert: 'convirtió',
  complete: 'completó',
  claim: 'tomó',
};

const verbOf = (action) => {
  const last = action.split('.').pop().split('-').pop();
  return VERBS[last] || action;
};

const show = (value) => (value === null || value === undefined || value === '' ? '—' : String(value));

/**
 * Odoo-style chatter: who changed what and when, newest first, live (realtime invalidates the history query).
 * fieldLabels maps API field names to labels; fields without a label are shown by name.
 */
export function Chatter({ entity, id, fieldLabels = {} }) {
  const { data = [], isLoading } = useRecordHistory(entity, id);

  return (
    <section className="rounded-md border border-border bg-card p-4 sm:p-6" aria-label="Historial">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        <History className="h-4 w-4" /> Historial
      </h2>
      {isLoading && <Skeleton className="h-16 w-full" />}
      {!isLoading && data.length === 0 && <p className="text-sm text-muted-foreground">Sin cambios registrados.</p>}
      <ol className="space-y-4">
        {data.map((row) => (
          <li key={row.id} className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {(row.user?.name || '?').slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 text-sm">
              <p>
                <span className="font-medium">{row.user?.name || 'Sistema'}</span>{' '}
                <span className="text-muted-foreground">{verbOf(row.action)}</span>{' '}
                <time className="text-xs text-muted-foreground" title={formatDateTime(row.at)}>
                  · {formatRelative(row.at)}
                </time>
              </p>
              {row.detalle && (
                <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  {Object.entries(row.detalle).map(([field, change]) => (
                    <li key={field}>
                      {fieldLabels[field] || field}: <span className="line-through">{show(change.antes)}</span> →{' '}
                      <span className="text-foreground">{show(change.despues)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
