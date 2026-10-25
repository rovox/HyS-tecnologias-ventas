import { cn } from '@/lib/utils';
import { formatBs } from '@/shared/lib/format.js';

/**
 * An amount in Bs with its meaning: `kind` 'in' (+, green), 'out' (−, red), 'owed' (red when > 0), 'plain'.
 * Zero is muted. Always tabular and on one line.
 */
export function Money({ value, kind = 'plain', className }) {
  const n = Number(value) || 0;
  const tone =
    n === 0 ? 'text-muted-foreground' : kind === 'in' ? 'text-success-fg' : kind === 'out' || kind === 'owed' ? 'text-danger-fg' : '';
  const sign = n === 0 ? '' : kind === 'in' ? '+' : kind === 'out' ? '−' : '';
  return (
    <span className={cn('whitespace-nowrap tabular-nums', n !== 0 && kind !== 'plain' && 'font-semibold', tone, className)}>
      {sign}
      {formatBs(Math.abs(n))}
    </span>
  );
}
