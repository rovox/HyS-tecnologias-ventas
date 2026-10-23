import { formatBs, formatDate } from '@/shared/lib/format.js';
import { QuotationStateBadge } from './QuotationStateBadge.jsx';

const sum = (rows) => formatBs(rows.reduce((total, q) => total + Number(q.monto), 0));

/** Days left before a sent quotation expires (null when it does not expire). */
export const daysLeft = (q) => (q.venceEl ? Math.ceil((new Date(q.venceEl) - Date.now()) / 86_400_000) : null);

export const quotationColumns = [
  {
    key: 'numero',
    header: 'Cotización',
    cell: (q) => (
      <div className="min-w-0">
        <p className="font-medium text-foreground">{q.numero}</p>
        <p className="truncate text-xs text-muted-foreground" title={q.titulo}>{q.titulo}</p>
      </div>
    ),
  },
  { key: 'cliente', header: 'Cliente', cell: (q) => q.cliente?.nombre || '—' },
  {
    key: 'categoria',
    header: 'Categoría',
    cell: (q) => (
      <div>
        <p>{q.categoria?.label}</p>
        {q.subcategoria && <p className="text-xs text-muted-foreground">{q.subcategoria}</p>}
      </div>
    ),
  },
  { key: 'vendedor', header: 'Vendedor', cell: (q) => q.vendedor?.name || '—' },
  { key: 'fecha', header: 'Fecha', cell: (q) => formatDate(q.createdAt) },
  {
    key: 'estado',
    header: 'Estado',
    cell: (q) => {
      const left = daysLeft(q);
      return (
        <div className="flex flex-col items-start gap-1">
          <QuotationStateBadge quote={q} />
          {left !== null && <span className={left <= 3 ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>vence en {left} d</span>}
        </div>
      );
    },
  },
  { key: 'monto', header: 'Monto', align: 'right', cell: (q) => formatBs(q.monto), total: sum },
];

/** Compact quotation card (kanban and phone list). */
export function QuotationCard({ quote: q }) {
  const left = daysLeft(q);
  return (
    <div className="space-y-1 text-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{q.numero}</p>
        <QuotationStateBadge quote={q} />
      </div>
      <p className="line-clamp-2 text-muted-foreground">{q.titulo}</p>
      <p className="text-xs">{q.cliente?.nombre}</p>
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-muted-foreground">
          {q.categoria?.label}
          {left !== null && <span className={left <= 3 ? ' text-destructive' : ''}> · vence en {left} d</span>}
        </span>
        <span className="font-semibold">{formatBs(q.monto)}</span>
      </div>
    </div>
  );
}

export const quotationCsv = [
  { header: 'Número', value: (q) => q.numero },
  { header: 'Título', value: (q) => q.titulo },
  { header: 'Cliente', value: (q) => q.cliente?.nombre },
  { header: 'Categoría', value: (q) => q.categoria?.label },
  { header: 'Subcategoría', value: (q) => q.subcategoria },
  { header: 'Vendedor', value: (q) => q.vendedor?.name },
  { header: 'Estado', value: (q) => (q.eliminadaAt ? 'eliminada' : q.estado) },
  { header: 'Fecha', value: (q) => String(q.createdAt).slice(0, 10) },
  { header: 'Monto Bs', value: (q) => Number(q.monto).toFixed(2) },
];
