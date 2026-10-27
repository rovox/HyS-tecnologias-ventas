// Calendar days in business time. Due dates are date-only (stored at UTC midnight); "today" is the day in Bolivia
// (America/La_Paz, UTC−4 all year, no daylight saving). Pure TS.

const BUSINESS_OFFSET_MS = -4 * 60 * 60 * 1000;

/** YYYY-MM-DD of a stored date-only value. */
export const dayOf = (value: Date | string) => new Date(value).toISOString().slice(0, 10);

/** YYYY-MM-DD of `now` in Bolivia. */
export const businessToday = (now: Date) => new Date(now.getTime() + BUSINESS_OFFSET_MS).toISOString().slice(0, 10);

/** YYYY-MM-DD of an instant (a movement, a sale) in Bolivia: the day of the daily ledger and the cash close. */
export const businessDay = (value: Date | string) => businessToday(new Date(value));

/** First and last instant of a Bolivian day. */
export const businessDayStart = (day: string) => new Date(new Date(`${day}T00:00:00.000Z`).getTime() - BUSINESS_OFFSET_MS);
export const businessDayEnd = (day: string) => new Date(businessDayStart(day).getTime() + 24 * 60 * 60 * 1000 - 1);

/** That Bolivian day at the time of day it is now in Bolivia (a day picked in a form, registered "now"). */
export const atBusinessTime = (day: string, now: Date) =>
  new Date(businessDayStart(day).getTime() + ((now.getTime() + BUSINESS_OFFSET_MS) % (24 * 60 * 60 * 1000) + 24 * 60 * 60 * 1000) % (24 * 60 * 60 * 1000));
