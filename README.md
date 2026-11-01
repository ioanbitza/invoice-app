# Invoice app

A small local application for one person: customers, their orders and the lines of each order, with exact totals. Plain JavaScript as ES modules, no framework, no build step, no dependencies. The data lives in one `localStorage` key. Built from the one-page brief in [docs/BRIEF.md](docs/BRIEF.md) with Claude Code and a process that lives in this repository.

Live: https://ioanbitza.github.io/invoice-app/ (a demo with invented data; every project site of one owner shares that origin's storage, so real data belongs on localhost).

## What this repository holds

Two things, on purpose, in one place.

1. **The application.** `index.html`, `styles.css`, `src/` (domain, storage, ui) and `tests/`.
2. **The way it was built.** [`sdlc/`](sdlc/README.md) is a Claude Code plugin with the roles, the skills, the hooks and the one gate script I used. `docs/` holds every artefact those steps produced, from the requirements to the review. [AGENTS.md](AGENTS.md) holds the rules every agent read.

The exercise asked one thing: how do I get from an incomplete idea to a working implementation with AI, and keep ownership of the result. The second part is the answer. The application is the proof.

## Run it

```sh
python3 -m http.server 8000      # then open http://localhost:8000 (ES modules do not load from file://)
npm test                         # 464 tests with Node's own runner, Node 22 or newer
node sdlc/tools/gate.mjs         # the gate on the working tree; CI runs it with --strict
```

To work on it with the same process: `claude --plugin-dir sdlc` from the repository root, and once per clone `git config core.hooksPath .githooks`.

## How I worked

Every rule that matters is a script that says no, not a sentence in a prompt. Every decision I take goes into a file, never into a chat. Writing roles run on the cheaper model where the job is already specified; judging roles run on a stronger model, never the author's. The method is described in [sdlc/README.md](sdlc/README.md). This is what happened on this app, in order.

