/**
 * Days carriers do not deliver in Algeria: Fridays and public holidays. Dates are Algiers
 * calendar days (UTC+1 all year).
 */

/** Fixed-date national holidays (MM-DD). */
const FIXED_HOLIDAYS = ['01-01', '01-12', '05-01', '07-05', '11-01'];

/**
 * Religious holidays follow the lunar calendar: these are the expected dates (Eid al-Fitr and
 * Eid al-Adha two days each, Awal Muharram, Ashura, Mawlid). The ministry confirms each one a
 * day or two before; update this list when it does, and add the next year every December.
 */
const LUNAR_HOLIDAYS: Readonly<Record<number, readonly string[]>> = {
  2026: ['03-20', '03-21', '05-27', '05-28', '06-16', '06-25', '08-25'],
  2027: ['03-10', '03-11', '05-16', '05-17', '06-06', '06-15', '08-14'],
};

const DAY_MS = 86_400_000;
const ALGIERS_OFFSET_MS = 3_600_000;
const FRIDAY = 5;

/** The Algiers calendar day of an instant, as a UTC midnight Date. */
export function algiersDate(at: Date): Date {
  const local = new Date(at.getTime() + ALGIERS_OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
}

export function isDeliveryDay(day: Date): boolean {
  if (day.getUTCDay() === FRIDAY) return false;
  const monthDay = day.toISOString().slice(5, 10);
  if (FIXED_HOLIDAYS.includes(monthDay)) return false;
  return !(LUNAR_HOLIDAYS[day.getUTCFullYear()] ?? []).includes(monthDay);
}

/** Delivery days after `from`'s day up to and including `to`'s day (same day = 0). */
export function deliveryDaysBetween(from: Date, to: Date): number {
  let count = 0;
  const end = algiersDate(to).getTime();
  for (let day = algiersDate(from).getTime() + DAY_MS; day <= end; day += DAY_MS) {
    if (isDeliveryDay(new Date(day))) count += 1;
  }
  return count;
}

/** The day `days` delivery days after `from`'s day. */
export function addDeliveryDays(from: Date, days: number): Date {
  let day = algiersDate(from);
  let left = days;
  while (left > 0) {
    day = new Date(day.getTime() + DAY_MS);
    if (isDeliveryDay(day)) left -= 1;
  }
  return day;
}
