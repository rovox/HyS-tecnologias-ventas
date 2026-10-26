import { Fragment } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useIsPhone } from '@/shared/lib/useIsPhone.js';
import { TONE } from '@/shared/lib/status.js';

/**
 * Odoo-style list, striped and numbered like a spreadsheet.
 * columns: [{ key, header, cell?(row), align?: 'right', className?, total?(rows) }].
 * groups: optional [{ key, label, rows }] (from the control panel's "group by"); each group shows its subtotal and
 * numbers its rows from 1. tone(row): optional narrative tone ('danger', 'warning'…) shown as a left border.
 * renderCard(row): optional card used instead of the table on phones.
 */
export function ListView(props) {
  const phone = useIsPhone();
  return phone && props.renderCard ? <CardList {...props} /> : <TableList {...props} />;
}

function CardList({ columns, rows = [], rowKey = (r) => r.id, onRowClick, loading, empty = 'Sin registros', renderCard, tone }) {
  const totalColumn = columns.find((c) => c.total);
  return (
    <div className="space-y-2">
      {loading && <Skeleton className="h-20 w-full" />}
      {!loading && rows.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">{empty}</p>}
      {!loading &&
        rows.map((row) =>
          onRowClick ? (
            // A div, not a button: cards may hold their own action buttons.
            <div
              key={rowKey(row)}
              role="button"
              tabIndex={0}
              onClick={() => onRowClick(row)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget && (e.preventDefault(), onRowClick(row))}
              className={cn('w-full cursor-pointer rounded-md border border-border bg-card p-3 text-left shadow-sm', tone?.(row) && cn('border-l-4', TONE[tone(row)].border))}
            >
              {renderCard(row)}
            </div>
          ) : (
            <div key={rowKey(row)} className={cn('rounded-md border border-border bg-card p-3 shadow-sm', tone?.(row) && cn('border-l-4', TONE[tone(row)].border))}>
              {renderCard(row)}
            </div>
          ),
        )}
      {!loading && totalColumn && rows.length > 0 && (
        <div className="flex justify-between rounded-md bg-muted/60 px-3 py-2 text-sm font-semibold">
          <span>Total</span>
          <span>{totalColumn.total(rows)}</span>
        </div>
      )}
    </div>
  );
}

function TableList({ columns, rows = [], groups, rowKey = (r) => r.id, onRowClick, loading, empty = 'Sin registros', tone }) {
  const hasTotals = columns.some((c) => c.total);
  const span = columns.length + 1;
  const align = (c) => (c.align === 'right' ? 'whitespace-nowrap text-right tabular-nums' : 'text-left');

  const totalsRow = (list, label, strong) => (
    <tr className={cn('border-t border-border bg-muted/70', strong && 'font-bold')}>
      <td className="px-2 py-2" />
      {columns.map((c, i) => (
        <td key={c.key} className={cn('px-3 py-2 text-sm', align(c))}>
          {c.total ? c.total(list) : i === 0 ? label : null}
        </td>
      ))}
    </tr>
  );

  const bodyRows = (list) =>
    list.map((row, i) => {
      const rowTone = tone?.(row);
      return (
        <tr
          key={rowKey(row)}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
          className={cn(
            'border-b border-border/70 last:border-0',
            i % 2 === 1 && 'bg-row-stripe',
            onRowClick && 'cursor-pointer hover:!bg-row-hover',
          )}
        >
          <td
            className={cn(
              'w-10 select-none border-r border-border/70 px-2 py-2 text-right text-xs tabular-nums text-muted-foreground',
              rowTone && cn('border-l-4', TONE[rowTone].border),
            )}
          >
            {i + 1}
          </td>
          {columns.map((c) => (
            <td key={c.key} className={cn('px-3 py-2 text-sm align-middle', align(c), c.className)}>
              {c.cell ? c.cell(row) : row[c.key]}
            </td>
          ))}
        </tr>
      );
    });

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <table className="w-full min-w-[40rem] border-collapse">
        <thead className="bg-muted/60">
          <tr>
            <th scope="col" className="w-10 border-r border-border/70 px-2 py-2 text-right text-xs font-semibold text-muted-foreground">
              #
            </th>
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
                <td colSpan={span} className="px-3 py-2">
                  <Skeleton className="h-6 w-full" />
                </td>
              </tr>
            ))}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={span} className="px-3 py-10 text-center text-sm text-muted-foreground">
                {empty}
              </td>
            </tr>
          )}
          {!loading && !groups && bodyRows(rows)}
          {!loading &&
            groups?.map((g) => (
              <Fragment key={g.key}>
                <tr className="border-b border-border bg-primary-fixed text-on-primary-fixed">
                  <td colSpan={span} className="px-3 py-2 text-sm font-semibold">
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
