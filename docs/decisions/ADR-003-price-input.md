# ADR-003: Price input with a comma

Date: 2026-10-28. Status: accepted. Author: Ioan Bita.

## Context
The plan (D1) asks what happens when someone types a price with a comma, like "12,50". Reading the comma as a decimal point would make "1,000" mean one euro, so one of the two commas has to be refused either way.

## Decision
- A price is typed with a dot as the decimal separator and at most two decimals: `12.50`.
- A comma anywhere in the price is refused with the message "Use a dot for decimals, e.g. 12.50".
- Nothing is saved when the price is refused.

## Consequences
- One parsing rule, the same on every screen; no locale handling.
- People used to the comma get a clear message instead of a silently wrong amount.
- An agent that wants to accept a comma, a thousands separator or a currency sign writes `NEEDS HUMAN` and stops.

## Not decided here
- Quantity input (whole numbers only, R-12).
- Display format of amounts (R-16: `€1,234.50`).

## Answered
Q: When someone types a price with a comma, like "12,50", what should happen?  A (2026-10-28, Ioan Bita): "Refuse it with the message Use a dot for decimals, e.g. 12.50. One rule for prices, no locale guessing."
