import { Fragment, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Columns3, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useIsPhone } from '@/shared/lib/useIsPhone.js';
import { TONE } from '@/shared/lib/status.js';
import { useColumnPrefs } from './useColumnPrefs.js';

/**
 * Odoo-style list, striped and numbered like a spreadsheet.
 * columns: [{ key, header, cell?(row), align?: 'right', className?, total?(rows), fixed?, menuLabel? }].
 * groups: optional [{ key, label, rows }] (from the control panel's "group by"); each group folds (▸/▾), shows its
 * subtotal and numbers its rows from 1. tone(row): optional narrative tone ('danger', 'warning'…) shown as a left border.
 * renderCard(row): optional card used instead of the table on phones.
 * summary(rows): optional [{ label, value, tone? }] shown above the list; by default the columns with a total.
 * id: names the list so its column choice (show, hide, order) is remembered in this browser; without it no menu.
 */
export function ListView(props) {
  const phone = useIsPhone();
  const { columns, menu } = useColumnPrefs(props.id, props.columns);
  const [collapsed, setCollapsed] = useState(() => new Set());
  const cards = phone && props.renderCard;
  const groupKeys = props.groups?.map((g) => g.key) || [];
  const folding = !cards && groupKeys.length > 1 && {
    all: groupKeys.every((k) => collapsed.has(k)),
    toggleAll: () => setCollapsed(groupKeys.every((k) => collapsed.has(k)) ? new Set() : new Set(groupKeys)),
  };
  const toggle = (key) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="space-y-2">
      <Summary {...props} columns={columns} menu={cards ? null : menu} folding={folding} />
      {cards ? <CardList {...props} columns={columns} /> : <TableList {...props} columns={columns} collapsed={collapsed} onToggleGroup={toggle} />}
    </div>
  );
}

/** Totals first, so the amounts are read before scrolling to the end; plus the column menu and fold/unfold all. */
function Summary({ columns, rows = [], loading, summary, menu, folding }) {
  const items = loading || rows.length === 0 ? [] : summary ? summary(rows) : columns.filter((c) => c.total).map((c) => ({ label: c.menuLabel || c.header, value: c.total(rows) }));
  if (items.length === 0 && !menu && !folding) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-md border border-border bg-card px-3 py-1.5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</p>
          <p className={cn('text-sm font-bold tabular-nums', item.tone && TONE[item.tone].text)}>{item.value}</p>
        </div>
      ))}
      <div className="ml-auto flex gap-1">
        {folding && (
          <Button variant="ghost" size="sm" onClick={folding.toggleAll}>
            {folding.all ? <ChevronsUpDown /> : <ChevronsDownUp />}
            {folding.all ? 'Desplegar grupos' : 'Plegar grupos'}
          </Button>
        )}
        {menu && <ColumnsMenu menu={menu} />}
      </div>
    </div>
  );
}

function ColumnsMenu({ menu }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Elegir columnas">
          <Columns3 /> Columnas
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Mostrar y ordenar columnas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {menu.items.map((item, i) => (
          <div key={item.key} className="flex items-center gap-1 px-2 py-1 text-sm">
            <label className="flex flex-1 cursor-pointer items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-primary" checked={item.visible} onChange={() => menu.toggle(item.key)} />
              <span className={cn(!item.visible && 'text-muted-foreground')}>{item.label}</span>
            </label>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} aria-label={`Subir ${item.label}`} onClick={() => menu.move(item.key, -1)}>
              <ArrowUp />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === menu.items.length - 1} aria-label={`Bajar ${item.label}`} onClick={() => menu.move(item.key, 1)}>
              <ArrowDown />
            </Button>
          </div>
        ))}
        {menu.customized && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={menu.reset}>
              <RotateCcw /> Volver a las columnas iniciales
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
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

function TableList({ columns, rows = [], groups, rowKey = (r) => r.id, onRowClick, loading, empty = 'Sin registros', tone, collapsed, onToggleGroup }) {
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
    // On wide screens the header sticks under the app header while the page scrolls (LIST-01): `clip` does not make a
    // scroll box of its own, so there is one scroll only. Narrow screens keep the sideways scroll of a wide table.
    <div className="overflow-x-auto rounded-md border border-border bg-card lg:overflow-x-clip">
      <table className="w-full min-w-[40rem] border-collapse">
        <thead className="bg-muted shadow-sm lg:sticky lg:top-16 lg:z-10">
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
            groups?.map((g) => {
              const open = !collapsed.has(g.key);
              return (
                <Fragment key={g.key}>
                  <tr className="border-b border-border bg-primary-fixed text-on-primary-fixed">
                    <td colSpan={span} className="p-0">
                      <button type="button" aria-expanded={open} onClick={() => onToggleGroup(g.key)} className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-sm font-semibold">
                        {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                        {g.label} <span className="font-normal text-muted-foreground">({g.rows.length})</span>
                      </button>
                    </td>
                  </tr>
                  {open && bodyRows(g.rows)}
                  {/* Folded groups keep their subtotal visible. */}
                  {hasTotals && totalsRow(g.rows, 'Subtotal')}
                </Fragment>
              );
            })}
        </tbody>
        {!loading && hasTotals && rows.length > 0 && <tfoot>{totalsRow(rows, 'Total', true)}</tfoot>}
      </table>
    </div>
  );
}
