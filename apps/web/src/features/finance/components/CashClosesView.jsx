import { useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useSucursales } from '@/features/catalogs';
import { ListView } from '@/shared/views';
import { businessDayOf, formatBs, formatDateTime } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { TONE } from '@/shared/lib/status.js';
import { cn } from '@/lib/utils';
import { useCashCloses, useReviewClose } from '../api.js';

const select = 'h-9 rounded-md border border-input bg-background px-2 text-sm';
const daysAgo = (n) => {
  const d = new Date(`${businessDayOf()}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};
const toneOf = (c) => (Number(c.diferencia) === 0 ? 'success' : c.revisadoAt ? 'warning' : 'danger');

/**
 * Cierres (FIN-04): every daily cash close of the branches, its difference with a traffic light (green = it added
 * up, red = a difference not yet reviewed, amber = reviewed) and "Revisar" for Gerencia. The difference itself is
 * decided in the validation inbox (it is a movement por validar).
 */
export function CashClosesView() {
  const { isAdmin } = useAuth();
  const { data: sucursales = [] } = useSucursales();
  const [filters, setFilters] = useState({ sucursalId: '', desde: daysAgo(30), hasta: businessDayOf() });
  const { data: closes = [], isLoading, isError, error } = useCashCloses(filters);
  const review = useReviewClose();
  const columns = useMemo(
    () => [
      { key: 'dia', header: 'Día', cell: (c) => <span className="font-semibold">{c.dia}</span> },
      { key: 'sucursal', header: 'Sucursal', cell: (c) => c.sucursal?.nombre },
      { key: 'esperado', header: 'Debía haber', align: 'right', cell: (c) => formatBs(c.efectivoEsperado) },
      { key: 'contado', header: 'Contado', align: 'right', cell: (c) => formatBs(c.efectivoContado) },
      {
        key: 'diferencia',
        header: 'Diferencia',
        align: 'right',
        cell: (c) => <span className={cn('font-bold', TONE[toneOf(c)].text)}>{Number(c.diferencia) === 0 ? 'Cuadra' : formatBs(c.diferencia)}</span>,
        total: (rows) => formatBs(rows.reduce((s, c) => s + Number(c.diferencia), 0)),
        menuLabel: 'Diferencia',
      },
      { key: 'motivo', header: 'Motivo', cell: (c) => <span className="text-xs">{c.motivoDiferencia || '—'}{c.observaciones ? ` · ${c.observaciones}` : ''}</span> },
      { key: 'cerro', header: 'Cerró', cell: (c) => <div className="text-xs"><p>{c.cerradoPor?.name}</p><p className="text-muted-foreground">{formatDateTime(c.cerradoAt)}</p></div> },
      {
        key: 'revision',
        header: '',
        cell: (c) =>
          c.revisadoAt ? (
            <span className="inline-flex items-center gap-1 text-xs text-success-fg"><CheckCircle2 className="h-3.5 w-3.5" /> {c.revisadoPor?.name}</span>
          ) : isAdmin() ? (
            <Button size="sm" variant={Number(c.diferencia) === 0 ? 'outline' : 'default'} className="h-8" disabled={review.isPending} onClick={() => review.mutateAsync(c.id).then(() => notify.success(`Cierre del ${c.dia} revisado`), () => null)}>
              Revisar
            </Button>
          ) : null,
      },
    ],
    [review.isPending], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <select aria-label="Sucursal" className={select} value={filters.sucursalId} onChange={(e) => setFilters({ ...filters, sucursalId: e.target.value })}>
          <option value="">Todas las sucursales</option>
          {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
        <Input type="date" aria-label="Desde" className="h-9 w-40" value={filters.desde} onChange={(e) => e.target.value && setFilters({ ...filters, desde: e.target.value })} />
        <Input type="date" aria-label="Hasta" className="h-9 w-40" value={filters.hasta} onChange={(e) => e.target.value && setFilters({ ...filters, hasta: e.target.value })} />
      </div>
      {isError && <p className="text-sm text-danger-fg">No se pudieron cargar los cierres: {error?.message}</p>}
      <ListView
        id="cierres"
        columns={columns}
        rows={closes}
        loading={isLoading}
        tone={(c) => (toneOf(c) === 'success' ? undefined : toneOf(c))}
        summary={(rows) => [
          { label: `Cierres (${rows.length})`, value: `${rows.filter((c) => Number(c.diferencia) === 0).length} cuadran` },
          { label: 'Sin revisar', value: String(rows.filter((c) => !c.revisadoAt).length), tone: rows.some((c) => !c.revisadoAt && Number(c.diferencia) !== 0) ? 'danger' : undefined },
          { label: 'Faltantes', value: formatBs(rows.filter((c) => Number(c.diferencia) < 0).reduce((s, c) => s + Number(c.diferencia), 0)), tone: 'danger' },
          { label: 'Sobrantes', value: formatBs(rows.filter((c) => Number(c.diferencia) > 0).reduce((s, c) => s + Number(c.diferencia), 0)) },
        ]}
        empty="No hay cierres en estas fechas"
      />
    </div>
  );
}
