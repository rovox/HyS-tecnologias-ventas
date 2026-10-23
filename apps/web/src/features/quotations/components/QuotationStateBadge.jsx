import { cn } from '@/lib/utils';
import { QUOTATION_STATE, displayState } from '../constants.js';

export function QuotationStateBadge({ quote, className }) {
  const state = QUOTATION_STATE[displayState(quote)] || QUOTATION_STATE.borrador;
  return (
    <span className={cn('inline-flex items-center rounded px-2 py-0.5 text-xs font-medium', state.className, className)}>
      {state.label}
    </span>
  );
}
