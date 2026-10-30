import { CURRENCY } from '../domain/money.js';

/** The one place cents become a decimal amount (ADR-006, R-16). */
export function formatMoney(cents, locale) {
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency: CURRENCY,
    currencyDisplay: 'narrowSymbol',
  });
  return formatter.format(cents / 100);
}

/** Shows a YYYY-MM-DD date as the calendar day it names, whatever the time zone (UI-SPEC section 4). */
export function formatDate(isoDate, locale) {
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' });
  return formatter.format(new Date(`${isoDate}T00:00:00Z`));
}

/** Builds the name order of R-03 once and returns its compare function (ADR-003). */
export function createNameCompare(locale) {
  const collator = new Intl.Collator(locale, { sensitivity: 'accent' });
  return collator.compare;
}
