# ADR-006: Money

Date: 2026-10-30. Status: accepted (2026-10-30, F-38 answered). Author: architect, accepted by Ioan Bita.
Tags: javascript, browser

## Context
R-14 and R-15 demand totals exact to the cent, and A-04 stores whole cents. R-11 fixes the accepted price text and its range, R-16 the display, A-03 one currency with no tax. The plan needs the parser's exact rule, the handling of very large totals, and the one place cents become a decimal.

## Decision
- An amount is an integer number of cents in a plain number, in the field `unitPriceCents`. Decimals exist only as text in a form and in the formatter. `parseFloat` and `toFixed` are not used on amounts (JS-05).
- The named limits in `src/domain/money.js`: `MAX_UNIT_PRICE_CENTS = 100000000`, `MAX_QUANTITY = 9999`, and `CURRENCY = 'EUR'`.
- No amount carries a currency field. A-03 fixes EUR for the whole app and the approved sketch has no such field, so this departs on purpose from the words "with its currency" in JS-05 and DA-04. R-27 would add it through a schema change (ADR-004). The export file names the currency once, because it leaves the app (ADR-007).
- `parsePriceToCents(text)` works on text only and uses no float:
  - It trims the text, then requires `^\d+([.,]\d{1,2})?$`. `\d` in JavaScript means ASCII digits only.
  - It builds the result from the whole part times 100 plus the decimals padded to two digits, then checks the range 0 to `MAX_UNIT_PRICE_CENTS`.
  - Accepted: `5`, `5.5`, `5,50`, `0`, `0.00`, `1000000.00`.
  - Refused: an empty text, `1,234.50`, `1.234,50`, `12,345`, `1 234`, `.5`, `5.`, `-1`, `1e3`, `€5`, `1000000.01`.
- `priceInputText(cents)` gives the text for the edit field (R-11): whole part, a dot, two digits, from integer division and remainder. `1999` gives `19.99`. It always parses back to the same cents.
- `lineTotalCents(quantity, unitPriceCents)` is the integer product and `orderTotalCents(order)` is the integer sum, starting at 0 for no lines (R-14, R-15).
- There is no rounding step: multiplying and adding integers cannot produce a fraction, and nothing in scope divides. A percentage arrives only with R-24, and that ADR sets its rounding rule.
- Totals are computed on each read and never stored (data model sketch).
- Both total functions check `Number.isSafeInteger` on their result and throw on failure, which marks a bug. A largest line is 999 900 000 000 cents, which is safe, but the number of lines is not limited, so `addLine` and `updateLine` check the new order total first and return a field error on `unitPrice` (`line.total.too-large`) when it would not be a safe integer. Nothing is saved (ADR-007).
- `formatMoney(cents, locale)` in `src/ui/format.js` is the only place cents are divided by 100, using `Intl.NumberFormat(locale, { style: 'currency', currency: CURRENCY })` (JS-15). The results follow R-16: `€1,234.50` for `en`, `1.234,50 €` for `ro`.
- The locale is `navigator.language`, read once in `src/ui/main.js` and passed as an argument, so the formatter is tested under Node with fixed locales. It is not a stored setting.

## Consequences
- Totals cannot drift, and the examples of R-14 are direct integer tests.
- The price field stays strict: a pasted `1,234.50` shows an error rather than a guess, as R-11 asks.
- The field must be `type="text"` with `inputmode="decimal"`. A `type="number"` field returns an empty value for a comma in some browsers and would break R-11.
- A second currency or a tax is a schema change, not a small edit.
- An agent that hits the edge of this decision writes NEEDS HUMAN and stops.

## Not decided here
- `.5` and `5.` are refused because R-11 leaves them open and "anything else shows an error". The human can loosen this by changing the rule here before the plan is written.
- Rounding for tax: R-24.
- Currency per order: R-27.

## Answered
Q: F-38. formatMoney adds currencyDisplay: narrowSymbol, which the decision text did not list.  A (2026-10-30, Ioan Bita): "Keep it. R-16 wants 1.234,50 € in Romanian and €1,234.50 in English; the narrow symbol is what gives that in every common locale. The option is part of this decision."
