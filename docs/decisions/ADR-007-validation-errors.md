# ADR-007: Validation, text matching and errors

Date: 2026-10-30. Status: accepted (2026-10-30, collator line aligned with ADR-003). Author: architect, accepted by Ioan Bita.
Tags: javascript, browser, web-ui

## Context
R-01, R-06, R-11 and R-17 set the input rules and how a broken rule reaches the user. R-20, R-21 and R-31 do the same for storage failures, and R-05, R-09 and R-10 set the sort and search behaviour. The discipline skills ask for one error style per layer and a stable code (EO-02, EO-05). The plan needs where each check lives, the shape of a failure, and the codes.

## Decision

### Where input is checked
- All input rules live in `src/domain/validation.js`, and the domain commands call them, so a rule cannot be skipped by a screen (EO-03, LY-05, SE-02). Each check takes raw strings from the form and returns the cleaned value or the field errors.
- All text fields are trimmed before the length check and stored trimmed; empty optional fields are stored as `''`. Length is `String.length`.
- The email rule is exactly R-01 and nothing stricter: one `@`, text on both sides, a dot somewhere after the `@`.
- Quantity is trimmed text matching `^\d+$`, then the range 1 to `MAX_QUANTITY`; `2.0` and `1e3` are refused.
- A date is `^\d{4}-\d{2}-\d{2}$` and must survive a round trip through `Date.UTC`, so `2026-02-30` is refused (R-06, A-07). Today comes from the local calendar date of the injected clock, never from `toISOString()`, which gives the wrong day near midnight.
- Forms use `novalidate` and no `maxlength`, so the app's messages appear instead of the browser's and nothing is cut off silently (R-17). The date field is `type="date"`.

### Failure shapes (EO-05)
- Expected failures are results; the domain does not throw for them. Input failure: `{ ok: false, errors: [{ field, code, message }] }`, all invalid fields at once, in form order. The view shows each message next to its field and focuses the first (R-17).
- Other expected failures: `{ ok: false, reason: 'not-found' }`, and `{ ok: false, reason: 'customer-has-orders', orderCount }` for R-04.
- Storage failures are the results of ADR-004.
- A thrown error always means a bug: a total that is not a safe integer, a broken call.
- A message names the rule, in English, with its limit (`Name must be 1 to 100 characters.`). It never repeats what the user typed (R-31, EO-07). Message text lives next to its rule in the domain, as one fact (CP-06).

### Codes shown to the user
A field error's `code` (for example `customer.name.length`) is for tests and is not displayed. The errors below appear on screen with their code (EO-02), and each needs a line in `docs/RUNBOOK.md` (EO-13). The table lives in one frozen object in `src/ui/main.js`.

| Code | Reason | Message says | User can |
|---|---|---|---|
| `STO-01` | `quota` | browser storage is full, deleting data frees space (R-21) | retry with the form still open |
| `STO-02` | `unavailable` | browser storage cannot be used (R-21) | retry, or allow storage in the browser |
| `STO-03` | `corrupt` | the saved data cannot be read (R-20) | copy the text, or start empty |
| `STO-04` | `newer` | the data was saved by a newer version (R-20) | copy the text, or start empty |
| `STO-05` | `blocked` | changes are locked because the saved data could not be read | reload |
| `APP-01` | unexpected error | something went wrong and the last action may not have finished | reload |

- `APP-01` comes from `error` and `unhandledrejection` listeners in `src/ui/main.js`. It shows the fixed text only, never `error.message` or a stack, because either could hold user data (SE-11, R-31).
- There is no logging: `AGENTS.md` bans `console.log` under `src/`, and the app has no place to send a log. EO-06, EO-08 and EO-09 do not apply, and neither do the timeout and retry rules EO-10 to EO-12, because no call leaves the browser.

### Sorting and search
- Search text and the searched fields both pass through `trim()` then `toLowerCase()`, then `includes` (R-05, R-10). `toLowerCase()` takes no locale, so the same input matches the same way in every browser.
- The customer list and the picker sort with a compare function built once in `src/ui/format.js` from `Intl.Collator(locale, { sensitivity: 'accent' })` and passed to the domain list functions as a parameter (ADR-003, CRI-3), then `id` to keep equal names in a stable order (R-03). A Romanian name with `Ș` then sorts next to `S`, not after `z`.
- The order list sorts by `date` as text, newest first, then by the numeric part of `number`, highest first (R-09). The number is compared as a number because `ORD-10000` must rank above `ORD-9999`.
- Dates are displayed through `formatDate(isoDate, locale)` in `src/ui/format.js`, built with `Date.UTC` and formatted with `timeZone: 'UTC'`, so no time zone can shift the day.

### Customer export (R-29)
- `buildCustomerExport(data, customerId)` in `src/domain/export.js` returns `{ purpose, retention, currency, customer, orders }`, with `orders` as stored, lines included, and only that customer's records.
- `purpose` and `retention` are frozen texts taken from A-13 and A-14.
- The view downloads it as JSON through a `Blob` and `<a download>`, with the file name `customer-<id>.json`. No name appears in the file name (R-31).

## Consequences
- Every rule is tested under Node with plain strings, and the screens only display what the domain returned.
- A screen cannot show a rule the domain does not know about.
- One error table means a new storage failure is added in one place, and the runbook line is a known task.
- Without logs, the only diagnostic is the code the user sees.
- An agent that hits the edge of this decision writes NEEDS HUMAN and stops.

## Not decided here
- The look and placement of messages, and of the confirmations in R-04, R-08, R-20 and R-32: `docs/UI-SPEC.md`.
- Duplicate customers are allowed (A-12), so no check exists for them.
- `String.length` counts an emoji as two characters. This is accepted, because the limits are generous; a stricter count would be a change here.

## Answered
