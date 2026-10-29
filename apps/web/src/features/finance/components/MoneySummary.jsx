import { Link } from 'react-router-dom';
import { CheckCircle2, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBs } from '@/shared/lib/format.js';
import { TONE } from '@/shared/lib/status.js';
import { cn } from '@/lib/utils';
import { useFinanceSummary } from '../api.js';

const MONTH = new Intl.DateTimeFormat('es-BO', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/**
 * Real money on the dashboard (DASH-01, owner 2026-10-24): Cobrado (registered: waiting + validated) and En caja
 * (validated) of the month, expenses and net, each box balance, and today per branch: direct sales and its cash close.
 */
export function MoneySummary() {
  const { data, isLoading, isError, error } = useFinanceSummary();
  if (isError) return <p className="text-sm text-danger-fg">No se pudo cargar el dinero del mes: {error?.message}</p>;
  if (isLoading || !data) return <Skeleton className="h-40 w-full" />;
  const month = MONTH.format(new Date(`${data.mes}-01T12:00:00Z`));
  const cards = [
    ['Cobrado', data.cobrado, `por validar ${formatBs(data.porValidar)}`, undefined],
    ['En caja', data.enCaja, 'validado por Contabilidad', 'success'],
    ['Egresos', data.egresosValidados, 'validados', 'danger'],
    ['Neto', data.neto, 'en caja − egresos', data.neto < 0 ? 'danger' : 'success'],
  ];
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Dinero de {month}</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([title, value, hint, tone]) => (
          <Link key={title} to="/finanzas?vista=movimientos" className="rounded-md border border-border bg-card p-3 shadow-sm hover:shadow-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
            <p className={cn('text-xl font-bold tabular-nums', tone && TONE[tone].text)}>{formatBs(value)}</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-border bg-card p-3">
          <h3 className="mb-2 text-sm font-semibold">Hoy por sucursal</h3>
          <ul className="space-y-1.5 text-sm">
            {data.hoy.map((s) => (
              <li key={s.sucursal.id} className="flex items-center justify-between gap-2">
                <span className="font-medium">{s.sucursal.nombre}</span>
                <span className="text-muted-foreground">{s.ventas} venta{s.ventas === 1 ? '' : 's'} · {formatBs(s.total)}</span>
                {s.cierre ? (
                  <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', s.cierre.diferencia ? TONE.warning.text : TONE.success.text)}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> {s.cierre.diferencia ? `Cerrada (${formatBs(s.cierre.diferencia)})` : 'Caja cerrada'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Sin cierre</span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <h3 className="mb-2 text-sm font-semibold">Saldo de las cajas</h3>
          <ul className="space-y-1.5 text-sm">
            {data.cajas.map((c) => (
              <li key={c.id} className="flex justify-between gap-2">
                <span>{c.nombre}</span>
                <span className={cn('font-semibold tabular-nums', c.saldo < 0 && TONE.danger.text)}>{formatBs(c.saldo)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
