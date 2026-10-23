import { businessToday, dayOf } from './calendar';

describe('calendar', () => {
  it('uses the Bolivian day for today', () => {
    expect(businessToday(new Date('2026-10-23T03:00:00Z'))).toBe('2026-10-22');
    expect(businessToday(new Date('2026-10-23T05:00:00Z'))).toBe('2026-10-23');
  });

  it('reads a date-only value as its stored day', () => {
    expect(dayOf('2026-10-23')).toBe('2026-10-23');
    expect(dayOf(new Date('2026-10-23T00:00:00Z'))).toBe('2026-10-23');
  });
});
