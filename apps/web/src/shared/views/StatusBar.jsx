import { cn } from '@/lib/utils';
import { TONE, statusOf } from '@/shared/lib/status.js';

const ARROW = '[clip-path:polygon(0_0,calc(100%-10px)_0,100%_50%,calc(100%-10px)_100%,0_100%,10px_50%)]';

/**
 * Odoo-style status bar in a form header. stages: [{ key, label }]; only `allowed` keys (the transitions the API
 * returns) are clickable; `onSelect(key)` asks for confirmation in the caller. `entity` paints the current stage
 * with its state's tone (shared/lib/status.js).
 */
export function StatusBar({ stages, current, allowed = [], onSelect, entity }) {
  const activeClass = entity ? TONE[statusOf(entity, current).tone].solid : 'bg-primary text-primary-foreground';
  return (
    <ol className="flex flex-wrap items-stretch" aria-label="Estado">
      {stages.map((stage, i) => {
        const active = stage.key === current;
        const clickable = allowed.includes(stage.key) && onSelect;
        return (
          <li key={stage.key} className={cn(i > 0 && '-ml-2')}>
            <button
              type="button"
              disabled={!clickable}
              aria-current={active ? 'step' : undefined}
              onClick={clickable ? () => onSelect(stage.key) : undefined}
              className={cn(
                'h-8 px-5 text-xs font-medium',
                ARROW,
                active ? cn(activeClass, 'font-semibold') : 'bg-muted text-muted-foreground',
                clickable && 'bg-primary/10 text-primary hover:bg-primary/20',
                !clickable && !active && 'cursor-default',
              )}
            >
              {stage.label}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