| Step | Who | Model | Result | My part |
|---|---|---|---|---|
| Requirements | the requirements skill | Opus | [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md): 26 MUST, 6 LATER, 15 assumptions, 3 open questions | answered the questions (a customer with orders cannot be deleted, one currency, whole quantities), approved |
| Requirements review | product owner, legal role | Opus | [docs/REQUIREMENTS-REVIEW.md](docs/REQUIREMENTS-REVIEW.md): 30 items, 3 of them blocking (no order view in the requirements, no way out of unreadable stored data, the export of a person's data pushed to later) | took 28 into the requirements (R-28 to R-32, A-11 to A-15), left 2 out, approved again |
| Architecture | architect | Opus | ADR-001 and ADR-003 to ADR-008, proposed | read and accepted each; [ADR-002](docs/decisions/ADR-002-ai-boundaries.md), the AI boundaries, is mine |
| Design | ux-designer | Opus | [docs/UI-SPEC.md](docs/UI-SPEC.md): a quiet ledger, colour tokens with their contrast ratios, eight screens sketched at 320 px and on desktop | approved |
| Plan | the planning skill, then the critic | Opus, Fable | [docs/PLAN.md](docs/PLAN.md): 16 slices, each with the files it may touch and its tests first; 3 critic findings, 1 blocking, applied | answered two questions in ADR-003 and ADR-007, approved |
| Acceptance tests | tester | Opus | `tests/*.spec.mjs`: 8 files written from the requirements before any code; the builder may not edit them | nothing: they are the bar |
| Build | builder, a fresh context per slice | Sonnet | 16 commits `S<n>: ... (R-xx)`, test-first, inside the planned files | watched the hooks refuse what was out of scope |
| Review | four finders in parallel, then a verifier | Opus, Fable | three cycles, see below | accepted or rejected every finding from my own terminal |
| Manual checks | the builder lists them, I tick them | | [docs/MANUAL-CHECKS.md](docs/MANUAL-CHECKS.md): 164 checks, all ticked | ran them in a headless Chromium and spot-checked them in a browser |
| Delivery | devops | Sonnet | the Pages workflow and [docs/RUNBOOK.md](docs/RUNBOOK.md) | switched Pages on |
| Ship | the ship skill | | [docs/TRACE.md](docs/TRACE.md), [docs/PR.md](docs/PR.md) | pushed, opened the pull request |

## What the review found

The review is the part that matters most to me, because it is where the AI's mistakes become visible instead of shipped. Four finders (correctness, security, contract, legal) read the code in parallel without seeing each other, each with its checklist. A verifier on a stronger model re-checks every finding against evidence, refutes what does not hold, and plants defects in a copy of the code to prove that the tests can fail. A script writes the verdict; no model does. Everything is in [docs/REVIEW.md](docs/REVIEW.md) and under `docs/review/`.

- **Cycle 1: FIX FIRST.** 45 findings confirmed, 4 blocking. Three of the blocking ones were tests that could not fail: a planted defect that widened the quantity rule, one that moved the safe-total boundary by one and one that dropped the write lock after a failed load all went through unnoticed. The fourth: a failed line save on a long order showed its error off screen. I accepted 42, two of them reported by me from the browser (the lines table collapsed at 1100 px, a read-only customer field was labelled optional), and rejected 5; the reasons are written next to the decision.
- **Cycle 2: BUDGET, my decision.** The verifier confirmed 32 of the fixes and found 26 findings still open or half closed, 4 blocking, all of one kind: no test pinned the shape of the stored document. After two cycles the plugin stops and asks the human. I accepted all 26 and ran one more fix round instead of shipping with them.
- **Series 2, cycle 1: MERGE.** 5 advisory findings left, open on purpose: a banner that flashes before a reload, two views that still take the whole state object, three test titles that promise more than the test checks. 4 items on the watch list, all about which invisible characters count as empty text. None of them blocks a user.
- **Planted defects.** 296 planted, 286 caught, 10 survived; the verifier judged all 10 equivalent (a comparator's sign, a boundary that unique ids never reach) and wrote the reason for each.

## The decisions, in short

- Plain ES modules, `node:test`, no dependencies, no build step. A dependency needs its own ADR with its licence. [ADR-001](docs/decisions/ADR-001-stack.md)
- Money is integer cents; totals are computed from the lines and never stored, so the stored data cannot disagree with them. [ADR-006](docs/decisions/ADR-006-money.md)
- One `localStorage` key with a version. A document that cannot be read is never overwritten: the app blocks, says what happened and offers a copy of the stored text or a fresh start. [ADR-004](docs/decisions/ADR-004-persistence.md)
- Three layers: domain (pure functions), storage (the only code that touches `localStorage`), ui (DOM only). Hash routing; a page is addressed by id only, and no personal data reaches the URL, the title or an error. [ADR-003](docs/decisions/ADR-003-module-layout.md), [ADR-005](docs/decisions/ADR-005-navigation.md)
- User text goes on screen through `textContent` only; a strict content security policy; no inline script or style. [ADR-008](docs/decisions/ADR-008-delivery-browser-security.md)
- One design direction, written before the first screen: ruled rows, right-aligned money, one accent colour for what can be pressed. [docs/UI-SPEC.md](docs/UI-SPEC.md)
- Out of scope for now, named rather than forgotten: invoices, VAT, import, order status, more currencies, a filter by customer. R-23 to R-27 and R-30 in the requirements.

## Models and cost

Claude Code with three models. Sonnet for the builder and the devops role, where the work is fully specified before it starts. Opus for what needs judgement: the requirements and their review, the architecture, the design, the plan, the acceptance tests, the four finders. Fable for the two judges that must be stronger than the author they judge: the critic on the plan and the verifier on the review. The whole build, review included, cost about 90 USD of usage, most of it in the review.

## What I would still change

- The domain finder never ran: I did not write a domain skill for this app, so no `D-nn` rules bound the builder or the review. The legal rules the plugin ships stood in.
- The user interface is covered by manual checks, not by browser tests. A Playwright suite would turn the 164 ticks into a script.
- Two acceptance tests compare an order of 9008 lines with `deepEqual`; when they fail, the diff runs to megabytes and costs Node 22 most of the machine's memory. The mutation runner caps the memory of a test process now; the tests should compare less.

## Layout

```
AGENTS.md                      the rules every agent reads (CLAUDE.md imports it)
docs/BRIEF.md                  the brief as received
docs/REQUIREMENTS.md           R-01 to R-32 with acceptance criteria, A-01 to A-15, approved
docs/REQUIREMENTS-REVIEW.md    the product owner's and the legal role's items, ticked
docs/decisions/                ADR-001 to ADR-008
docs/UI-SPEC.md                the design contract
docs/PLAN.md                   16 slices; docs/plan-review/ holds the critic's findings
docs/MANUAL-CHECKS.md          164 checks, ticked
docs/REVIEW.md                 the final review; docs/review/ holds every cycle's findings and decisions
docs/TRACE.md                  requirement, tests, commits, manual check
docs/PR.md, docs/RUNBOOK.md    the pull request text; how to run, deploy and roll back
index.html, styles.css, src/   the application: domain, storage, ui
tests/                         *.spec.mjs by the tester, *.test.js by the builder
sdlc/                          the plugin: agents, skills, hooks, tools, templates, docs
.githooks/, .github/           the same gate for git and for CI; the Pages workflow
```

## Licence

MIT, see [LICENSE](LICENSE).
