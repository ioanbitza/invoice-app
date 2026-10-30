# sdlc

A software team in a Claude Code plugin: requirements with IDs, architecture as proposed ADRs the human accepts, a design contract, a plan cut into slices and judged by a critic before approval, acceptance tests written before the builder, test-first code on a cheap model, an independent review that plants defects, business, domain and legal roles with their knowledge in files, a GitHub Pages delivery with a runbook, and one gate script that refuses, enforced by Claude hooks, git hooks and CI.

The plugin takes a repository from a one-page brief to a pull request in eleven commands. Every rule that matters is a script that says no and why, not a sentence in a prompt that asks nicely. Every decision the human takes lives in a file, never in a chat. Node 22 or newer, no dependencies, plain Markdown and JavaScript.

Contents: [Why](#why) · [The ideas](#the-ideas-and-why-each-one) · [The team](#the-team) · [How it works](#how-it-works) · [Quick start](#quick-start) · [The steps](#step-0-the-gates-installation) · [What is enforced](#what-is-enforced) · [Design choices](#design-choices-and-why) · [Against the standards](#against-the-standards) · [Compared with other kits](#compared-with-other-kits) · [Business, domain, legal](#business-domain-and-legal-roles) · [UI and UX](#ui-and-ux) · [This repository](#this-repository) · [Layout](#layout)

## Why

Code written by an AI has a problem that has nothing to do with its quality: nobody owns it. The developer prompted, skimmed, accepted. The reasons behind each choice lived in a chat window, and the chat ended. Three weeks later nobody can say which requirement a function serves, why the data is stored that way, or whether a test can fail at all. A review by the same model that wrote the code tends to agree with the author. A rule written as a prompt ("never use innerHTML") holds until the context gets long. And the business and the domain the code serves were never written down: the model guessed a rounding, a numbering, a flow, and nobody could review the guess.

The kit fixes those with the cheapest tools there are: IDs, file lists, a second opinion with evidence, a script that says no, and a file for the business, the domain and the law. The long version, with the alternatives rejected, is in [docs/concepts.md](docs/concepts.md).

## The ideas, and why each one

**1. Requirements carry IDs, and the IDs follow the work.** `docs/REQUIREMENTS.md` holds headings like `### R-07 [MUST] Order total sums its lines`. Every test title starts with its ID, every commit message names the IDs it covers, every review finding points at one. `tools/trace.mjs` reads all of that and the gate fails when a MUST has neither a test nor a manual check. *Why:* the ID is the only thing that survives the chat, the refactor and the handover, so the ID is the unit of ownership. (ISO/IEC/IEEE 29148 calls this bidirectional traceability; here it is a gate, not a spreadsheet.)

**2. The plan is cut into slices, and each slice lists the files it may touch.** `docs/PLAN.md` has one section per slice with one `**Files:**` line. While a slice is active, the AI can change those files and nothing else; a hook refuses the rest before the write happens. *Why:* the blast radius of a session is a line in a file the human read before the first edit. A slice of at most six files is also small enough to end in something testable in one fresh context, which is what lets the builder run on the cheaper model and what keeps long-context degradation out of the loop. Before the human approves the plan a critic on another model judges the draft (`CRI-n` findings; the blocking ones are applied, the advisory ones listed for the human), and once it is approved a tester writes acceptance tests per requirement in `tests/<area>.spec.mjs`, which the builder must make pass and may not edit.

**3. Review is an independent audit with evidence, on a stronger model than the author.** Finders look for one class of defect each (correctness, security, contract, legal, and domain when the project has a domain skill), in parallel, without seeing each other, reading the requirements before the diff and the author's commit messages last. They return typed JSON findings, not prose. A verifier on a stronger model than the author's re-checks every finding and plants defects in a copy of the project with `tools/mutate.mjs`: one operator flipped at a time, and the tests must go red each time. A script writes the verdict from what was measured and what was proven. *Why:* a model reviewing its own output agrees with itself, and a reviewer asked to find problems always finds some; so the author never judges, the finders never see each other, and the verdict is a function of evidence, not an opinion. The verifier can fail the review; nothing can pass it but the numbers.

**4. One gate script, enforced three times.** `tools/gate.mjs` checks tests, scope, trace, baseline, secrets, dependencies, the commit message and, at ship, the CI workflow and the review binding; exit 0 or 1. The same script runs from the Claude Code hooks while the AI works, from `.githooks/` for any tool or human, and from CI with `--strict`. *Why:* a rule that lives in one script is the same on a long day as on a short one, and the three places cannot drift from each other.

**5. The business, the domain and the law are files too.** A product owner agent checks the requirements against the brief's flows, a domain expert checks them against rules the human signed in a project skill (`D-nn`), a legal role checks them against rules the kit ships with their articles (`LD-nn`, `LL-nn`, `LE-nn`), before any code and again on the code. *Why:* asked to "think like an accountant" an AI answers confidently and wrong; a rule with a `Source:` line can be reviewed, versioned and cited, a prompt cannot.

**6. The human decides in files, never in chat.** `Status: approved` on the requirements, on the design contract (`docs/UI-SPEC.md`) and on the plan, `Status: accepted` on an ADR the architect proposed, a tick on a manual check, `decisions.json` on a review finding. Once a document is approved it is frozen for every agent, and the git history is the record: the kit checks that an approved document is unchanged since the commit that approved it. *Why:* the chat ends, the file stays; and a document that only a human can change is the one thing an agent cannot talk itself into editing.

**7. The way of working is a library of rules, switched on by the architect's decisions.** SOLID and the dependency rule, test-first and how QA writes a ticket back, data access, OWASP ASVS, errors and logs, release discipline, code review, and the stack (`stack-javascript`, `JS-01..18`) are skills under `skills/discipline-*` and `skills/stack-*`: numbered rules with a `Why:` and a primary `Source:`, like the legal ones. Each declares the ADR tags that switch it on and the roles that read it; an ADR carries a `Tags:` line (the architect writes it); `tools/profile.mjs` computes per role the exact files to read, the briefs list them, and a finding may cite a rule only from an active skill. Why: the team forms top-down from the documents (requirements bound the architect, the architect's tags bind the builder, the tester and the reviewers), and a reviewer argues with a file, not with a memory of a best practice.

## The team

Fifteen agents, five that write and ten that judge. Each has a model chosen for its job, a tool list the harness enforces, and a write scope the kit's hooks enforce (`x-writes` in the agent file: `slice` for the builder, `[]` for a judge, a list of path patterns for a role that owns files).

