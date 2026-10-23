// Calendar days as YYYY-MM-DD strings. Jobs are date-only (stored at UTC midnight), so days are compared as strings.

const pad = (n) => String(n).padStart(2, '0');
const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (day) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Today in Bolivia. */
export const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' });

/** The stored calendar day of a job. */
export const jobDay = (job) => String(job.fechaProgramada).slice(0, 10);

export function addDays(day, n) {
  const d = parse(day);
  d.setDate(d.getDate() + n);
  return key(d);
}

/** Monday of the week of `day`. */
export function weekStart(day) {
  const d = parse(day);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return key(d);
}

export const weekDays = (start) => Array.from({ length: 7 }, (_, i) => addDays(start, i));

/** Six weeks (Monday first) covering the month of `day`. */
export function monthGrid(day) {
  const d = parse(day);
  const first = key(new Date(d.getFullYear(), d.getMonth(), 1));
  const start = weekStart(first);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function addMonths(day, n) {
  const d = parse(day);
  return key(new Date(d.getFullYear(), d.getMonth() + n, 1));
}

const fmt = (opts) => new Intl.DateTimeFormat('es-BO', opts);
export const dayLabel = (day) => fmt({ weekday: 'short', day: '2-digit' }).format(parse(day));
export const monthLabel = (day) => fmt({ month: 'long', year: 'numeric' }).format(parse(day));
export const rangeLabel = (from, to) => `${fmt({ day: '2-digit', month: 'short' }).format(parse(from))} – ${fmt({ day: '2-digit', month: 'short', year: 'numeric' }).format(parse(to))}`;
export const isSameMonth = (a, b) => a.slice(0, 7) === b.slice(0, 7);
