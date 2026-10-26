import { cn } from '@/lib/utils';
import { TONE, statusOf } from '@/shared/lib/status.js';

/** The one way to show a state: tone colour + icon + label, from `shared/lib/status.js`. */
export function StatusBadge({ entity, state, className, iconOnly = false }) {
  const s = statusOf(entity, state);
  const Icon = s.icon;
  return (
    <span
      title={iconOnly ? s.label : undefined}
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold',
        TONE[s.tone].badge,
        s.strike && 'line-through decoration-1',
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {iconOnly ? <span className="sr-only">{s.label}</span> : s.label}
    </span>
  );
}

/** A coloured tag for something that is not a state (e.g. "Sin técnico", "Stock bajo", "Archivado"). */
export function ToneTag({ tone = 'neutral', icon: Icon, children, className }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold', TONE[tone].badge, className)}>
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      {children}
    </span>
  );
}
