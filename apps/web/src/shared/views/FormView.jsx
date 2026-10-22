import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * Odoo-style record form: header (action buttons left, status bar right), a "sheet" with smart buttons, title and
 * fields, and the chatter (history) under it.
 * smartButtons: [{ key, icon: Component, label, value, to?, onClick? }] — counters/amounts that link to the source
 * of truth instead of copying its data here.
 */
export function FormView({ actions, statusBar, smartButtons = [], title, subtitle, badge, children, chatter }) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-4 sm:px-6">
      {(actions || statusBar) && (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-card px-3 py-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">{actions}</div>
          {statusBar}
        </div>
      )}

      <article className="rounded-md border border-border bg-card shadow-sm">
        {smartButtons.length > 0 && (
          <div className="flex flex-wrap justify-end border-b border-border">
            {smartButtons.map((b) => (
              <SmartButton key={b.key} {...b} />
            ))}
          </div>
        )}
        <div className="space-y-6 p-4 sm:p-6">
          <header className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
              <h1 className="text-2xl font-semibold text-foreground break-words">{title}</h1>
            </div>
            {badge}
          </header>
          {children}
        </div>
      </article>

      {chatter}
    </div>
  );
}

function SmartButton({ icon: Icon, label, value, to, onClick }) {
  const body = (
    <>
      {Icon && <Icon className="h-5 w-5 text-primary" />}
      <span className="flex flex-col text-left leading-tight">
        <span className="text-sm font-semibold text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </span>
    </>
  );
  const cls = 'flex min-h-14 min-w-[9rem] items-center gap-2 border-l border-border px-4 py-2 hover:bg-muted/60';
  if (to) return <Link to={to} className={cls}>{body}</Link>;
  return (
    <button type="button" onClick={onClick} disabled={!onClick} className={cn(cls, !onClick && 'cursor-default hover:bg-transparent')}>
      {body}
    </button>
  );
}

/** Two-column grid of read-only fields inside a FormView sheet. */
export function FieldGrid({ children, className }) {
  return <dl className={cn('grid gap-x-8 gap-y-3 sm:grid-cols-2', className)}>{children}</dl>;
}

export function Field({ label, children }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] items-baseline gap-2 border-b border-border/60 pb-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">{children ?? '—'}</dd>
    </div>
  );
}
