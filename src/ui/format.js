import { CURRENCY } from '../domain/money.js';

/** The one place cents become a decimal amount (ADR-006, R-16). */
export function formatMoney(cents, locale) {
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency: CURRENCY,
    currencyDisplay: 'narrowSymbol',
  });
  const whole = Math.trunc(cents / 100);
  const fraction = String(cents - whole * 100).padStart(2, '0');
  return formatter.format(`${whole}.${fraction}`);
}

/** Shows a YYYY-MM-DD date as the calendar day it names, whatever the time zone (UI-SPEC section 4). */
export function formatDate(isoDate, locale) {
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' });
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCFullYear(year);
  return formatter.format(date);
}

/** Builds the name order of R-03 once and returns its compare function (ADR-003). */
export function createNameCompare(locale) {
  const collator = new Intl.Collator(locale, { sensitivity: 'accent' });
  return collator.compare;
}
