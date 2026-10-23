// Calendar days in business time. Due dates are date-only (stored at UTC midnight); "today" is the day in Bolivia
// (America/La_Paz, UTC−4 all year, no daylight saving). Pure TS.

const BUSINESS_OFFSET_MS = -4 * 60 * 60 * 1000;

/** YYYY-MM-DD of a stored date-only value. */
export const dayOf = (value: Date | string) => new Date(value).toISOString().slice(0, 10);

/** YYYY-MM-DD of `now` in Bolivia. */
export const businessToday = (now: Date) => new Date(now.getTime() + BUSINESS_OFFSET_MS).toISOString().slice(0, 10);
