// Field-level diff for the audit log: which fields changed and their value before and after. Pure TS.

export type FieldChange = { antes: unknown; despues: unknown };

const IGNORED = new Set(['updatedAt', 'createdAt']);

const isDecimal = (value: unknown) => value !== null && typeof value === 'object' && 'toFixed' in value;
/** Relations and JSON blobs (plain objects, arrays) are not fields of the row itself. */
const isNested = (value: unknown) =>
  value !== null && typeof value === 'object' && !(value instanceof Date) && !isDecimal(value);

/** Comparable, JSON-safe form of a stored value (Date → ISO, Decimal-like → string). */
function normalize(value: unknown): unknown {
  if (value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (isDecimal(value)) return String(value);
  return value;
}

/** Changed scalar fields between two versions of a row; empty when there is nothing to compare. */
export function fieldChanges(
  before?: Record<string, unknown> | null,
  after?: Record<string, unknown> | null,
): Record<string, FieldChange> {
  if (!before || !after) return {};
  const changes: Record<string, FieldChange> = {};
  for (const key of Object.keys(after)) {
    if (IGNORED.has(key) || !(key in before) || isNested(before[key]) || isNested(after[key])) continue;
    const antes = normalize(before[key]);
    const despues = normalize(after[key]);
    if (antes !== despues) changes[key] = { antes, despues };
  }
  return changes;
}
