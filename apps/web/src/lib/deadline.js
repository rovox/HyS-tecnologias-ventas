/** Tono de plazo para cotizaciones, tareas y cronograma. */

export function parseDeadline(value) {
  if (!value) return null;
  const raw = String(value).replace(' ', 'T');
  const iso = raw.length <= 10 ? `${raw.slice(0, 10)}T23:59:59` : raw;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function deadlineTone(value, now = Date.now()) {
  const date = parseDeadline(value);
  if (!date) return 'none';
  if (date.getTime() < now) return 'overdue';
  if (date.getTime() - now <= 48 * 60 * 60 * 1000) return 'soon';
  return 'ok';
}

export function deadlineLabel(tone) {
  if (tone === 'overdue') return 'Vencido';
  if (tone === 'soon') return 'Vence en 48 h';
  return '';
}

export function deadlineChipClass(tone) {
  if (tone === 'overdue') return 'bg-destructive/10 text-destructive border-destructive/30';
  if (tone === 'soon') return 'bg-amber-100 text-amber-800 border-amber-200';
  return '';
}
