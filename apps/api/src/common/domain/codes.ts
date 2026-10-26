// Human codes shown for records that have no number of their own. Pure TS.

/** Internal order: PED- plus the first 6 letters or digits of its id (stable, easy to say and search). */
export function orderCode(id: string): string {
  return `PED-${id.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase()}`;
}
