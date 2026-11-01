# PR: invoice-app, branch `build/invoice-app`

## What

A local browser app for one person that manages customers, their orders and the lines of each order, with exact totals. Plain JavaScript ES modules, no framework, no build step, no dependencies; all data in one `localStorage` key behind a single storage module; seven screens behind a hash router; tests with Node's built-in runner. Sixteen plan slices, two review series with their fix rounds, the manual checks ticked, and a GitHub Pages delivery workflow with its runbook.

Commits, first of the branch to HEAD:

```
80bf456 Delivery: GitHub Pages workflow and runbook
520d29b Manual checks: run in a headless Chromium, spot-checked in a browser, all ticked
11788a5 Review, series 2, cycle 1: MERGE
bf200b7 S14: fix F-35 (R-06, R-07, R-17, R-18, R-21, R-22)
ea89b40 S12: fix F-35 layout (R-03, R-04, R-16, R-18, R-22, R-28, R-29)
c9cc2ba S12: fix F-35 (R-03, R-04, R-16, R-18, R-22, R-28, R-29)
2c16fd9 S11: fix F-35 (R-01, R-02, R-17, R-21, R-22)
abaff60 S10: fix F-35 (R-03, R-05, R-18, R-19, R-22, R-28, R-32)
84d0186 ADR-004: answer to review F-10
349e17a S11: fix F-63, F-43 (R-01, R-04)
cd690bd S10: fix F-63, F-43 (R-01, R-04)
6d0f557 S15: fix F-35 (R-08, R-14, R-15, R-16, R-18, R-22, R-28)
d19ea62 S14: fix F-15, F-36, F-33, F-53 (R-06, R-07, R-21)
271ba2d S13: fix F-34 (R-16)
59e744d S9: fix F-43, F-54, F-55, F-56, F-57, F-58, F-59 (R-04, R-12, R-15, R-20, R-21, R-28)
2bda65a S8: fix F-39, F-61 (R-28)
1ec2f69 S6: fix F-32 (R-29, R-31)
255831d S2: fix F-13, F-62, F-52 (R-01, R-11, R-17)
1b0513d S7: fix F-48, F-49, F-50, F-51, F-60 (R-06, R-11, R-15, R-19, R-20)
109a927 Review cycle 2: decisions
2715c7b Review cycle 2: BUDGET
c0576d1 S13: fix F-44 (R-31)
bd3d07b Plan: R-31 manual check in S13 (review F-44)
eba225d S16: fix F-05, F-46, F-42; F-01, F-06, F-08, F-17..F-20, F-23..F-27, F-35 already closed (R-08, R-11, R-12, R-13, R-17, R-18, R-21, R-22, R-28)
6e0f818 S15: fix F-01, F-05, F-06, F-08, F-17, F-18, F-19, F-20, F-35; F-16, F-21, F-23..F-27, F-33, F-36 and F-42 already closed in shared files (R-08, R-14, R-15, R-16, R-18, R-22, R-28)
f19ef9e S14: fix F-47; F-16, F-21, F-33, F-36, F-23..F-27 already closed in shared files (R-06, R-07, R-17)
96e017d S12: fix F-36 (R-04, R-16, R-28)
7b55fbf S12: fix F-34, F-36, F-43; F-16, F-21, F-33, F-23..F-27 already closed in shared files (R-04, R-16, R-28)
17add5d S11: fix F-15, F-36 (R-21); F-07, F-16, F-21, F-33, F-23..F-27 already closed in shared files (R-01, R-21)
a2266d8 S10: fix F-07, F-16, F-21, F-22, F-23, F-24, F-25, F-26, F-27, F-33, F-36 (R-01, R-03, R-28)
996617e S9: fix F-16, F-21, F-33, F-36, F-23, F-24, F-25, F-26, F-27, F-37 (R-20, R-21, R-28, R-31, R-32)
024fb22 S8: fix F-28, F-39, F-40 (R-16, R-28, R-31)
68d263b S7: fix F-02, F-09, F-10, F-11, F-12, F-30 (R-06, R-19, R-20, R-21, R-32)
23a9c9e S5: fix F-04, F-31 (R-11, R-12, R-13, R-15)
646d156 S3: fix F-32 (R-05)
4791fde S2: fix F-03, F-13 (R-01, R-11)
b7a367a Review cycle 1: decisions
309ac7b Requirements and ADR-006: answers from review cycle 1 (F-07, F-13, F-14, F-38)
c3d15d7 Review cycle 1: FIX FIRST
21f920b S16: add, edit and remove order lines on screen (R-11, R-12, R-13, R-17, R-18, R-21, R-22, R-28)
6f22c70 S15: order view screen with lines, total and delete (R-08, R-14, R-15, R-16, R-18, R-22, R-28)
4c9b29a S14: order form screen in three forms with picker, errors and landings (R-06, R-07, R-17, R-18, R-21, R-22)
13cedd6 S13: order list screen with search and empty states (R-09, R-10, R-16, R-18, R-22, R-28)
c4e9348 S12: customer detail screen with orders, delete and export (R-03, R-04, R-16, R-18, R-22, R-28, R-29)
f14324a S11: customer form screen with visible errors and kept input (R-01, R-02, R-17, R-21, R-22)
d11504c S10: customer list screen with search, data note and erase (R-03, R-05, R-18, R-19, R-22, R-28, R-32)
526cbee S9: app frame, not found and blocked screen (R-20, R-21, R-22, R-28, R-31, R-32)
7ade51f S8: router and formatters (R-03, R-16, R-28, R-31)
11c9ebe S7: storage with safe load, whole-document save, write lock and erase (R-06, R-19, R-20, R-21, R-32)
cfdfcd2 S6: customer export (R-29, R-31)
58c18e1 S5: order line commands (R-11, R-12, R-13, R-15)
6ba1a60 S4: order commands, list and search (R-02, R-03, R-06, R-07, R-08, R-09, R-10)
bd4ef79 S3: customer commands, list, search and label (R-01..R-06)
f795bb8 S2: input validation for customers, orders and lines (R-01, R-02, R-06, R-07, R-11, R-12, R-17, R-31)
e36af76 S1: exact integer money and real calendar dates (R-06, R-11, R-14, R-15)
e3bdfb3 Tests: acceptance specs from the plan (tester)
c74385c Plan approved
efb531c ADR-007: the collator lives in format.js (ADR-003)
07b53b2 ADR-003: answers to the plan (D1, CRI-3)
4b6cda8 Plan: draft and critic review
cb3f00a UI spec approved
2941e13 Project manifest (ADR-001)
1560d7b Architecture accepted
0f07698 Requirements approved
2daade9 Licence: MIT
fb13d69 Requirements review: decisions
8e9c59f Requirements review
54e12a1 Requirements: draft from the brief, questions answered
160de56 Start: brief, rules for the agents, AI boundaries, the sdlc plugin
```

