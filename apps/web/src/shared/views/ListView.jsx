import { Fragment } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useIsPhone } from '@/shared/lib/useIsPhone.js';

/**
 * Odoo-style list. columns: [{ key, header, cell?(row), align?: 'right', className?, total?(rows) }].
 * groups: optional [{ key, label, rows }] (from the control panel's "group by"); each group shows its subtotal.
 * renderCard(row): optional card used instead of the table on phones.
 */
export function ListView(props) {
  const phone = useIsPhone();
  return phone && props.renderCard ? <CardList {...props} /> : <TableList {...props} />;
}

function CardList({ columns, rows = [], rowKey = (r) => r.id, onRowClick, loading, empty = 'Sin registros', renderCard }) {
  const totalColumn = columns.find((c) => c.total);
  return (
    <div className="space-y-2">
      {loading && <Skeleton className="h-20 w-full" />}
      {!loading && rows.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">{empty}</p>}
      {!loading &&
        rows.map((row) => (
          <button
            key={rowKey(row)}
            type="button"
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className="w-full rounded-md border border-border bg-card p-3 text-left shadow-sm"
          >
            {renderCard(row)}
          </button>
        ))}
      {!loading && totalColumn && rows.length > 0 && (
        <div className="flex justify-between rounded-md bg-muted/60 px-3 py-2 text-sm font-semibold">
          <span>Total</span>
          <span>{totalColumn.total(rows)}</span>
        </div>
      )}
    </div>
  );
}

function TableList({ columns, rows = [], groups, rowKey = (r) => r.id, onRowClick, loading, empty = 'Sin registros' }) {
  const hasTotals = columns.some((c) => c.total);
  const align = (c) => (c.align === 'right' ? 'text-right' : 'text-left');

  const totalsRow = (list, label, strong) => (
    <tr className={cn('bg-muted/60', strong && 'font-semibold')}>
      {columns.map((c, i) => (
        <td key={c.key} className={cn('px-3 py-2 text-sm', align(c))}>
          {c.total ? c.total(list) : i === 0 ? label : null}
        </td>
      ))}
    </tr>
  );

  const bodyRows = (list) =>
    list.map((row) => (
      <tr
        key={rowKey(row)}
        onClick={onRowClick ? () => onRowClick(row) : undefined}
        className={cn('border-b border-border last:border-0', onRowClick && 'cursor-pointer hover:bg-muted/50')}
      >
        {columns.map((c) => (
          <td key={c.key} className={cn('px-3 py-2 text-sm align-middle', align(c), c.className)}>
            {c.cell ? c.cell(row) : row[c.key]}
          </td>
        ))}
      </tr>
    ));

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <table className="w-full min-w-[40rem] border-collapse">
        <thead className="bg-muted/60">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={cn('px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground', align(c))}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading &&
            [0, 1, 2].map((i) => (
              <tr key={i}>
                <td colSpan={columns.length} className="px-3 py-2">
                  <Skeleton className="h-6 w-full" />
                </td>
              </tr>
            ))}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10 text-center text-sm text-muted-foreground">
                {empty}
              </td>
            </tr>
          )}
          {!loading && !groups && bodyRows(rows)}
          {!loading &&
            groups?.map((g) => (
              <Fragment key={g.key}>
                <tr className="border-b border-border bg-secondary/60">
                  <td colSpan={columns.length} className="px-3 py-2 text-sm font-semibold">
                    {g.label} <span className="font-normal text-muted-foreground">({g.rows.length})</span>
                  </td>
                </tr>
                {bodyRows(g.rows)}
                {hasTotals && totalsRow(g.rows, 'Subtotal')}
              </Fragment>
            ))}
        </tbody>
        {!loading && hasTotals && rows.length > 0 && <tfoot>{totalsRow(rows, 'Total', true)}</tfoot>}
      </table>
    </div>
  );
}
