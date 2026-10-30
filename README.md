# Invoice app

A small local app for customers, orders and order lines. Plain JavaScript, ES modules, no build step, no dependencies. Data lives in the browser's `localStorage`, money is whole EUR cents, totals are computed from the lines.

The app is the worked example of [sdlc-kit](https://github.com/ioanbitza/sdlc-kit): it was planned, built and reviewed with Claude Code, with every rule enforced by a script and every decision recorded in a file. This repository holds the result as it was produced, including the review that found the defects and the decisions taken on each of them.

## Run it

```sh
git clone https://github.com/ioanbitza/invoice-app
cd invoice-app
python3 -m http.server 8000
```

Open http://localhost:8000. ES modules do not load from `file://`, so a local server is needed; any static server works.

Tests use Node's own runner, nothing to install:

```sh
node --test
```

## What it does

- Customers: create, edit, view, delete, search by name or email. A customer with orders cannot be deleted; the message says how many orders block it.
- Orders: one customer each, created from the customer's page, edited, deleted, filtered by customer and searched by number.
- Order lines: description, whole quantity, unit price with a dot for decimals; line and order totals in EUR cents, formatted on screen.
- Validation on every form, empty states on every list, and an error banner when a save fails or the stored data cannot be read. Unreadable data is never overwritten.
- All user text is rendered as text, never as HTML.

The exact behaviour is in [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md): 21 requirements marked MUST, 4 marked LATER, each with its acceptance criteria.

## How it was built

The brief is [docs/BRIEF.md](docs/BRIEF.md). From there, seven commands of the kit, in this order, with a human step between each:

| Step | Command | Result in this repository |
|---|---|---|
| Rules and decisions | written by hand | [AGENTS.md](AGENTS.md), [ADR-001 stack](docs/decisions/ADR-001-stack.md), [ADR-002 AI boundaries](docs/decisions/ADR-002-ai-boundaries.md) |
| 0 | `/sdlc-kit:init` | git hooks, the CI workflow, commit `Kit hooks and CI gate` |
| 1 | `/sdlc-kit:write-requirements docs/BRIEF.md` | [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md), three questions answered, then `Status: approved` |
| 2 | `/sdlc-kit:plan-slices` | [docs/PLAN.md](docs/PLAN.md): seven slices, each with the files it may touch; two decisions answered in [ADR-003](docs/decisions/ADR-003-price-input.md) and [ADR-004](docs/decisions/ADR-004-navigation.md) |
| 3, 4 | `/sdlc-kit:implement-slice S1`, `/sdlc-kit:build-slices S2 ... S7` | one commit per slice, `S1` to `S7`, test-first in domain and storage |
| manual checks | run by hand in a browser | [docs/MANUAL-CHECKS.md](docs/MANUAL-CHECKS.md), ticked only after each one passed |
| 5 | `/sdlc-kit:review-change` | [docs/REVIEW.md](docs/REVIEW.md), cycle 1: `FIX FIRST`, 14 confirmed findings, 6 blocking; the raw finder and verifier answers under [docs/review/1](docs/review/1) |
| decisions | `review.mjs decide` from the terminal | [docs/review/1/decisions.json](docs/review/1/decisions.json): 9 accepted, 5 rejected, with the reason |
| 3 again | `/sdlc-kit:implement-slice S<n> F-xx` | six fix commits, each inside its slice, each with the test that would have caught the defect |
| 5 again | `/sdlc-kit:review-change --cycle 2` | cycle 2: `MERGE`; 209 planted defects, 206 caught, 3 judged equivalent |
| 6 | `/sdlc-kit:ship` | [docs/TRACE.md](docs/TRACE.md) (every requirement to its tests, commits and manual check) and [docs/PR.md](docs/PR.md), the text of the pull request |
| project skill | `/release-notes` | [docs/RELEASE-NOTES.md](docs/RELEASE-NOTES.md), written by a skill created in this repository during the build |
| business and domain review | `/sdlc-kit:review-requirements` | [docs/REQUIREMENTS-REVIEW.md](docs/REQUIREMENTS-REVIEW.md): a product owner and a domain expert read the approved requirements, 24 items, 2 blocking, as checkboxes the human ticks; run after the build, so it is the starting point of the next iteration, not a change to this one |

Who did what: requirements, plan and review on Opus; the code on Sonnet; the verifier on a model other than the author's; the verdict written by a script from what was measured. The human approved the requirements, answered the plan's questions in ADRs, ran the manual checks, accepted or rejected each finding, and opens the pull request. The AI never pushed, never created a branch, never touched a decision file; the hooks refuse those.

## The business and the domain are files too

The kit's first run on this app had only engineering roles. The roles a real team has beyond them were added afterwards and run on this repository as they are:

- The domain knowledge is a project skill, [.claude/skills/domain-invoicing/SKILL.md](.claude/skills/domain-invoicing/SKILL.md): fifteen rules `D-01` to `D-15` on money in cents, rounding per line, orders versus invoices, immutable issued invoices, sequential numbering, the mandatory content of an invoice (Directive 2006/112/EC, article 226), customer data, retention, currency and dates. Each rule has a why and a primary source. The human signs it; after that no agent may change it.
- [docs/REQUIREMENTS-REVIEW.md](docs/REQUIREMENTS-REVIEW.md) is what a product owner and a domain expert found when they read the approved requirements against the brief and those rules: 24 items, 2 blocking. Nothing is folded in yet. The human ticks the items to accept and they become the requirements of the next iteration, where `finder-domain` will also review the code against the same rules.
- The UI rules the builder reads before a UI slice come from the kit's `ui-ux` skill, adapted from [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT). This build predates that skill; the next iteration applies it.

## Read it in this order

1. [docs/BRIEF.md](docs/BRIEF.md): what was asked.
2. [AGENTS.md](AGENTS.md) and [docs/decisions](docs/decisions): the rules and the decisions, before any code.
3. [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) and [docs/PLAN.md](docs/PLAN.md): what was built and in which order.
4. `git log --oneline`: one commit per slice, each naming the requirements it covers.
5. [docs/REVIEW.md](docs/REVIEW.md): what the review found, what the verifier proved, and the verdict.
6. [docs/review/1/decisions.json](docs/review/1/decisions.json): what the human decided and why.
7. [docs/TRACE.md](docs/TRACE.md) and [docs/PR.md](docs/PR.md): the proof, requirement by requirement, and the open items.
8. [.claude/skills/domain-invoicing/SKILL.md](.claude/skills/domain-invoicing/SKILL.md) and [docs/REQUIREMENTS-REVIEW.md](docs/REQUIREMENTS-REVIEW.md): the domain rules and what the business and domain roles found; the next iteration starts here.

## Open items

Listed in [docs/PR.md](docs/PR.md): four `LATER` requirements (order status, tax, printing an invoice, JSON import and export), six advisory findings from cycle 2 left for a later slice, and two unproven watch-list items about browsers that block `localStorage` or `crypto.randomUUID`.

## Layout

```
index.html, styles.css      the page
src/domain/                 pure rules: customers, orders, lines, money; no DOM, no storage
src/storage/                the only code that touches localStorage
src/ui/                     DOM rendering and events; no business rules
tests/                      one test file per domain and storage module, titles start with the requirement ID
docs/                       brief, requirements, plan, decisions, manual checks, review, trace, PR text, release notes
.githooks/, .github/        the same gate script as the Claude hooks, for any tool and for CI
```

## License

MIT, see [LICENSE](LICENSE).
