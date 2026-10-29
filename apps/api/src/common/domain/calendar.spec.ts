import { atBusinessTime, businessDay, businessDayEnd, businessDayStart, businessToday, dayOf } from './calendar';

describe('calendar', () => {
  it('uses the Bolivian day for today', () => {
    expect(businessToday(new Date('2026-10-23T03:00:00Z'))).toBe('2026-10-22');
    expect(businessToday(new Date('2026-10-23T05:00:00Z'))).toBe('2026-10-23');
  });

  it('reads a date-only value as its stored day', () => {
    expect(dayOf('2026-10-23')).toBe('2026-10-23');
    expect(dayOf(new Date('2026-10-23T00:00:00Z'))).toBe('2026-10-23');
  });

  it('cuts the daily ledger at midnight in Bolivia', () => {
    expect(businessDayStart('2026-10-27').toISOString()).toBe('2026-10-27T04:00:00.000Z');
    expect(businessDayEnd('2026-10-27').toISOString()).toBe('2026-10-28T03:59:59.999Z');
    expect(businessDay('2026-10-28T02:30:00Z')).toBe('2026-10-27');
    expect(atBusinessTime('2026-10-20', new Date('2026-10-28T02:30:00Z')).toISOString()).toBe('2026-10-21T02:30:00.000Z');
  });
});
