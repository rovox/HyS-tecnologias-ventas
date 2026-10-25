import { cn } from '@/lib/utils';

const TONE_BUTTON = {
  success: 'text-success-fg hover:bg-success-soft border-success-border',
  danger: 'text-danger-fg hover:bg-danger-soft border-danger-border',
  warning: 'text-warning-fg hover:bg-warning-soft border-warning-border',
  info: 'text-info-fg hover:bg-info-soft border-info-border',
  neutral: 'text-muted-foreground hover:bg-muted border-border',
};

/**
 * Frequent actions as visible icon buttons inside a row (✓ validar, ✗ observar, ✎ editar…). Each one has a tooltip
 * and an aria-label; clicks never open the row. actions: [{ key, icon, label, tone?, onClick, hidden?, disabled? }].
 * `children` goes last (usually the ⋯ menu for rare actions).
 */
export function RowQuickActions({ actions = [], children, className }) {
  return (
    <div className={cn('flex items-center justify-end gap-1', className)} onClick={(e) => e.stopPropagation()}>
      {actions
        .filter((a) => !a.hidden)
        .map(({ key, icon: Icon, label, tone = 'neutral', onClick, disabled }) => (
          <button
            key={key}
            type="button"
            title={label}
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={cn('inline-flex h-8 w-8 items-center justify-center rounded-md border bg-card disabled:opacity-40', TONE_BUTTON[tone])}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      {children}
    </div>
  );
}
