import { cn } from '@/lib/utils';

/** Odoo-style kanban: one column per stage. columns: [{ key, label, items, footer? }]. */
export function KanbanView({ columns, renderCard, onCardClick, cardKey = (item) => item.id, empty = 'Vacío' }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {columns.map((col) => (
        <section key={col.key} className="flex w-72 shrink-0 flex-col rounded-md bg-muted/50">
          <header className="flex items-center justify-between px-3 py-2">
            <h3 className="text-sm font-semibold">{col.label}</h3>
            <span className="text-xs text-muted-foreground">{col.items.length}</span>
          </header>
          {col.footer && <div className="px-3 pb-2 text-xs text-muted-foreground">{col.footer}</div>}
          <div className="flex flex-col gap-2 px-2 pb-2">
            {col.items.length === 0 && <p className="px-1 py-4 text-center text-xs text-muted-foreground">{empty}</p>}
            {col.items.map((item) => (
              <button
                key={cardKey(item)}
                type="button"
                onClick={onCardClick ? () => onCardClick(item) : undefined}
                className={cn(
                  'rounded-md border border-border bg-card p-3 text-left shadow-sm',
                  onCardClick && 'hover:border-primary/50 hover:shadow',
                )}
              >
                {renderCard(item)}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
