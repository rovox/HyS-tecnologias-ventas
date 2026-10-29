// The only place dates and money are formatted for the UI. Currency is Bs.

/** Every amount: dot decimal, 2 decimals, comma thousands — Bs 1,234.50 (owner 2026-10-28). */
const money = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const day = new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
/** Date-only values (due dates, scheduled days) are stored at UTC midnight: read them in UTC, not local time. */
const dateOnly = new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const dayTime = new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
/** Instants of money (movements, sales) belong to a day in Bolivia: the day of the daily ledger and the cash close. */
const BUSINESS_TZ = 'America/La_Paz';
const businessDayFmt = new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: BUSINESS_TZ });

const toDate = (value) => (value ? new Date(value) : null);
const valid = (date) => date && !Number.isNaN(date.getTime());

export const formatBs = (amount) => `Bs ${money.format(Number(amount) || 0)}`;

/** Rounded to cents, the same way the API rounds totals. */
export const roundCents = (value) => Math.round(value * 100) / 100;

export function formatDate(value) {
  const date = toDate(value);
  return valid(date) ? day.format(date) : '—';
}

/** A date-only field (plazo, fecha programada): the stored calendar day, whatever the browser time zone. */
export function formatDay(value) {
  const date = toDate(value);
  return valid(date) ? dateOnly.format(date) : '—';
}

/** The Bolivian day of an instant (a movement): "27 oct 2026", whatever the browser time zone. */
export function formatBusinessDay(value) {
  const date = toDate(value);
  return valid(date) ? businessDayFmt.format(date) : '—';
}

/** YYYY-MM-DD of an instant in Bolivia (forms, filters, exports); today when no value. */
export function businessDayOf(value = new Date()) {
  const date = toDate(value);
  return valid(date) ? date.toLocaleDateString('en-CA', { timeZone: BUSINESS_TZ }) : '';
}

export function formatDateTime(value) {
  const date = toDate(value);
  return valid(date) ? dayTime.format(date) : '—';
}

const relative = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
const STEPS = [
  [60, 'second'],
  [60, 'minute'],
  [24, 'hour'],
  [30, 'day'],
  [12, 'month'],
  [Infinity, 'year'],
];

/** "hace 5 minutos", "ayer" (Intl, no date library in the entry bundle: GATE-01). */
export function formatRelative(value) {
  const date = toDate(value);
  if (!valid(date)) return '—';
  let amount = (date.getTime() - Date.now()) / 1000;
  for (const [size, unit] of STEPS) {
    if (Math.abs(amount) < size) return relative.format(Math.round(amount), unit);
    amount /= size;
  }
  return '—';
}
