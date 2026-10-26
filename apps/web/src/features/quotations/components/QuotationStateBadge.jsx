import { StatusBadge } from '@/shared/views';
import { displayState } from '../constants.js';

export function QuotationStateBadge({ quote, className }) {
  return <StatusBadge entity="quotation" state={displayState(quote)} className={className} />;
}
