import { HandCoins } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ListView, Money } from '@/shared/views';
import { formatDay } from '@/shared/lib/format.js';
import { useCustody } from '../api.js';
import { CONCEPTO_LABEL } from '../constants.js';
import { MovementActions } from './MovementActions.jsx';

const origin = (m) => (m.project ? `${m.project.codigo} — ${m.project.titulo}` : m.schedule?.descripcionTrabajo || (m.relevamiento ? `Visita del ${formatDay(m.relevamiento.fecha)}` : null) || m.nota || '—');

/**
 * Por rendir: money collected and not yet validated, per person who holds it (a técnico who collected on site, a
 * seller…). Validating it (✓) means it was handed in at a box.
 */
export function CustodyView({ actions, onOpen }) {
  const { data = [], isLoading } = useCustody();
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!data.length) return <p className="py-10 text-center text-sm text-muted-foreground">Nadie tiene dinero sin rendir.</p>;

  const columns = [
    { key: 'fecha', header: 'Fecha', cell: (m) => formatDay(m.fecha) },
    { key: 'concepto', header: 'Concepto', cell: (m) => CONCEPTO_LABEL[m.concepto] || m.concepto },
    { key: 'origen', header: 'Proyecto o trabajo', cell: (m) => <span className="line-clamp-2">{origin(m)}</span> },
    { key: 'cliente', header: 'Cliente', cell: (m) => m.cliente?.nombre || '—' },
    { key: 'monto', header: 'Monto', align: 'right', cell: (m) => <Money value={m.monto} kind="in" /> },
    { key: 'acciones', header: '', cell: (m) => <MovementActions movement={m} actions={actions} quick /> },
  ];

  return (
    <div className="space-y-4">
      <p className="rounded-md border border-warning-border bg-warning-soft px-3 py-2 text-sm text-warning-fg">
        Total sin rendir: <Money value={data.reduce((s, p) => s + p.total, 0)} className="font-bold" /> en manos de {data.length}{' '}
        {data.length === 1 ? 'persona' : 'personas'}. Al validar (✓) queda registrado que lo entregó en caja.
      </p>
      {data.map((p) => (
        <section key={p.userId} className="space-y-2" aria-label={`Por rendir de ${p.persona?.name}`}>
          <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <HandCoins className="h-4 w-4 text-warning-fg" aria-hidden />
            {p.persona?.name}
            <span className="rounded-md border border-warning-border bg-warning-soft px-2 py-0.5 text-xs text-warning-fg">
              {p.cantidad} {p.cantidad === 1 ? 'cobro' : 'cobros'}: <Money value={p.total} className="font-bold" />
            </span>
          </h3>
          <ListView columns={columns} rows={p.movimientos} onRowClick={(m) => onOpen(m.id)} />
        </section>
      ))}
    </div>
  );
}
