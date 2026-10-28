# PR: customers, orders and order lines

## What
A local browser app, written in plain JavaScript ES modules with no build step and no dependencies. It manages customers, their orders and the order lines, and computes line and order totals in EUR. Data is kept in localStorage. Unreadable stored data is never overwritten, and a failed save is shown to the user. All user text is rendered as text. The work was built in seven slices, test-first in the domain and storage layers. Two review cycles followed. The fixes went back into their slices.

Commits (`6ac3155`..HEAD):
```
13c121e Review cycle 2: MERGE
84ea41f Manual checks: F-07, F-10
f558ef5 S7: fix F-07, F-10 (R-10, R-18)
abf900c S6: fix F-07 (R-18)
c21a7a6 S5: fix F-04 (R-17, R-18, R-19)
c4dd9a7 S4: fix F-06 (R-13)
149dd6d S3: fix F-02, F-03, F-05, F-11 (R-08, R-09, R-10)
5a31758 S2: fix F-01 (R-05)
009d69d Review cycle 1: decisions
b1ccec1 Review cycle 1: FIX FIRST
b00627a Manual checks
7407a16 S7: order and line screens (R-07..R-16, R-20, R-21)
4b26c47 S6: app shell and customer screens (R-01..R-06, R-17..R-21)
f772e9f S5: store (R-17, R-18, R-19)
ccf353c S4: order line rules (R-11, R-12, R-13, R-14)
fb834c6 S3: order rules (R-04, R-07, R-08, R-09, R-10)
a66c5e1 S2: customer rules (R-01, R-02, R-03, R-05, R-06)
bec33ca S1: money and totals (R-12, R-15, R-16)
4ed825a Plan: apply ADR-003 and ADR-004
2329b9f Decisions D1-D2
46d3e0c Requirements approved
6ac3155 Kit hooks and CI gate
```

## Why
The brief asks for a simple local JavaScript app that manages customers, orders and order lines, stores them in localStorage, and handles totals, search and filters, validation, and empty and error states.
It should be planned, built and reviewed with AI, with a human keeping engineering ownership. Requirements: [docs/REQUIREMENTS.md](REQUIREMENTS.md).

## How it was verified
Gate (`gate.mjs --review`):
```
gate     tests  61 passed, 0 failed
gate     scope  no slice active: 0 files changed, all in docs/
gate     trace  21 MUST, 0 missing, 0 orphan IDs
gate     commit no message to check
gate     review 84ea41f ok, verdict MERGE
GATE PASS
```
- `node --test`: 61 tests, 61 pass, 0 fail, 0 skipped.
- manual checks: 21 listed, 21 passed; the unticked ones stay open for QA
- Trace matrix: [docs/TRACE.md](TRACE.md).
- Review ([docs/REVIEW.md](REVIEW.md)), cycle 2: `Reviewed: 84ea41f`. `Mutations: 209 planted, 206 caught, 3 survived`. All 3 survivors were judged equivalent. `## Verdict: MERGE`. The 6 confirmed findings (F-15 to F-20) are all advisory. The 9 cycle-1 findings that were sent back were re-checked and refuted as fixed.
- Human decisions, cycle 1 (`docs/review/1/decisions.json`):
  - Accepted: F-01, F-02, F-03, F-04, F-05, F-06, F-07, F-10, F-11.
  - Rejected: F-08, F-09, F-12, F-13, F-14.
  - Note: "Fix the six blocking ones and the three defects a user can see: the wrong empty message on a load error, the stale customer filter, and the #12 search. The stricter email rule is what I want, hand-edited data is out of scope for this build, the clickable orders in the customer view and the shared DOM helpers go to a later slice, and the CI pin is a repo chore I will do myself."
  - Cycle 2 has no decisions file, because its verdict is MERGE.
- Review warning: none. The review covers 84ea41f. The only commit after it is the review record itself, which is docs only.

## Open items
- LATER R-22: order status (draft, sent, paid).
- LATER R-23: tax / VAT on lines.
- LATER R-24: export or print an invoice.
- LATER R-25: import and export of the whole data set as JSON.
- QA: none. All manual checks are ticked.
- Advisory findings from cycle 2, not fixed in this PR:
  - F-15: line edit state survives Back.
  - F-16: the error banner is not cleared on navigation.
  - F-17: lines tests use a single order.
  - F-18: updateCustomer test coverage.
  - F-19: PLAN S6 and the R-18 manual check still say "forms are disabled".
  - F-20: the S7 fix commit message names R-18.
- Watch list, unproven:
  - SEC-8: localStorage blocked by the browser leaves a blank page.
  - SEC-9: `crypto.randomUUID` fails on a non-localhost http origin.

## Decisions
- [ADR-001](decisions/ADR-001-stack.md): Stack
- [ADR-002](decisions/ADR-002-ai-boundaries.md): AI boundaries
- [ADR-003](decisions/ADR-003-price-input.md): Price input with a comma
- [ADR-004](decisions/ADR-004-navigation.md): Navigation