## Why

The brief (`docs/BRIEF.md`) asks for a simple local JavaScript application that manages customers, orders and order lines, persists in `localStorage`, calculates order totals, searches customers and orders, and shows basic validation with useful empty and error states.
The scope is kept light: 26 MUST requirements shipped, 6 marked LATER. Requirements: [docs/REQUIREMENTS.md](REQUIREMENTS.md).

## How it was verified

Gate on the working tree at `80bf456` (`gate.mjs --review`):

```
gate     tests    464 passed, 0 failed
gate     scope    no slice active: 3 files changed, all in docs/
gate     trace    26 MUST, 0 missing, 0 orphan IDs
gate     contract 11 approved documents intact (PLAN.md@bd3d07b, REQUIREMENTS.md@309ac7b, UI-SPEC.md@cb3f00a, decisions/ADR-001-stack.md@1560d7b, decisions/ADR-002-ai-boundaries.md@160de56, decisions/ADR-003-module-layout.md@07b53b2, decisions/ADR-004-persistence.md@84d0186, decisions/ADR-005-navigation.md@1560d7b, decisions/ADR-006-money.md@309ac7b, decisions/ADR-007-validation-errors.md@efb531c, decisions/ADR-008-delivery-browser-security.md@1560d7b)
gate     secrets  3 files clean
gate     deps     no dependency file changed
gate     commit   no message to check
gate     ci       .github/workflows/gate.yml runs the gate with --strict
gate     review   bf200b7 ok, verdict MERGE
GATE PASS
```