| Agent | Model | Writes | Job | Why this model |
|---|---|---|---|---|
| `builder` | sonnet | the active slice's files | makes the slice's tests green (the tester's specs and its own), one commit per slice | a six-file slice with tests already decided is a well-specified job; the expensive judgement was spent before it and comes after it |
| `architect` | opus | `docs/decisions/ADR-*.md`, new or still `Status: proposed` | one ADR per decision the approved requirements leave open, with a `Tags:` line; the human accepts | the stack, the layout and the storage shape are the choices everything downstream inherits |
| `ux-designer` | opus | `docs/UI-SPEC.md` | the design contract: direction, tokens with contrast ratios, type and spacing scales, components and states, every screen sketched; proposed as `Status: draft` | a screen designed by improvisation is redone; a spec read in five minutes is not |
| `tester` | opus | `tests/**/*.spec.mjs` | acceptance tests per requirement from the approved plan, before the builder; a spec self-skips until its module exists | a test the author did not write is the one check the author cannot bend |
| `devops` | sonnet | `.github/workflows/pages.yml`, `docs/RUNBOOK.md` | the GitHub Pages workflow from the kit's template and the runbook; one commit | a template with one placeholder and a `check` command is execution, not judgement |
| `product-owner` | opus | nothing | the business flow on the requirements: who, flows end to end, priorities, observable criteria | finding what a brief implies and the requirements dropped is judgement, not execution |
| `domain-expert` | opus | nothing | the requirements against the project's `D-nn` rules; refuses without a domain skill | same |
| `legal` | opus | nothing | the requirements and the data model against `LD/LL/LE` rules | same; and it never advises, it cites |
| `critic` | fable | nothing | the draft plan before the human approves it: MUST coverage, slice size, shared files, untestable steps, misread requirements, contradicted ADRs; `CRI-n` findings | it judges what opus planned, so it runs on another model, and a plan error is the costliest one to find later |
| `finder-correctness` | opus | nothing | logic, money, rounding, state, error handling | a finder's value is what it notices; a cheaper model notices less |
| `finder-security` | opus | nothing | HTML sinks, boundary validation, stored data, egress | same |
| `finder-contract` | opus | nothing | the change against the requirements, the plan, the ADRs and `docs/UI-SPEC.md`; weak tests | same |
| `finder-domain` | opus | nothing | the code against `D-nn` | same |
| `finder-legal` | opus | nothing | the code against the legal rules | same |
| `verifier` | fable | nothing | re-checks every finding, plants defects, names the broken level | the one role that can fail the review must be at least as strong as every author and finder; a weaker verifier approves anything |

Judges answer JSON; the clerk (the main session, which runs the scripts and decides nothing) saves it; the scripts validate and render. Judges have no Edit or Write tool, cannot spawn agents, carry a turn budget (`maxTurns`) so a partial answer is marked partial by the harness, and the verifier may never be put on the builder's model nor the critic on the planner's (a hook refuses the spawn). The writing roles other than the builder own a list of paths and nothing else: the tester's `.spec.mjs` files and the devops role's two files are refused to the builder and to the main session as well, so nobody but their owner changes them.

## How it works

```
  human        docs/BRIEF.md
    |
    v
 1  write-requirements   opus      docs/REQUIREMENTS.md     R-01 [MUST] ..., A-nn, at most three Q-nn
    |                              human answers Q-nn, writes Status: approved -> frozen (baseline)
    v
 1b review-requirements  clerk     docs/REQUIREMENTS-REVIEW.md  product-owner, legal, domain-expert (opus) in
    |                    + agents                                parallel; reqreview.mjs writes the checkboxes;
    |                                                            the human ticks, the session folds in
    v
 1c decide-architecture  architect docs/decisions/ADR-*.md  one ADR per open decision, Status: proposed, Tags: line;
    |                    (opus)                             the human changes the line to Status: accepted, commits
    v
 1d design-ui            ux-designer docs/UI-SPEC.md        tokens, scales, components, screens, Status: draft;
    |                    (opus)                             the human writes Status: approved -> frozen (when the app has a screen)
    v
 2  plan-slices          opus      docs/PLAN.md             S1..Sn, **Covers:** and **Files:** per slice, Status: draft;
    |                    + critic  docs/plan-review/        the critic (fable) judges the draft, blocking findings applied;
    |                    (fable)   decision package         human answers in an ADR, writes Status: approved -> frozen
    v
 2b write-tests          tester    tests/<area>.spec.mjs    acceptance tests per requirement, self-skipping until the
    |                    (opus)                             module exists; the builder never edits them
    v
 3  implement-slice S1   sonnet    src/, tests/             test-first, one commit "S1: ... (R-xx)"
 4  build-slices S2 S3   builder   the remaining slices     fresh context, stops at the first red gate
    |                    (sonnet)
    v
 4b setup-delivery       devops    .github/workflows/pages.yml  GitHub Pages workflow from the template, the runbook;
    |                    (sonnet)  docs/RUNBOOK.md          the human switches Pages to GitHub Actions once, pushes
    v
 5  review-change        clerk     docs/review/<cycle>/     finders (opus) in parallel, then the verifier (fable);
    |   ^                + agents  docs/REVIEW.md           review.mjs writes the verdict
    |   |  FIX FIRST: the human runs review.mjs decide, slices reopen, then --cycle 2; no cycle 3
    |   |  new code after MERGE: a new series from cycle 1, the old cycles archived
    v
 6  ship                 any       docs/TRACE.md, docs/PR.md   gate with the review and ci lines; Live: URL; the human opens the PR
```

| Step | Skill | Who runs it | Writes | The human then |
|---|---|---|---|---|
| 0 | the gate's installation | the human, once per repository | `.githooks/`, `.github/workflows/gate.yml`, `.claude/settings.json` deny rules | sets `git config core.hooksPath .githooks` once per clone |
| 1 | `/sdlc:write-requirements docs/BRIEF.md` | opus | `docs/REQUIREMENTS.md` with `R-nn [MUST]`, `A-nn`, at most three `Q-nn` | answers the questions, writes `Status: approved`, commits |
| 1b | `/sdlc:review-requirements` | the clerk + three judges | `docs/REQUIREMENTS-REVIEW.md`, one checkbox per `PO-n`, `DOM-n`, `LEG-n` item | ticks what to fold in |
| 1c | `/sdlc:decide-architecture` | the architect agent (opus) | `docs/decisions/ADR-<nnn>-*.md`, one per open decision, `Status: proposed`, a `Tags:` line | reads each, changes the line to `Status: accepted`, commits |
| 1d | `/sdlc:design-ui` | the ux-designer agent (opus) | `docs/UI-SPEC.md` with `Status: draft` | approves it (`Status: approved`), commits; skipped when the app has no screen |
| 2 | `/sdlc:plan-slices` | opus, then the critic (fable) | `docs/PLAN.md` with `Status: draft`, `docs/plan-review/critic.json`, the decision package | answers in an ADR, writes `Status: approved`, commits; nothing builds before |
| 2b | `/sdlc:write-tests [S1 S3]` | the tester agent (opus) | `tests/<area>.spec.mjs` per domain or storage slice, skipped until the module exists | nothing; the specs are the builder's acceptance bar |
| 3 | `/sdlc:implement-slice S1` | sonnet | the slice's files, one commit | watches the hooks |
| 4 | `/sdlc:build-slices S2 S3 S4` | the builder agent | the remaining slices, one commit each | fixes what stops it, if anything |
| 4b | `/sdlc:setup-delivery` | the devops agent (sonnet) | `.github/workflows/pages.yml`, `docs/RUNBOOK.md`, one commit | Settings > Pages > Source: GitHub Actions, once; pushes |
| 5 | `/sdlc:review-change [--cycle 2]` | the clerk + finders + verifier | `docs/review/<cycle>/*.json`, `docs/REVIEW.md` with `Reviewed: <sha>` and the verdict | accepts or rejects each `F-id` from their own terminal |
| 6 | `/sdlc:ship` | any | `docs/TRACE.md`, `docs/PR.md` ending with `Live: https://<owner>.github.io/<repo>/` when `pages.yml` exists; never pushes | ticks the manual checks, pushes, opens the PR |

Each step in detail, with what the human does between them: [docs/flow.md](docs/flow.md).

## Quick start

### Prerequisites

- [Claude Code](https://docs.claude.com/en/docs/claude-code) 2.1.295 or newer (the hooks use `onFailure: block` so a guard that crashes refuses instead of allowing), with access to the `fable`, `opus` and `sonnet` models.
- Node 22 or newer, git.
- A plain JavaScript project, or an empty folder for one. The kit expects `node --test` as the runner, tests in `tests/` (the builder's `*.test.*` files and the tester's `*.spec.mjs` files; the gate lists the test files itself, because Node's default patterns skip `*.spec.*`), code under `src/domain/`, `src/storage/` and `src/ui/`, and no npm dependencies. Another layout runs the flow, but `trace.mjs` reads test titles in `tests/`, `mutate.mjs` plants defects under `src/domain/` and `src/storage/`, and the guard refuses `npm install`.

### Use the plugin

The plugin is the `sdlc/` folder of this repository. One session, one flag, from the repository root:

```sh
claude --plugin-dir sdlc
```

For a team: put the folder in a marketplace, `/plugin marketplace add <folder>`, then `/plugin install sdlc@<marketplace>`.

Every role skill runs as a clerk in the main session and launches its agent with the Agent tool (`sdlc:architect`, `sdlc:builder`, ...), one fresh context per run and a fresh builder per slice; the hooks see the agent's name and apply its write scope. No skill forks the main session into a role, so the same rules hold in a terminal and in a headless `claude -p` run.

### Prepare the project

Five files the kit reads and never writes. They are the human's part of the baseline.

1. `AGENTS.md`: copy `templates/AGENTS.md` and fill in the project name, the stack line and the folder structure. The rules in it are the ones the hooks enforce; keep their numbers. Claude Code reads `AGENTS.md` natively; a `CLAUDE.md` with `@AGENTS.md` is still fine for tools that read only that name.
2. `docs/decisions/ADR-001-stack.md` and `docs/decisions/ADR-002-ai-boundaries.md`, from `templates/ADR.md`, with `Status: accepted` (the template puts it after the date on one line: `Date: 2026-10-30. Status: accepted. Author: ...`; the guards and `contract.mjs` read that shape). The first says which language, runner and dependencies (the guard's refusal of `npm install` cites it) and carries the `Tags:` line that switches the stack skill on (`javascript, node, browser, localstorage` for a plain browser app). The second says what the AI never does: push, open a pull request, tag, pick a dependency (the guard's refusal of `git push` cites it). The security finder reads ADR-002 before the diff. Every later decision is proposed by the architect in step 1c and accepted by you the same way.
3. `.claude/settings.json` with `{"includeCoAuthoredBy": false}` if you want commits without AI trailers, and the deny rules listed in [docs/guards.md](docs/guards.md); this repository's file is the reference.
4. `docs/BRIEF.md`: what the app does, for whom, in a page or less.

```sh
mkdir -p docs/decisions .claude
cp sdlc/templates/AGENTS.md AGENTS.md
cp sdlc/templates/ADR.md docs/decisions/ADR-001-stack.md
cp sdlc/templates/ADR.md docs/decisions/ADR-002-ai-boundaries.md
echo '{"includeCoAuthoredBy": false}' > .claude/settings.json
git add -A && git commit -m "Project rules and decisions"
```

### Step 0: the gate's installation

Three files, written once and committed with the project: `.githooks/pre-commit` and `.githooks/commit-msg` run `node sdlc/tools/gate.mjs` on the staged files and the message, so any tool and any human on the machine goes through the same gate; `.github/workflows/gate.yml` runs the same script with `--strict` on every push and pull request; `.claude/settings.json` holds the deny rules. Once per clone: `git config core.hooksPath .githooks`.

*Why the deny rules:* a Claude Code permission deny holds in every mode and with hooks disabled or timed out; the hooks explain, the deny rules hold. *Why `core.hooksPath`:* it is local git configuration, so a fresh clone sets it once or nothing fires.

### Step 1: requirements

`/sdlc:write-requirements docs/BRIEF.md` runs on opus and writes `docs/REQUIREMENTS.md`: three bullets (what the brief says, implies, leaves open), headings `### R-01 [MUST] Title` with one to three acceptance criteria each, `[LATER]` for what is out of scope now, assumptions `A-01`..., at most three open questions `Q-01`... each with a recommended answer, a data model sketch, and `Status: draft` on the third line. Pasted text is saved to `docs/BRIEF.md` first. It then stops and lists the questions.

You answer the questions in the chat; the skill folds the answers into the file. The chat answer counts only once it is in the file and the file carries `Status: approved`, which you type and commit. From that line on the file is a baseline: frozen for every agent (the scope guard denies the edit) and watched by the gate (`contract` line: unchanged since the commit that approved it; to change it, you edit it and change the Status line in the same commit, for example `Status: approved (v2, 2026-10-29)`).

*Why at most three questions:* a session that asks ten questions gets ten half-answers; three get read and answered. *Why MUST and LATER:* scope for this build, so the trace has a finite set to be complete against.

### Step 1b: requirements review (optional, recommended)

Before you approve, `/sdlc:review-requirements` has three roles read the file the way a team would. The session is the clerk: `reqreview.mjs start` writes the brief and names the roles, the clerk launches `product-owner`, `legal` and, only when the project has a domain skill, `domain-expert`, in parallel, saves their JSON, `reqreview.mjs check` validates it (ids, kinds, severities, a `requirement` that exists, a `rule` a skill defines; one re-ask when an answer is unusable), `reqreview.mjs render` writes `docs/REQUIREMENTS-REVIEW.md`:

```
# Requirements review, run 1
Reviewed: 3f9c2d1 (docs/REQUIREMENTS.md, Status: draft)   Date: 2026-10-28
Roles: product-owner, domain-expert, legal (opus)   Domain skills: .claude/skills/domain-invoicing/SKILL.md

## Items (4: 3 blocking, 1 advisory)
- [ ] PO-2  blocking  missing  none  No way to delete a customer
      why: the brief says "manage customers"; R-01..R-06 only create
      suggested: ### R-07 [MUST] Delete a customer ...
- [ ] DOM-1  blocking  wrong  R-05  D-02  R-05 rounds per order, D-02 rounds per line
- [ ] LEG-1  blocking  missing  none  LD-07  A customer can be deleted, the data on an issued invoice cannot, and nothing says so
- [ ] PO-1  advisory  unclear  R-02  R-02 does not say what invalid means
```

You tick the items you accept and tell the session to fold them in; an untouched item is rejected. On an approved file the fold-in is your own edit. *Why three roles and not one "reviewer":* a product owner, an accountant and a lawyer notice different things, and each role's checklist is reported, so a blind spot is visible.

### Step 1c: architecture

`/sdlc:decide-architecture` launches the architect agent with the Agent tool (opus, fresh context). It refuses a draft requirements file, reads the brief, the approved requirements, `AGENTS.md`, the existing ADRs and the skills `profile.mjs architect` lists, and writes one ADR per decision the requirements leave open and the plan needs (stack and runtime, module layout, persistence and schema versioning, navigation, money, validation), numbered after the highest existing ADR, from `templates/ADR.md`, always `Status: proposed`, with a `Tags:` line and an empty `## Answered`. It reports one line per ADR and stops. The scope guard lets the architect create an ADR or edit one still `Status: proposed`; an accepted ADR, the line `Status: accepted` itself and every other path are refused (`architect writes only docs/decisions/ADR-*.md. src/domain/x.js is not among them. Stop and ask the human.`).

You read each file, change `Status: proposed` to `Status: accepted` and commit. From that commit the ADR is a baseline like the plan. The tags you accepted now decide which discipline and stack skills bind the planner, the tester, the builder and the reviewers (`node sdlc/tools/profile.mjs` shows them). *Why proposed and not decided:* the architect sees the trade-offs, you own the consequences; a decision you did not type is one nobody remembers taking.

### Step 1d: design (when the app has a screen)

`/sdlc:design-ui` launches the ux-designer agent with the Agent tool (opus). It reads the brief, the approved requirements (else `Blocked:`), `AGENTS.md`, the ADRs, the kit's UI rules (`skills/ui-ux/SKILL.md`) and `templates/UI-SPEC.md`, and writes `docs/UI-SPEC.md` as a draft: product and audience, the visual direction and why, color tokens with the WCAG contrast ratio next to every text and background pair (4.5:1 for text, 3:1 for large text and borders), typography (a system stack; a web font only with an ADR), a 4 px spacing scale and radius, components and their states, one subsection per screen with a 320 px and a desktop sketch, fields, primary action, empty and error states, navigation and focus order, motion, the manual design checks, and `NEEDS HUMAN` lines for what it could not decide. When UI UX Pro Max is installed at `$HOME/.claude/skills/ui-ux-pro-max/scripts/search.py` it may consult it; the spec is complete without it.

You change line 3 to `Status: approved` and commit; the file is then frozen for every agent, the ux-designer included. The plan names screens by the section 7 names of this file, and a UI slice without an approved spec stops with `NEEDS HUMAN` instead of designing by improvisation.

### Step 2: plan

`/sdlc:plan-slices` runs on opus, refuses a draft, reads the accepted ADRs and `docs/UI-SPEC.md` when present, and writes `docs/PLAN.md` with `Status: draft` on line 3. Each slice looks exactly like this, because `tools/scope.mjs`, the scope guard and the gate parse it:

```
## S1 Customer rules (domain)
**Goal:** one sentence. **Covers:** R-01, R-02, R-03, R-05.
**Files:** `src/domain/customers.js`, `tests/customers.test.js`
```

Domain and storage slices come first, UI after; at most six files per slice; every MUST appears in some slice's `**Covers:**`; a UI slice's steps name the screens by their `docs/UI-SPEC.md` section 7 names, the first UI slice's steps include the `:root` tokens, and a UI slice is marked `NEEDS HUMAN` when the spec is missing or not approved; anything architectural the decisions do not settle is marked `NEEDS HUMAN`. The file ends with `## Decisions needed from the human`: at most three decisions, five lines each, the recommendation first, each naming the ADR to answer in.

Before you see the plan, the skill launches the critic (`agents/critic.md`, fable, read-only; the agent guard refuses it on the planner's model) with a one-line prompt naming the files. The critic runs eight checks on the draft (every MUST covered, a slice too large for one commit, a file on two `**Files:**` lines without a reason, an untestable step, a misread requirement, a contradicted ADR, a UI slice without manual checks, a decision asked that an ADR already answers) and returns `CRI-n` findings as JSON. The session saves the answer to `docs/plan-review/critic.json`, applies every `blocking` finding to the plan, lists the `advisory` ones under `## Decisions needed from the human` as `Critic CRI-n (advisory): ...` (not counted against the limit of three), and tells you the counts in one line.

You answer in the ADR, not in the chat, one line per question under `## Answered`:

```
Q: Where does the app keep its data between sessions?  A (2026-10-26, Ioan): "localStorage, one key per entity"
```

Then tell the session the answers are in; it updates the plan and removes the decided items. Then you change line 3 to `Status: approved` and commit. From then on the plan is frozen: no agent edits it, no slice starts without that line (the builder's spawn and the slice marker are both refused), and a `plan` route from a review means you remove the line, re-plan, approve again.

*Why six files:* beyond that the builder's context fills with code it did not write and the mutation run stops being cheap. *Why the human approves the plan:* a bad plan line causes far more bad code than a bad code line, and a plan is read in two minutes. *Why a critic before the approval:* the human reads the plan once; the critic has already read it against every MUST and every ADR, so what reaches the human is the decisions, not the slips.

### Step 2b: acceptance tests

`/sdlc:write-tests [S1 S3 ...]` launches the tester agent with the Agent tool (opus). It refuses an unapproved plan, reads the requirements, the plan, the ADRs, the domain skill and the skills `profile.mjs tester` lists, and writes one `tests/<area>.spec.mjs` per domain or storage slice (UI slices get manual checks, not specs), one or more tests per requirement, the `R-xx` id first in every title, exact assertions. A spec written before its slice must not turn the gate red for the slices before it, so every spec self-skips until its module exists:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const built = existsSync(new URL('../src/domain/orders.js', import.meta.url));
const skip = built ? false : 'S3 not built yet';
const { orderTotal } = built ? await import('../src/domain/orders.js') : {};

test('R-07 order total sums its lines in integer cents', { skip }, () => {
  assert.equal(orderTotal([250, 199]), 449);
});
```

`node --test` reports `ok 1 - R-07 ... # SKIP S3 not built yet`: the test counts, it is not a pass, and the gate stays green. Once the builder creates the module, `skip` is `false`, the tests run and must pass. `{ skip }` is an option, not `test.skip(`, so the weak-test guard does not fire; the verifier knows the shape and reports it only when the module exists and the test still skips. The specs are the tester's alone: the builder and the main session are refused on them (`Denied: tests/orders.spec.mjs is the tester's test (a .spec file); the builder makes it pass and adds its own tests in a .test file, it never changes or removes the tester's.`). *Why a tester before the builder:* a test the author did not write is the one check the author cannot bend, and the trace sees the `R-xx` titles before any code exists.

### Steps 3 and 4: build

`/sdlc:implement-slice S1` launches the builder agent (sonnet, a fresh context) with the Agent tool; the main session is only the clerk. The builder checks the plan is approved, marks the slice active (`echo S1 > .sdlc/slice`), prints the allowed files with `scope.mjs`, writes the tests first and watches them fail for the right reason, writes the smallest code that passes (the tester's specs for the slice stop skipping and must pass too), adds `- [ ] R-xx: ...` lines and the ten `- [ ] UX: ...` lines to `docs/MANUAL-CHECKS.md` for a UI slice (built against the approved `docs/UI-SPEC.md`; missing or not approved means `NEEDS HUMAN` and stop), runs the gate, and commits in one command: `git add src/domain/customers.js tests/customers.test.js && git commit -m "S1: customer rules (R-01..R-03, R-05)"`. Then `rm .sdlc/slice`. A spec the builder believes wrong goes in its report, red; it never edits it.

While the slice is active you will see the hooks work: after every edit under `src/` or `tests/` a line like `node --test: 11 passed, 2 failed: R-02 rejects an empty name` comes back to the model; an edit outside the slice is refused with `S1 allows src/domain/customers.js, tests/customers.test.js, docs/MANUAL-CHECKS.md. index.html is not in the plan. Stop and ask the human.`; a commit with red tests is refused with `Commit refused: tests: ...` and the gate table; a builder that tries to stop with red tests or uncommitted slice files is sent back once.

`/sdlc:build-slices S2 S3 S4` does the same for the remaining slices in a builder agent with a fresh context, one commit per slice, and stops at the first gate it cannot make green in two attempts, leaving `.sdlc/slice` in place so the state is visible. You fix the cause (or decide the plan was wrong), remove or keep the marker, and restart from the failed slice. *Why `git add` by name:* `git add -A` would stage what the plan did not allow and the gate could not tell; named files are what the gate reads.

### Step 4b: delivery

`/sdlc:setup-delivery` launches the devops agent with the Agent tool (sonnet). It refuses to start while `.sdlc/slice` exists, reads `AGENTS.md`, the ADRs and the skills `profile.mjs devops` lists (the release rules `DR-nn`), finds the default branch with `node <kit>/tools/delivery.mjs branch`, writes `.github/workflows/pages.yml` from `templates/github-workflow-pages.yml` with the one placeholder `__DEFAULT_BRANCH__` filled (no build step; the repository root minus `.git/`, `docs/`, `tests/`, `.github/`, `.githooks/`, `.sdlc/` and `.claude/` is the site; `actions/checkout@v7`, `actions/configure-pages@v6`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`; per-job permissions, a `pages` concurrency group, a ten-minute timeout), checks it back with `delivery.mjs check` (one line per problem, silent when right), computes `Live: https://<owner>.github.io/<repo>/` from `git remote get-url origin` with `delivery.mjs url` (never typed by hand), writes `docs/RUNBOOK.md` from `templates/RUNBOOK.md` (run locally, the CI gate, deployment and where the URL appears, the one setting switched by hand, roll back with `git revert`, logs), and commits both files in one plain-message commit. Those two files are the devops role's alone: the builder and the main session are refused on them. It never runs `gh`, pushes or changes a remote.

You switch the repository's Pages source to GitHub Actions once (Settings > Pages > Build and deployment > Source), then push; the workflow deploys on every push to the default branch. *Why a template and a `check` command instead of a prompt:* a workflow is a file the gate can read; the devops role fills one placeholder and the script says what is wrong, so the action majors, the permissions and the excluded folders are the same in every project.

### Step 5: review

`/sdlc:review-change` turns the main session into a clerk. It runs `review.mjs start` (refused on a dirty tree or an active slice), launches the finders in parallel with the brief the script wrote, saves their JSON to `docs/review/1/finder-<class>.json`, runs `review.mjs check`, launches the verifier with its own brief, saves `verifier.json`, runs `review.mjs render`, commits `docs/review/` and `docs/REVIEW.md`, and replies with one line and the verdict block. The clerk judges nothing.

```
# Review, cycle 1
Reviewed: 3f9c2d1 (main..HEAD, 5 commits)   Date: 2026-10-26
Finders: correctness, security, contract, legal (opus)   Verifier: fable (reported)   Author: sonnet
Gate: GATE PASS, tests 44 passed, 0 failed   Mutations: 196 planted, 195 caught, 1 survived
  survived: src/domain/money.js:14 "<=" -> "<"

## Confirmed (3)
F-01  COR-1  blocking  code  src/domain/lines.js:31  R-12  Unit price has no upper bound; 1e308 * qty gives Infinity cents
      evidence: lines.js:31 multiplies without a bound; input unitPrice=1e308, qty=2 -> Infinity
      route: reopen S3
F-02  VER-1  blocking  code  tests/money.test.js:9  R-15  Planted "<=" -> "<" in money.js:14 survived: no test covers the boundary
F-03  LEG-1  blocking  code  src/storage/customers.js:22  R-07  LD-09  Customer email written to console.log on every save

## Verdict: FIX FIRST
Why: 3 blocking findings confirmed; 1 planted defect survived.
Next: node review.mjs decide --cycle 1 --accept <F-ids> --reject <F-ids> --note "<your words>"
      /sdlc:implement-slice S2 F-02   /sdlc:implement-slice S3 F-01   /sdlc:implement-slice S4 F-03
      then /sdlc:review-change --cycle 2.
```

On `MERGE`, go to step 6. On `FIX FIRST`, record your decision from your own terminal, never from the session (the guard refuses the command to every agent):

```sh
node sdlc/tools/review.mjs decide --cycle 1 --accept F-01,F-02 --reject F-03 --note "F-03 is a theoretical limit"
git add docs/review/1/decisions.json && git commit -m "Review cycle 1: decisions"
```

Then follow the routes: `/sdlc:implement-slice S3 F-01` reopens a slice with its findings (the test that would have caught it first, same files, same gate); a `plan` route means un-approve, re-plan, approve; a `requirement` route is a `Q-nn` you answer in `docs/REQUIREMENTS.md`; a trade-off is an ADR. Then `/sdlc:review-change --cycle 2`, which ends in `MERGE` or `BUDGET: human decision`. There is no cycle 3. *Why two cycles:* the first finds, the second confirms the fixes and catches what the fixes broke; a third is a cost without an owner, so it becomes your decision with a file (ship with the open items listed, or re-plan).

A finished review (`MERGE`, or `BUDGET` at cycle 2) is bound to its commit. When code commits follow it (docs-only commits do not count), the next `/sdlc:review-change` opens a new series at cycle 1: the finished cycles' folders and a copy of `docs/REVIEW.md` move to `docs/review/archive/<series>-<sha7>/`, the scope defaults to `<reviewed sha7>..HEAD` (`--scope` overrides it), and the F-id counter continues, so an F-id is never reused. With no new code after a finished series the script refuses: `Review refused: 3f9c2d1 is reviewed (MERGE) and no code changed since; nothing to review.` The whole stage, finder by finder: [docs/review.md](docs/review.md).

### Step 6: ship

Tick the manual checks you ran in `docs/MANUAL-CHECKS.md` (`- [x] R-20: ...`); no agent ticks them, because the manual checks are the validation step and the author cannot validate its own work. `/sdlc:ship` refuses while a slice is active, runs `gate.mjs --review` (adds the `ci` and `review` lines), writes `docs/TRACE.md` with `trace.mjs --markdown`, prints `manual checks: <listed> listed, <passed> passed`, writes `docs/PR.md` (what, why, how it was verified and validated, open items, decisions; when `.github/workflows/pages.yml` exists the file ends with the output of `node <kit>/tools/delivery.mjs url`, `Live: https://<owner>.github.io/<repo>/`, or the command's reason when it fails), commits the two files and reminds you to run `/cost`. It never pushes, tags or opens a pull request. You push and open the PR; CI runs the same gate with `--strict`, where an unticked manual check, a stale review, an unpinned kit or a surviving planted defect fails the build. A review not at `MERGE` passes `ship` with a warning and fails CI: shipping on `BUDGET` is a decision you take by editing the PR text, not one the kit takes for you.

## What you get at the end

| File | Written by | What it holds |
|---|---|---|
| `docs/REQUIREMENTS.md` | opus, approved by the human | `R-nn [MUST]` or `[LATER]` with acceptance criteria, `A-nn`, `Q-nn`, data model, `Status: approved` (the baseline) |
| `docs/REQUIREMENTS-REVIEW.md`, `docs/requirements-review/` | the clerk and `reqreview.mjs` | the business, domain and legal review as checkboxes the human ticks; the raw JSON |
| `.claude/skills/domain-<area>/SKILL.md` | the human (the AI may draft it once) | the domain: terms, rules `D-nn` with `Why:` and `Source:`, what a reviewer checks |
| `.claude/skills/legal-<area>/SKILL.md` (optional) | the human (the AI may draft it once) | legal rules the kit's three skills do not cover |
| `docs/decisions/ADR-*.md` | the human for ADR-001 and ADR-002; the architect proposes the rest, the human accepts | stack, AI boundaries, every open decision with a `Tags:` line, every answered question under `## Answered`; `Status: accepted` |
| `docs/UI-SPEC.md` | the ux-designer, approved by the human | direction, tokens with contrast ratios, type and spacing scales, components and states, one sketch per screen, navigation, motion, design checks; `Status: approved` |
| `docs/PLAN.md` | opus, approved by the human | slices with `**Covers:**`, `**Files:**`, tests first, steps, verify, risks; the decision package; `Status: approved` |
| `docs/plan-review/critic.json` | the clerk, from the critic | the `CRI-n` findings on the draft plan and the critic's `Checklist:` line |
| `tests/<area>.spec.mjs` | the tester | acceptance tests per requirement, `R-xx` in every title, self-skipping until the module exists; never edited by the builder |
| `docs/MANUAL-CHECKS.md` | the builder lists, the human ticks | `- [ ] R-xx: what to do, what you should see`, the ten `UX:` checks per UI slice |
| `.github/workflows/pages.yml`, `docs/RUNBOOK.md` | the devops role | the GitHub Pages workflow from the kit's template; how to run, check, deploy and roll back |
| `docs/review/<cycle>/` | the clerk and `review.mjs` | briefs, `finder-*.json`, `findings.json`, `verifier.json`, `decisions.json` (human only) |
| `docs/review/archive/<series>-<sha7>/` | `review.mjs start` | the cycles and the `REVIEW.md` of a finished series, moved aside when new code opens the next one |
| `docs/REVIEW.md` | `review.mjs render` | header, confirmed findings with routes, watch list, refuted, trade-offs, checklists, verdict |
| `docs/TRACE.md` | `trace.mjs --markdown` | requirement, title, tests, commits, manual check status |
| `docs/PR.md` | ship | the pull request text with the gate table, the review verdict and the `Live:` URL when Pages is set up |

## What is enforced

Ten hook scripts on nine Claude Code events, one gate with eleven lines, and deny rules in the project's settings. Every sentence below is printed by a script; the file is the source. The full catalog: [docs/guards.md](docs/guards.md).

| Rule | Where it is enforced | What you see when it fires |
|---|---|---|
| Only the slice's files change | scope guard before Edit or Write; the commit guard on shell writes; gate line `scope` | `S3 allows src/domain/lines.js, ... index.html is not in the plan. Stop and ask the human.` |
| Each role writes its own paths | the write matrix from `x-writes` (`slice`, `[]`, or patterns), read by both guards from `agent_type` | `tester writes only tests/**/*.spec.mjs. src/a.js is not among them. Stop and ask the human.` |
| A role's own files are nobody else's | the tester's `.spec.mjs` files and the devops role's `pages.yml` and `RUNBOOK.md` are refused to the builder and to the main session, slice or no slice | `Denied: tests/orders.spec.mjs is the tester's test (a .spec file); the builder makes it pass and adds its own tests in a .test file, it never changes or removes the tester's.` |
| Judges write nothing and spawn nothing | `x-writes: []`, `disallowedTools` in the agent file, both guards, the agent guard | `verifier may not change files or git state; it reads and runs tests (refused: git add).` |
| Approved documents are frozen | scope guard and commit guard on `Status: approved` or `accepted` (also after `Date: ...` on the same line, the ADR template's shape); gate line `contract` from git history | `Denied: docs/PLAN.md is approved (its Status line); changing it is a human decision.` |
| No agent approves anything | the approval line is refused in any write, judged on the file as it would read after the edit | `Denied: docs/PLAN.md would carry "Status: approved", and that line is the human's signature.` |
| Human-only files stay human | `AGENTS.md`, `CLAUDE.md`, `.claude/settings*.json`, `.sdlc/**`, `decisions.json`, an existing domain or legal skill, the kit itself | `Denied: AGENTS.md is a human decision file; the human edits it, you ask.` |
| No HTML sinks, no unfinished work, no debug output, no test that cannot fail | scope guard on the content of the write | `Denied: src/ui/main.js would use innerHTML, which AGENTS.md rule 3 forbids; ...` |
| A document is not wiped by a rewrite | write guard: a Write that shrinks a document under `docs/` by more than 40% | `Denied: this Write would shrink docs/PLAN.md from 120 lines to 16; change it with Edit ...` |
| No secrets read or written | secret guard on Read, Grep, Glob, Edit, Write, Bash (`.env*`, keys, credentials, secret folders, sweeping globs); gate line `secrets` on added lines; deny rules | `Denied: .env looks like a secret; no role reads or writes secrets ...` |
| Tests green | after every edit (hook, reports); before every commit; CI; the runner lists the project's `*.test.*` and `*.spec.*` files itself, so the tester's specs run with the builder's tests | `node --test: 11 passed, 2 failed: R-02 ...`; `Commit refused: tests: ...` and the gate table |
| Every MUST has a test or a manual check | gate line `trace`; CI with `--strict` wants `[x]` | `gate     trace    S3: 7 MUST, 1 missing (R-12), 0 orphan IDs   <- FAIL` |
| Commit message `S<n>: ... (R-xx)` with real IDs | gate line `commit`; `commit-msg` hook | `"fix stuff" must look like S<n>: what changed (R-xx, R-yy)` |
| No dependency sneaks in | commit guard (`npm install`, `npx`); gate line `deps` on lockfiles and manifests; deny rules | `package.json changed; a dependency is a human decision (ADR-001), not a S3 change` |
| The AI never pushes, tags, branches, amends, force-adds or skips the gate | commit guard, every role; deny rules | `Denied: the AI never pushes (ADR-002); the human pushes.` |
| A builder starts only on an approved plan; the verifier never on the author's model; the critic never on the planner's model, and only with a plan to judge | agent guard before every spawn; the slice marker | `Denied: docs/PLAN.md is not approved (no "Status: approved" line); the human approves the plan before anyone builds it.`; `Denied: the critic may not run on opus, the model that wrote the plan (the planner); leave the model unset so the critic's own (fable) applies.` |
| A judge answers JSON; a builder does not stop red or uncommitted | SubagentStop, once per agent | `finder-security: your answer has no JSON the clerk can read. Return the JSON your brief asked for ...` |
| The session does not stop on red tests while a slice is active | Stop hook, once per slice; never when the agent asks the human | `Tests are red while S1 is active ...; finish the slice or revert, then stop.` |
| Content read from files or the web is data, not instructions | injection scan after Read, WebFetch, WebSearch, invisible characters included (advisory) | `the content from docs/BRIEF.md contains 2 sentences shaped like instructions to you ...` |
| The state survives a compaction | SessionStart injects it; PreCompact saves `.sdlc/state.json` | `sdlc state: requirements 25 (21 MUST), approved ... slice S3 active ...` |
| The review is bound to a commit; CI runs the same gate | gate lines `review` and `ci` at ship (warn) and in CI (fail) | `review 3f9c2d1 is 2 commits old (...): re-review needed` |
| The human decides on findings | `review.mjs decide` refused to every agent; `decisions.json` human only | `Denied: review.mjs decide records the human's decision; the human runs it from their own terminal.` |

The guards stop an agent's everyday mistakes and say why; with the deny rules they also hold when a hook is disabled or times out. They are not an OS sandbox: a person who wants around them gets around them, and the audit of the guards lists what a deliberate person can still do.

## Design choices, and why

- **A rule is a script, not a sentence.** A prompt rule holds until the context is long or the model is tired; a hook that exits 2 holds on every call. The kit keeps the enforced set small and names the rule in every denial, so the agent learns the rule from the refusal.
- **Guards fail closed.** A hook that crashes or times out would let the action through by default; the kit sets `onFailure: block` on the four policy guards and writes permission deny rules that Claude Code enforces in every mode. The hooks explain; the deny rules hold.
- **The author never judges; judges never see each other; the verdict is computed.** Self-review agrees with itself (LLM judges prefer their own output, measured repeatedly); reviewers anchor on each other; a reviewer asked to find problems finds some. So: fresh context per judge, parallel finders, a stronger verifier, and `review.mjs` deciding from counted evidence.
- **The verifier is stronger than the author, not merely different.** Studies of cross-model review find the gain comes from capability and diversity together: a weaker second model adds nothing, a stronger one adds a lot. Fable over opus finders over a sonnet builder.
- **Planted defects, because "all tests pass" says nothing about the tests.** A suite that cannot fail is a suite; the only cheap way to know is to break the code and watch. Survivors are findings, each with the exact line and the flipped operator.
- **Two review cycles, then a human.** Finding, fixing, confirming: two. A third cycle loops on diminishing returns at full price, so it becomes a decision with a file. New code after a finished review starts a new series from cycle 1 with the old cycles archived, never a cycle 3.
- **The plan is judged before it is approved, and the acceptance tests are written before the code.** The critic reads the draft against every MUST and every ADR on another model than the planner's; the tester writes the specs the builder must pass and may not edit. Both move the expensive judgement to where a mistake is still a line in a file.
- **Architecture and design are proposals the human accepts.** The architect writes `Status: proposed` and the ux-designer `Status: draft`; the guards refuse them the approving line. A decision nobody typed is a decision nobody remembers.
- **Six files per slice, three open questions, five steps.** Small enough to finish in one fresh context, to review in one sitting, and to answer without a meeting.
- **Approval is a git fact, not a state file.** The baseline check reads the history: the commit that set the Status line is the approval; any later change to the text is a breach; a changed Status line is a new approval. No sidecar file to lose, and CI computes the same answer.
- **Cheap model where the job is specified, strong model where the judgement is.** The builder gets a slice with files and tests decided; the analysis, the plan and the review decide. Spend where it changes the outcome.
- **Fresh context per slice.** Long contexts degrade on every model measured; a builder that starts from the files, not from a conversation, repeats less and drifts less.
- **The human decides in files.** The chat is not a record; a file is. And a file only a human can change is the one thing an agent cannot argue with.

## Against the standards

What a process auditor would map (the clause names are the standard's; the mechanism is the kit's):

| Practice | Standard | In the kit |
|---|---|---|
| Requirements with identifiers, priority and bidirectional traceability | ISO/IEC/IEEE 29148 (5.2.8 attributes, traceability) | `R-nn [MUST]`, `trace.mjs`, gate line `trace` |
| Architecture decisions with rationale | ISO/IEC/IEEE 42010 (6.10 decision and rationale recording) | `docs/decisions/ADR-*.md` with context, decision, consequences, `## Answered` |
| Configuration baselines and change control | ISO/IEC/IEEE 12207 (configuration management) | `Status: approved` frozen by hooks, checked from git history (`contract.mjs`) |
| Security requirements, secure coding, code review, vulnerability-free secrets | NIST SSDF SP 800-218 (PO.1, PW.5, PW.7, PS.1) | ADR-002 rules, the content guard, finder-security, secret guard, gate line `secrets` |
| Independent audit with objective evidence against criteria | ISO 19011 (3.1 audit, 3.10 findings) | finders and verifier: independent by construction, evidence per finding, checklist coverage reported |
| Test documentation and completion evidence | ISO/IEC/IEEE 29119-3 | test titles per requirement, `docs/TRACE.md`, the gate table and mutation line in `docs/REVIEW.md` and `docs/PR.md` |
| Human oversight: understand, override, stop | EU AI Act art. 14(4) (as a design reference; the kit is not a high-risk system) | decisions only in files, `decisions.json` human-only, hooks exit 2 before the tool runs, the agent never pushes |
| Legal compliance as cited rules | OWASP SAMM Governance: Policy and Compliance | `LD/LL/LE` rules with `Source:` articles, machine-validated ids |

Where the kit goes beyond what the standards ask: test adequacy is proven by mutation, not assumed; reviewer independence is enforced by code (tool lists, write matrix, spawn guard), not by procedure; the verdict is a pure function of evidence; one quality gate runs identically in three places; the review is bound to a commit with a staleness check; prompt injection and secrets are guarded on the agent's own inputs; the rework budget is capped and the cap is a human decision.

Two words the kit uses in the standards' sense: the agents *verify* (against the requirements); the human's manual checks *validate* (against the intended use); and what the finders and the verifier do is an *audit* in ISO 19011 terms, which the kit calls a review because that is what a developer calls it. The frozen set of approved documents is a *baseline*; the gate line that checks it is named `contract` for now.

## Compared with other kits

| | sdlc | spec-kit | Kiro specs | BMAD | superpowers | GSD |
|---|---|---|---|---|---|---|
| Spec before code | yes, with IDs | yes | yes (EARS) | yes | yes | yes |
| Human approval gates | files, enforced | convention | review-gated | convention | convention | prompts |
| Who may change which files | hook-enforced per slice and role | nobody checks | nobody checks | nobody checks | convention | worktree guard |
| Review independence | fresh judges, stronger verifier, no self-review, by code | none | none | role prompts | two-stage review by subagents | plan-checker, verifier |
| Test adequacy | mutation testing in CI | none | none | none | TDD discipline | Nyquist checks |
| Business, domain, legal roles with their rules in files | yes | no | no | roles as prompts | no | no |
| Rules enforced by scripts | hooks + git hooks + CI, fail closed | no | no | no | no | hooks (mostly advisory) |

The axis the kit optimises is the last row: every other kit relies on the model following the text. sdlc borrowed its phase loop and verifier shape from GSD and its contract-then-build, independent-lenses and fresh-context verification from Athanor, and put a script under each.

## Business, domain and legal roles

Building software is not only implementation. A team has someone who understands the business flow (a product owner), someone who knows the domain (for an invoice app: how invoicing and accounting work), and someone who knows which law the app must not break. The AI knows code; it does not know your business, and asked to "think like an accountant" or "is this GDPR compliant" it will answer, confidently and wrong. So the kit has those three roles, and the knowledge they use is visible, not buried in a prompt:

- `agents/product-owner.md` checks the business flow before any code: who uses the app and for what, the main flows end to end, priorities, acceptance criteria a user can observe, the business's empty and error states, what the brief implies and the requirements dropped. It returns `PO-n` items with the text to add or change, in the file's own format.
- `agents/domain-expert.md` checks each requirement and the data model against the domain rules, and only against them. The rules live in a project skill, `.claude/skills/domain-<area>/SKILL.md` (shape in `templates/domain-skill.md`): terms, `### D-nn <rule>` headings with `Why:` and `Source:`, what a reviewer checks. The human writes or validates it: the AI may draft it, the human signs it, and once the file exists the guards refuse it to every agent, like an ADR. Without that file the role returns `Blocked` and nothing else: the kit never invents domain rules. `agents/finder-domain.md` applies the same rules to the code in the review.
- `agents/legal.md` checks the requirements and the data model against legal rules, and `agents/finder-legal.md` checks the code against the same rules. The rules live in three skills the kit ships, because they apply to most software: `skills/legal-data-protection/SKILL.md` (GDPR, `LD-nn`), `skills/legal-licenses/SKILL.md` (`LL-nn`), `skills/legal-e-invoicing/SKILL.md` (`LE-nn`, Directive 2006/112/EC, EN 16931). Every rule has a `Why:`, a `Source:` that links the article or the licence text, and an `Applies to:` line. A project adds rules in `.claude/skills/legal-<area>/SKILL.md`. None of it is legal advice: the role points at a rule and its source, the human ticks, decides and, when it matters, asks a lawyer.

All three roles are judges: they read and return JSON, the scripts validate it, the human ticks or decides. The domain and the law live in files separate from the agents so they can be read, reviewed and changed on their own, and so the same rules bind the requirements, the builder and the review.

## UI and UX

The UI follows a design discipline the kit did not invent: `skills/ui-ux/SKILL.md` is adapted from UI UX Pro Max by nextlevelbuilder (https://github.com/nextlevelbuilder/ui-ux-pro-max-skill, MIT), reduced to what a small plain-JavaScript app needs. It holds ten priority categories as a checklist (accessibility, touch targets, mobile-first layout, 16 px text and semantic color tokens, labels and errors next to the field, empty and error states, predictable back, short motion that respects reduced motion, SVG icons, no layout shift), the design system a UI slice applies (every design value a custom property in the `:root` block of `styles.css`, a type scale and a system font stack, a 4 px spacing rhythm, components with their variants and hover, focus-visible, active and disabled states, data-table density, 320 px first, motion that respects reduced motion) and the ten `- [ ] UX: ...` manual checks a UI slice adds to `docs/MANUAL-CHECKS.md` (six UX, four design: tokens only, states present, type and spacing scales respected, screens match the spec). The skill activates itself when a file under `src/ui/`, `index.html` or `styles.css` is touched.

The design itself comes from `docs/UI-SPEC.md`, written by `/sdlc:design-ui` through the ux-designer agent (`templates/UI-SPEC.md`: product and audience, visual direction and why, color tokens with the WCAG ratio next to every pair, typography, spacing and radius, components and states, one subsection per screen with a 320 px and a desktop sketch, navigation and focus order, motion, manual design checks) and approved by the human. The plan names screens by their section 7 names; the builder reads the spec with the UI rules before the first UI slice and copies its tokens into `:root`; a UI slice without an approved spec stops with `NEEDS HUMAN`. The style decision lives in the approved spec, not in an ad hoc ADR. A UI slice committed without its checks is an advisory `contract` finding (item 10); a UI slice that departs from the spec (a raw color outside `:root`, a component state without a rule, a screen laid out differently from its sketch) is another (item 11). A UX finder is not shipped yet; until it is, the design checks are advisory items of `finder-contract`.

## This repository

The app around this folder was built with this plugin from `docs/BRIEF.md`; the root `README.md` tells how, and `docs/` holds every artefact the steps below describe.

## Works outside Claude Code

- `AGENTS.md` is read by Copilot, Cursor and most agents. The hooks and the `.sdlc/slice` marker are Claude Code only: another tool gets the git hooks, the deny rules' intent and CI.
- The skills and the agent files are plain Markdown with frontmatter: another tool can read them as prompts and the finder checklists as review checklists.
- The git hooks, the CI workflow, `gate.mjs`, `mutate.mjs`, `contract.mjs` and `review.mjs` run with plain Node; no Claude involved.
- Requirement IDs in test titles and commit messages, typed findings as JSON, `Reviewed: <sha>` in the review, `Status: approved` as a baseline: conventions any tool can follow.

## Layout

```
.claude-plugin/plugin.json      the plugin manifest (name, version, license)
skills/<name>/SKILL.md          the eleven commands: write-requirements, review-requirements, decide-architecture,
                                design-ui, plan-slices, write-tests, implement-slice, build-slices, setup-delivery,
                                review-change, ship; the knowledge skills: ui-ux, legal-data-protection, legal-licenses,
                                legal-e-invoicing, discipline-* (eight), stack-javascript
agents/*.md                     builder, architect, ux-designer, tester, devops, critic, product-owner, domain-expert,
                                legal, finder-correctness, finder-security, finder-contract, finder-domain, finder-legal,
                                verifier
hooks/hooks.json                SessionStart, PreCompact, UserPromptSubmit, PreToolUse (secret, scope, commit,
                                agent guards), PostToolUse (tests after edit, injection scan), SubagentStop, Stop
tools/*.mjs                     gate, scope, trace, mutate, review, reqreview, contract, delivery, profile, state, roles,
                                the ten hook scripts
templates/                      AGENTS.md, ADR.md, UI-SPEC.md, RUNBOOK.md, domain-skill.md, legal-skill.md, githooks/,
                                github-workflow-gate.yml, github-workflow-pages.yml
docs/                           concepts.md, flow.md, guards.md, review.md
```

## Validation

```sh
claude plugin validate sdlc    # manifest, skills, agents and hooks
node sdlc/tools/gate.mjs       # the gate on the working tree; --strict is what CI runs
```

## License

MIT, see [LICENSE](../LICENSE).