`node --test` over `tests/*.test.js` and `tests/*.spec.mjs`: 464 tests, 464 pass, 0 fail, 0 skipped.

manual checks: 26 listed, 26 passed; the unticked ones stay open for QA

Review (`docs/REVIEW.md`, series 2, cycle 1):

```
Reviewed: bf200b7 (c0576d1..HEAD, 18 commits)   Date: 2026-11-01
Mutations: 296 planted, 286 caught, 10 survived (all 10 judged equivalent by the verifier)
## Verdict: MERGE
```

The verdict is MERGE with five advisory findings (F-64 to F-68) and four watch-list items that need a human reading of R-17 and LD-04; the review names the slices to reopen if the human wants them fixed (S15, S16, S12, S7, S2). No `docs/review/1/decisions.json` exists for this cycle: a MERGE verdict asks for no decision.

Human decisions from the earlier review series (archived under `docs/review/archive/1-c0576d1/`):

- Cycle 1 (FIX FIRST, decided 2026-10-30): 42 findings accepted, 5 rejected (F-14, F-29, F-38, F-41, F-45). Note: "F-14: ADR-001 and A-01 name secure contexts only, assumption recorded. F-29: years 0000 to 0099 are not a real input. F-38: narrowSymbol is what R-16 asks for, recorded in ADR-006. F-41: a commit message is history, not rewritten. F-45: action majors are the kit template's choice, outside this app." Two UAT findings seen by the human in the browser were added (F-46 table layout at 1100 px, F-47 order form customer label).
- Cycle 2 (BUDGET, decided 2026-11-01): all 26 findings accepted, 0 rejected. Note: "All 26 accepted; the four blocking ones are missing tests on the stored-document shape (S7). Fixed in a short round, then a new review series from cycle 1, as the kit allows after BUDGET when code changed."

Review warning: none. The reviewed commit `bf200b7` is the last code change; the four commits after it touch only docs, the manual checks and the CI and Pages workflows.

## Open items

- `LATER` R-23 Issue invoices (numbered, immutable, printable or PDF)
- `LATER` R-24 Tax or VAT per line
- `LATER` R-25 Import of the data, and export of the whole data set, as JSON
- `LATER` R-26 Order status (draft, confirmed, paid)
- `LATER` R-27 More than one currency
- `LATER` R-30 Filter orders by one customer
- `QA` none: every manual check in `docs/MANUAL-CHECKS.md` is ticked.

## Decisions

- `docs/decisions/ADR-001-stack.md`: Stack and runtime
- `docs/decisions/ADR-002-ai-boundaries.md`: AI boundaries
- `docs/decisions/ADR-003-module-layout.md`: Module layout and layering
- `docs/decisions/ADR-004-persistence.md`: Persistence and schema versioning
- `docs/decisions/ADR-005-navigation.md`: Navigation
- `docs/decisions/ADR-006-money.md`: Money
- `docs/decisions/ADR-007-validation-errors.md`: Validation, text matching and errors
- `docs/decisions/ADR-008-delivery-browser-security.md`: Delivery and browser security

## Live

The Pages workflow (`.github/workflows/pages.yml`) deploys on push; the site appears once Settings > Pages > Source is set to GitHub Actions (see `docs/RUNBOOK.md`).

Live: https://ioanbitza.github.io/invoice-app/
