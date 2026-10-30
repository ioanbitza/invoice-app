# The flow, one section per step

Each section says what the step takes as input, what the skill does (from its `SKILL.md`), what it writes, what the human does next, and the exact next command. The skills live in `skills/<name>/SKILL.md`; the kit root inside a skill is `${CLAUDE_PLUGIN_ROOT}`.

## Step 0: the gate's installation

**Input.** A git repository with the plugin in `sdlc/`.

**What it is.** Three files committed with the project, not a command: `.githooks/pre-commit` runs `node sdlc/tools/gate.mjs --staged` and `.githooks/commit-msg` runs the same script on the message, so any tool and any human on the machine goes through the gate; `.github/workflows/gate.yml` runs `node sdlc/tools/gate.mjs --strict` on every push and pull request; `.claude/settings.json` holds the permission deny rules of [guards.md](guards.md). `.gitignore` lists `.sdlc/`, the folder of the slice marker and the session state.

**The human.** Once per clone: `git config core.hooksPath .githooks`. It is local git configuration, so a fresh clone sets it or nothing fires.

**Next.** `/sdlc:write-requirements docs/BRIEF.md`

## Step 1: `/sdlc:write-requirements <brief>`

**Input.** A brief, as a file path or pasted text; `AGENTS.md`; every file in `docs/decisions/`. Decisions already taken there are not open questions. Model: opus.

**What it does.** Separates what the brief says, implies and leaves open (three bullets at the top). Writes requirements as `### R-01 [MUST] Short title`, one behaviour each, one to three acceptance criteria, IDs `R-01` to `R-99` in one sequence; `[LATER]` for what is out of scope now. Lists assumptions `A-01`... for every choice the brief did not state. Lists open questions `Q-01`..., at most three open at a time, only the ones that change the design, each with the recommended answer first; more than three real questions: the three that block the first slices stay questions, the rest become assumptions marked `(to confirm)`. Sketches the data model (entities, fields, types, relations, how IDs are made). Puts `Status: draft` on the third line. Does not create `docs/MANUAL-CHECKS.md`; that appears with the first UI slice. Then stops and lists the open questions, one line each. No plan, no code. The whole file must be readable in three minutes.

**Writes.** `docs/REQUIREMENTS.md`; a brief pasted in the chat is saved first as `docs/BRIEF.md`, so the reviewers of step 1b read the same words.

**The human.** Answers the `Q-nn` in the chat; the skill folds each answer into the file (an answered question becomes a requirement or an assumption) and says the file is ready. The human changes the third line to `Status: approved` and commits the file. From then on the scope guard refuses every agent edit to it: `docs/REQUIREMENTS.md is approved, changing a requirement is a human decision; the human edits it, you ask.`

**Next.** `/sdlc:review-requirements` (optional, recommended), then `/sdlc:decide-architecture`.

## Step 1b: `/sdlc:review-requirements [docs/REQUIREMENTS.md]`

**Input.** The requirements file, draft or approved (`docs/REQUIREMENTS.md` by default); `docs/BRIEF.md`, `AGENTS.md`, `docs/decisions/*.md`; every `.claude/skills/domain-*/SKILL.md` when one exists; the kit's legal skills under `skills/legal-*/SKILL.md` and every project `.claude/skills/legal-*/SKILL.md`. No slice may be active. The main session is the clerk; the roles are `agents/product-owner.md`, `agents/domain-expert.md` and `agents/legal.md` (opus, read-only, `x-writes: []`). The skill has `disable-model-invocation: true`, so only the human starts it.

**What it does.** The six steps of the skill:

1. `node "${CLAUDE_PLUGIN_ROOT}/tools/reqreview.mjs" start $ARGUMENTS`. Refused in one sentence when the file does not exist (`run /sdlc:write-requirements first`) or a slice is active. Otherwise prints the run number, the file with its `Status:` (and `uncommitted` when the file has changes git does not know), the roles to launch (`product-owner` always; `domain-expert` only when a domain skill exists; `legal` always, because the kit ships its legal skills), the domain skill paths or `none`, the legal skill paths (`sdlc/skills/legal-data-protection/SKILL.md`, `sdlc/skills/legal-e-invoicing/SKILL.md`, `sdlc/skills/legal-licenses/SKILL.md`, then any project one), and writes `docs/requirements-review/brief.txt`: what to read and in what order, the legal skills by full path with their rule ids, the JSON shape, the checklists, and on a later run where to start numbering.
2. Launches the roles in parallel, in one message, with the Agent tool: `sdlc:product-owner`, `sdlc:domain-expert`, `sdlc:legal`; each prompt is the text of `brief.txt`. Saves each answer verbatim to `docs/requirements-review/<role>.json`.
3. `reqreview.mjs check`. Validates every item: `id` in the role's prefix and unique (`PO-n`, `DOM-n`, `LEG-n`; a later run numbers after the earlier ones), `kind` one of `missing`, `wrong`, `priority`, `unclear`, `risk`, `severity` `blocking` or `advisory`, `requirement` `none` or an id the file defines, `title`, `why`, `suggested` strings, `proven` boolean, for a `DOM` item a `rule` the domain skill defines, and for a `LEG` item a `rule` one of the legal skills defines (`LD-nn`, `LL-nn`, `LE-nn`, or a project skill's `L?-nn`). `[]` needs the `Checklist:` line or a `Blocked:` line. One `RE-ASK <role>: <problem>` line per unusable answer; the clerk re-asks once with the problem named. Writes `items.json`.
4. `reqreview.mjs render`. Writes `docs/REQUIREMENTS-REVIEW.md`: `# Requirements review, run <n>`, `Reviewed: <sha> (<file>, Status: <status>)   Date: <date>`, `Roles: <roles> (<model>)   Domain skills: <paths or none>   Legal skills: <paths>`, then `## Items (<total>: <blocking> blocking, <advisory> advisory)` with one checkbox per item, blocking first, `- [ ] PO-1  blocking  missing  R-07  <title>` (a `DOM` or `LEG` item shows its rule after the requirement) with `why:` and `suggested:` indented under it, `## Checklists` (one line per role, `Blocked:` when the role said so) and `## Next`.
5. `git add docs/requirements-review docs/REQUIREMENTS-REVIEW.md && git commit -m "Requirements review"`.
6. Replies with one line: the run, the hash and the counts.

**Writes.** `docs/requirements-review/state.json`, `brief.txt`, `product-owner.json`, `domain-expert.json`, `legal.json`, `items.json`, and `docs/REQUIREMENTS-REVIEW.md`.

**The human.** Ticks the items to accept (`- [x]`); an untouched item is rejected. Says `Fold the ticked items of docs/REQUIREMENTS-REVIEW.md into docs/REQUIREMENTS.md`. On a draft the session folds each ticked item in with its `suggested` text (a `missing` item becomes a `### R-nn` heading with criteria, a `wrong` or `unclear` item changes a criterion, a `priority` item moves the scope, a `risk` item becomes an `A-nn` or a `Q-nn`); then the human sets `Status: approved` and commits. On an approved file the fold-in is the human's own edit: the scope guard refuses the file to every agent, and the session may only show the text to paste. A second run later numbers its items after the first (`PO-6`, `DOM-3`, `LEG-2`), so an id names one item forever. A `LEG` item is not legal advice: it names a rule and its source; the human decides by ticking, and asks a lawyer when the stake is real.

**Next.** `/sdlc:decide-architecture`

## Step 1c: `/sdlc:decide-architecture`

**Input.** `docs/REQUIREMENTS.md` with `Status: approved` (nothing is proposed on a draft), `docs/BRIEF.md` when it exists, `AGENTS.md`, every `docs/decisions/ADR-*.md`, `templates/ADR.md`, and the skills `node "${CLAUDE_PLUGIN_ROOT}/tools/profile.mjs" architect` lists (with no tags yet, only the always-on ones). Model: opus, in the `architect` agent (`agents/architect.md`, launched with the Agent tool, `x-writes: [docs/decisions/ADR-*.md]`, `maxTurns` 60), fresh context. The skill has `disable-model-invocation: true`.

**What it does.** Lists the decisions the requirements leave open and the plan needs (stack and runtime, module layout and layering, persistence and schema versioning, navigation, money and validation, anything the brief forces) and drops what an existing ADR settles. Writes one ADR per open decision with the Write tool, numbered after the highest existing one (`ADR-004-...` after `ADR-003`), in the template's shape: the status after the date on one line (`Date: 2026-10-30. Status: proposed. Author: architect (proposed).`), a `Tags:` line (for a plain browser app `javascript, node, browser, localstorage, web-ui, storage`), Context, Decision, Consequences, Not decided here, an empty `## Answered`. Runs `profile.mjs` again and adds a tag when a skill the project needs is still off. What a requirement contradicts goes under `## Not decided here` with the requirement id; the architect decides nothing against the requirements.

The scope guard lets the architect create an ADR or edit one still `Status: proposed`, slice or no slice (own paths are slice-independent); an accepted ADR is a human decision file, the line `Status: accepted` is the human's signature, and every other path is refused: `architect writes only docs/decisions/ADR-*.md. src/domain/x.js is not among them. Stop and ask the human.` When a write is denied the agent stops and reports; it does not look for another way in.

**Writes.** `docs/decisions/ADR-<nnn>-<topic>.md`, one per decision, `Status: proposed`.

**The human.** Reads each file, changes `Status: proposed` to `Status: accepted` (and may replace the author), commits. From that commit the ADR is a contract document: the gate's `contract` line watches it like the plan. An accepted ADR's tags switch the discipline and stack skills on for the planner, the tester, the builder, the devops role and the reviewers (`node "${CLAUDE_PLUGIN_ROOT}/tools/profile.mjs"` shows them).

**Next.** `/sdlc:design-ui` when the app has a screen, else `/sdlc:plan-slices`.

## Step 1d: `/sdlc:design-ui`

**Input.** `docs/BRIEF.md`, `docs/REQUIREMENTS.md` with `Status: approved` (otherwise `Blocked: docs/REQUIREMENTS.md is not approved; the human approves the requirements before the interface is designed.`), `AGENTS.md`, `docs/decisions/*.md`, the kit's `skills/ui-ux/SKILL.md` (the checklist, the design-system section with the token names the builder expects, the manual checks) and `templates/UI-SPEC.md`. Model: opus, in the `ux-designer` agent (`agents/ux-designer.md`, `x-writes: [docs/UI-SPEC.md]`, `maxTurns` 60), fresh context. No argument. The skill has `disable-model-invocation: true`.

**What it does.** Writes `docs/UI-SPEC.md` with `Status: draft` on line 3, in the template's sections: 1 product and audience; 2 visual direction (the style and why it fits); 3 color tokens with the WCAG contrast ratio next to every text and background pair (4.5:1 for text, 3:1 for large text and borders); 4 typography (a system stack with fallbacks; a web font only with an ADR); 5 spacing on a 4 px base and radius; 6 components and their states; 7 screens, one subsection per screen with a 320 px and a desktop sketch, the fields, the primary action, the empty and error states (the plan's UI slices cite these screen names); 8 navigation and focus order; 9 motion; 10 manual design checks; and `NEEDS HUMAN` lines for what it could not decide, each with a recommendation. When UI UX Pro Max is installed at `$HOME/.claude/skills/ui-ux-pro-max/scripts/search.py` it may run it (`--design-system`, then `--domain color`, `--domain typography`, `--domain style`, one question each); its answer is input, every value and reason is written in the spec. An existing draft is revised in place; an approved spec stops the agent (`Blocked: docs/UI-SPEC.md is approved; the human removes the Status line to re-design`).

The scope guard lets the ux-designer create and revise `docs/UI-SPEC.md` while it is a draft and refuses `styles.css`, `index.html`, `docs/PLAN.md`, an ADR and every other path; it never writes `Status: approved`.

**Writes.** `docs/UI-SPEC.md`.

**The human.** Reads the spec, answers the `NEEDS HUMAN` lines in the file, changes line 3 to `Status: approved` and commits. From then on the file is frozen for every role, the ux-designer included (the scope guard refuses it like the plan, the `contract` line watches it). `node "${CLAUDE_PLUGIN_ROOT}/tools/state.mjs"` prints `ui spec docs/UI-SPEC.md, draft` or `approved`.

**Next.** `/sdlc:plan-slices`

## Step 2: `/sdlc:plan-slices`

**Input.** `docs/REQUIREMENTS.md` with `Status: approved` (the skill refuses a draft), `AGENTS.md`, `docs/decisions/*.md` (accepted), the skills `profile.mjs planner` lists, and `docs/UI-SPEC.md` when it exists. Model: opus; then the `critic` agent (`agents/critic.md`, fable, `x-writes: []`, `maxTurns` 60) on the draft.

**What it does.** Writes `docs/PLAN.md`, no code. The format is a contract parsed by the scope guard, the commit gate and `tools/scope.mjs`:

```
## S1 Customer rules (domain)
**Goal:** one sentence. **Covers:** R-01, R-02, R-03, R-05.
**Files:** `src/domain/customers.js`, `tests/customers.test.js`
```

Headings `## S<n> <title>` numbered from S1 with no gaps. `**Covers:**` lists the IDs the slice implements or shows on screen (ranges as `R-11..R-17`; a UI slice may say `**Covers on screen:**`). `**Files:**` is one line, every path in backticks, comma separated, relative to the repository root, at most six; `docs/MANUAL-CHECKS.md` is allowed in every slice and never listed. Each slice also has **Tests first** (titles starting with the requirement ID), **Steps** (at most five; in a UI slice they name the screens by the section 7 names of `docs/UI-SPEC.md`, and the first UI slice's steps include the `:root` tokens of `styles.css` from the spec), **Verify** (commands, the manual checks for UI requirements, and for a UI slice the ten `- [ ] UX: ...` checks of `skills/ui-ux/SKILL.md`: six UX, four design), **Risks**. Rules: domain and storage first, UI after; every MUST in at least one `**Covers:**`; any architectural choice the decisions do not mention is marked `NEEDS HUMAN` and not decided; when the app has a screen and `docs/UI-SPEC.md` is missing or not approved, every UI slice is marked `NEEDS HUMAN: docs/UI-SPEC.md missing or not approved; run /sdlc:design-ui and approve it before this slice`. The file ends with `## Decisions needed from the human`, mandatory even when it says `none`: at most three decisions, each at most five lines, the recommendation first, then the alternative and its cost, in plain words for the person who owns the product, each naming the ADR to answer in.

Then the critic judges the draft before the human sees it: the skill launches `sdlc:critic` with the Agent tool, model unset (the agent guard refuses the critic on the planner's model, and refuses it when there is no `docs/PLAN.md` to judge), with a one-line prompt naming `docs/PLAN.md`, `docs/REQUIREMENTS.md`, `docs/decisions/ADR-*.md` and `AGENTS.md`. The critic runs eight checks (every MUST in some `**Covers:**`; a slice too large for one commit; a file on two `**Files:**` lines without a reason; a step no test or manual check covers; a requirement misread; an accepted ADR contradicted; a UI slice without manual checks; a decision asked that an ADR already answers) and returns a JSON array of `{ "id": "CRI-n", "severity": "blocking|advisory", "slice": "S3|none", "what", "why", "fix" }` plus `Checklist: items 1-8 ran; fired: ...; not run: none`. The session saves the answer verbatim to `docs/plan-review/critic.json` with the Write tool (re-asked once when there is no JSON array), applies every `blocking` finding to the plan (the `fix` is written in the plan's own terms: a Covers id, a Files path, a test title), lists every `advisory` one under `## Decisions needed from the human` as `Critic CRI-n (advisory): <what>; <fix>` without counting it against the limit of three, tells the human the counts in one line, and then stops and shows the package in under ten lines.

**Writes.** `docs/PLAN.md`, with `Status: draft` on its third line; `docs/plan-review/critic.json`.

**The human.** Answers each decision in `docs/decisions/ADR-*.md` under `## Answered` with the line `Q: <question>  A (<date>, <name>): "<exact words>"`. Nothing said in the chat counts. Then tells the session; it updates the plan to match and removes the decided items from the package. Then the human changes the third line to `Status: approved` and commits: from that commit on the plan is the baseline. The guards refuse every agent edit to it, the gate's `contract` line fails when its text differs from the approving commit, and nothing builds before that line exists (the agent guard refuses to spawn the builder, the commit guard refuses the slice marker). To re-plan later the human removes the line first, runs the skill again, and approves the new plan; the re-approval is the commit that changes the Status line again. Why a git fact and not a state file: CI computes the same answer as the terminal, and there is nothing to lose or to edit by hand.

**Next.** `/sdlc:write-tests`

## Step 2b: `/sdlc:write-tests [S<n> S<m> ...]`

**Input.** The slice ids to cover (empty means every domain and storage slice of the plan). `docs/PLAN.md` and `docs/REQUIREMENTS.md`, both `Status: approved` (the skill stops otherwise: tests are written against a frozen plan, so the builder and the tester read the same contract), `AGENTS.md`, every `docs/decisions/ADR-*.md`, `.claude/skills/domain-*/SKILL.md` when it exists, and the skills `profile.mjs tester` lists. Model: opus, in the `tester` agent (`agents/tester.md`, `x-writes: [tests/**/*.spec.mjs]`, `maxTurns` 80), fresh context. The skill has `disable-model-invocation: true`.

**What it does.** For each slice in scope that is not a UI slice (no file under `src/ui/`, no `index.html`, no `styles.css` on its `**Files:**` line) it notes the `**Covers:**` ids, the module paths and the titles under **Tests first**, and writes `tests/<area>.spec.mjs` with the Write tool (`<area>` the slice's subject: `customers`, `orders`, `storage`), one or more tests per requirement, the `R-xx` id first in every title, exact assertions (`assert.equal`, `assert.deepEqual`, `assert.throws` with a message or class), imports from the plan's paths only. Every spec starts with the self-skip:

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

A static `import` of a missing module would throw at load and turn the whole gate red for the slices before `S3`; the `existsSync` check and the dynamic import keep the file loadable, and `{ skip }` becomes `false` the moment the module exists, so from then on these are ordinary tests the builder has to make pass. `node --test` reports a skipped test as `ok 1 - R-07 ... # SKIP S3 not built yet`: it counts as a test, never as a pass, and the trace sees the `R-xx` title while nothing is claimed green. `{ skip }` is an option, not `test.skip(`, so the content guard does not fire. Then `node --test tests/<area>.spec.mjs` per file (it loads, every test skips or runs green) and `node "${CLAUDE_PLUGIN_ROOT}/tools/trace.mjs" --listed` (every covered requirement shows `test: <area>.spec.mjs`). The scope guard allows the tester `tests/**/*.spec.mjs` at any depth and nothing else, not even `docs/MANUAL-CHECKS.md`; the content rules (`test.skip`, `.only(`, `assert.ok(true)`) bind it too.

**Writes.** `tests/<area>.spec.mjs`, one per slice covered. Report: one `Written:` line per file with the slice, the ids and the count, `Not covered by a spec:` for the UI requirements, the trace totals.

**The human.** Nothing to approve: the specs are the builder's acceptance bar. The builder and the main session are refused on them (`Denied: tests/orders.spec.mjs is the tester's test (a .spec file); the builder makes it pass and adds its own tests in a .test file, it never changes or removes the tester's.`); when a spec is wrong, the human asks the tester to change it. The gate, the hooks and `mutate.mjs` run the specs with the builder's `.test.*` files: the runner lists the project's test files itself (`*.test.*`, `*.spec.*`, `test-*.js`, `*-test.js`, everything under a `test/` folder; `node_modules`, `.git` and hidden folders skipped), because Node's default patterns do not include `*.spec.*`. The tester writes flat `tests/<area>.spec.mjs`: `trace.mjs` reads the top level of `tests/` only.

**Next.** `/sdlc:implement-slice S1`

## Step 3: `/sdlc:implement-slice S<n> [F-xx ...]`

**Input.** The slice id, and on a reopen the review findings to fix. `docs/PLAN.md`, `docs/REQUIREMENTS.md`, `AGENTS.md`, the tester's specs for the slice, and for a UI slice `docs/UI-SPEC.md` with `Status: approved`. Model: sonnet, in the main session.

**What it does.** Checks that `docs/PLAN.md` carries `Status: approved` and stops if not (the human approves the plan before anyone builds it). Then `mkdir -p .sdlc && echo S<n> > .sdlc/slice` (the commit guard refuses the marker on an unapproved plan or while another slice is active), then `node "${CLAUDE_PLUGIN_ROOT}/tools/scope.mjs" S<n>` to print the allowed files. Reads the slice and its requirements; before a UI slice (files under `src/ui/`, `index.html`, `styles.css`) reads `${CLAUDE_PLUGIN_ROOT}/skills/ui-ux/SKILL.md` with `cat` together with `docs/UI-SPEC.md` (its tokens go into `:root` of `styles.css` as written, its section 7 is the layout of every screen; missing or not approved means `NEEDS HUMAN` and stop before the UI files), and before a domain or storage slice the project's `.claude/skills/domain-*/SKILL.md` when one exists. Writes a three-line start note (what will change, what it assumes). Tests first for domain and storage: write them, run `node --test`, confirm they fail for the right reason (a missing module or a wrong value, not a syntax error). Writes the smallest code that passes; the tester's spec for the slice stops skipping once the module exists and must pass too, next to the builder's own `.test.*` tests, and the builder never edits a spec (the guard denies it); a spec it believes wrong goes in the report, red. For a UI slice adds `- [ ] R-xx: ...` lines and the ten `- [ ] UX: ...` lines (six UX, four design) to `docs/MANUAL-CHECKS.md`, unticked (a `UX:` line carries no requirement id; `trace.mjs` counts it neither as a requirement nor as an orphan). `git status` must show only planned files. Runs `node "${CLAUDE_PLUGIN_ROOT}/tools/gate.mjs"`. Stages by name and commits in one command: `git add src/domain/lines.js tests/lines.test.js && git commit -m "S3: lines and totals (R-11..R-13)"`; the subject starts with `S<n>`, the IDs are the slice's `**Covers:**`. `git add -A`, `git add .` and `git commit -a` are refused: the hook must see the files. Then `rm .sdlc/slice`, which the guard allows only once the tests are green and the slice's files are committed; otherwise the marker stays and the human closes the slice. Reports in five lines: what changed, which tests ran, the commit hash, what it was unsure about.

On a reopen (`S3 F-01 F-02`): reads the findings in `docs/REVIEW.md`, only the ones the human accepted in `docs/review/<cycle>/decisions.json`; for each, first the test that would have caught it (it must fail now), then the smallest fix inside the slice's files; the commit names them: `S3: fix F-01, F-02 (R-12, R-15)`. Findings routed elsewhere (plan, requirement, ADR) are not touched.

When a guard denies something, the sentence says which slice is active, which files are allowed and what to do. The skill does not retry another way and does not widen the slice in `docs/PLAN.md`; it stops and tells the human.

**Writes.** The slice's files, `docs/MANUAL-CHECKS.md` for a UI slice, one commit.

**The human.** Reads the report. Checks the browser for a UI slice.

**Next.** `/sdlc:build-slices S2 S3 S4` (or `implement-slice` again, one at a time).

## Step 4: `/sdlc:build-slices S<n> S<m> ...`

**Input.** The slice ids in order. Model: sonnet, in the `builder` agent (`agents/builder.md`, one fresh builder per slice launched with the Agent tool, `x-writes: slice`), which starts with no memory of any conversation.

**What it does.** Reads `AGENTS.md`, `docs/REQUIREMENTS.md`, `docs/PLAN.md`, the skills `profile.mjs builder` lists and the domain skill once, the UI rules with the approved `docs/UI-SPEC.md` before the first UI slice (missing or not approved: `NEEDS HUMAN` and stop before the UI files), then runs the step 3 loop for each slice in order: marker, scope, tests first, smallest code (the tester's specs for the slice must pass; the builder never edits them), manual checks for UI (`R-xx:` and the ten `UX:` lines), `git status`, gate, `git add <file> <file> && git commit -m "S<n>: <what changed> (R-xx, R-yy)"`, `rm .sdlc/slice`. **Stop rule:** if the gate fails and cannot be made to pass inside the slice's files within two attempts, the builder stops, does not continue to the next slice, does not touch files outside the slice, does not weaken a test, leaves `.sdlc/slice` in place so the state is visible, and reports.

**Writes.** One commit per slice. The report is one line per slice:

```
S2  done   a1b2c3d  12 tests green
S3  done   d4e5f6a  21 tests green
S4  FAILED gate: tests 1 failed: R-20 invalid JSON ...  (files left uncommitted, .sdlc/slice = S4)
S5  not started
```

followed by two lines: what it was unsure about, and what the human should check in the browser.

**The human.** On a failure: reads the gate reason, fixes the cause (often a plan or requirement question), removes or keeps the marker, and restarts from the failed slice. Ticks nothing yet.

**Next.** `/sdlc:setup-delivery` for a static browser app, then `/sdlc:review-change`.

## Step 4b: `/sdlc:setup-delivery`

**Input.** No active slice (the skill stops and names the open slice otherwise: a slice commit may hold only the slice's files). `AGENTS.md`, `docs/decisions/*.md` (an ADR that names another host than GitHub Pages or a build step stops the skill: it deploys static files as they are), the skills `node "${CLAUDE_PLUGIN_ROOT}/tools/profile.mjs" devops` lists (the release rules `DR-nn`), `templates/github-workflow-pages.yml`, `templates/RUNBOOK.md`, and an `origin` remote on github.com (no origin: stop, the human adds the remote first). Model: sonnet, in the `devops` agent (`agents/devops.md`, `x-writes: [.github/workflows/pages.yml, docs/RUNBOOK.md]`, `maxTurns` 40), fresh context. The skill has `disable-model-invocation: true`.

**What it does.** `node "${CLAUDE_PLUGIN_ROOT}/tools/delivery.mjs" branch` prints the default branch (`origin/HEAD`, else the current branch, else `main`; the report says which was used). The agent writes `.github/workflows/pages.yml` from the template with the Write tool, replacing the one placeholder `__DEFAULT_BRANCH__` and changing nothing else: on push to the default branch; job `deploy` with `timeout-minutes: 10`, per-job `permissions` (`contents: read`, `pages: write`, `id-token: write`), `concurrency: group: pages`, `environment: github-pages`; steps `actions/checkout@v7`, an rsync copy of the repository root into `$RUNNER_TEMP/site` excluding `.git/`, `docs/`, `tests/`, `.github/`, `.githooks/`, `.sdlc/` and `.claude/`, `actions/configure-pages@v6`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`; no build step. `delivery.mjs check` reads the workflow back and prints one line per problem (a placeholder left, no push trigger or branch, no `pages` concurrency group, no timeout, a permission missing or granted workflow-wide, an action not used or pinned to a branch or `latest`, a kit folder not excluded, a build step); silent and exit 0 when right. `delivery.mjs url` prints `Live: https://<owner>.github.io/<repo>/` from `git remote get-url origin` (https, ssh and scp forms; an `<owner>.github.io` repository gets the root URL); the URL is never typed by hand. Then `docs/RUNBOOK.md` from the template, with `__DEFAULT_BRANCH__` and `__PAGES_URL__` filled: run locally (`python3 -m http.server 8000`), the CI gate (`gate.yml` from init, `--strict`; the devops role never edits it), deployment to GitHub Pages (what is excluded, where the URL appears: the Actions run, the `github-pages` environment, Settings > Pages), the one setting switched by hand, roll back (`git revert <sha>` and a push by the human; the workflow redeploys; `Last rehearsal: not yet`, DR-09), logs. `git status --short` must show the two files only; the gate runs; one commit: `git add .github/workflows/pages.yml docs/RUNBOOK.md && git commit -m "Delivery: GitHub Pages workflow and runbook"` (no slice, so a plain message passes: `pages.yml` is a setup path, `RUNBOOK.md` is docs, `id-token: write` trips no secret shape).

The two files are the devops role's alone: the builder (slice or no slice) and the main session are refused by the scope guard (`Denied: docs/RUNBOOK.md is the devops role's file (its x-writes); /sdlc:setup-delivery writes it through the devops agent, nobody else changes it.`); before this role existed `docs/RUNBOOK.md` was writable by anyone with no slice as `docs/**`, and it no longer is. `.github/**` stays a setup path: `gate.yml` holds the kit's template or is the human's (the devops role is refused on it too), shell writes under `.github/` are refused to every role, so the workflow is written with the Write tool only. The commit guard allows what the skill needs (`git remote get-url origin`, `git status`, the named `git add` and commit, the kit tools) and refuses `gh pr create`, `gh api -X POST` (enabling Pages by API), `git push`, `git remote add`. The agent guard asks no plan or approved requirements of the devops role (only `x-writes: slice` roles need them); the SubagentStop hook holds it neither as a judge nor as the builder.

**Writes.** `.github/workflows/pages.yml`, `docs/RUNBOOK.md`, one commit. Report: the two files with the hash, the `Live:` line (`after the first push to <branch>`), `Human, once: Settings > Pages > Build and deployment > Source: GitHub Actions; then push.`, `Not computed: <what, or none>`.

**Never.** Edit `.github/workflows/gate.yml`, `.githooks/`, `AGENTS.md`, `.claude/settings.json` or `.sdlc/`. Run `gh`, push, tag or change a remote (ADR-002). Guess the owner, the repository, the branch or the URL.

**The human.** Switches the repository's Pages source to GitHub Actions once (until then `configure-pages` fails), pushes; the workflow deploys on every push to the default branch. The gate's `ci` row reads `gate.yml` only: `pages.yml` cannot stand in for it or confuse it.

**Next.** `/sdlc:review-change`

## Step 5: `/sdlc:review-change [--cycle n]`

**Input.** A clean tree, no active slice, every slice committed. The main session is the clerk: it decides nothing about the code. The finders are `agents/finder-*.md` (opus, read-only, `x-writes: []`) and the verifier `agents/verifier.md` (fable, read-only, `x-writes: []`); `finder-legal` always runs in cycle 1 with the kit's legal skills (and any project `.claude/skills/legal-*/`); `finder-domain` runs only when a domain skill exists under `.claude/skills/domain-*/`.

**What it does.** The seven steps of the skill:

1. `node "${CLAUDE_PLUGIN_ROOT}/tools/review.mjs" start $ARGUMENTS`. Refused in one sentence on a dirty tree, an active slice, a cycle 3 (`BUDGET: human decision`), a cycle 2 before the human decided on cycle 1, or a finished series with no code commit since (`Review refused: 3f9c2d1 is reviewed (MERGE) and no code changed since; nothing to review.`). When the previous series is finished (verdict `MERGE`, or `BUDGET` at cycle 2) and code commits follow the reviewed commit (docs-only commits do not count), `start` opens a new series at cycle 1: it moves the finished cycles' folders and a copy of `docs/REVIEW.md` to `docs/review/archive/<series>-<sha7>/`, records `series` in `docs/review/state.json`, scopes the review to `<reviewed sha7>..HEAD` unless `--scope` says otherwise, keeps the F-id counter, and prints a `series` line. Otherwise it prints the cycle, the reviewed commit, the scope (`main..HEAD` on a branch ahead of `main`, else `all`), the finder classes to run (`correctness, security, contract, legal`, plus `domain` with a domain skill), the domain skill path or `none`, the legal skill paths, and writes two briefs: `docs/review/<cycle>/brief.txt` for the finders and `verifier-brief.txt` for the verifier; both name the legal skills by full path with their rule ids.
2. Launches the finders named in step 1 in parallel, in one message, with the Agent tool: `sdlc:finder-correctness`, `sdlc:finder-security`, `sdlc:finder-contract`, `sdlc:finder-legal`, and `sdlc:finder-domain` when named; each prompt is the text of `brief.txt`. Saves each answer verbatim to `docs/review/<cycle>/finder-<class>.json`.
3. `review.mjs check --cycle <n>`. For each `RE-ASK finder-<class>: <problem>` line, launches that finder once more with the brief plus `Your previous answer was not usable: <problem>. Return the JSON array and the Checklist line, nothing else.` A finder is re-asked at most once.
4. Launches the verifier (`sdlc:verifier`) with `verifier-brief.txt` as its whole prompt. Saves its JSON to `verifier.json` and its `Model:`, `Gate:`, `Mutations:` and `  survived:` lines (and `Partial:` or `Blocked:`) to `verifier.txt`.
5. `review.mjs render --cycle <n>`. On `RE-ASK verifier: <problem>`, re-asks once. The script validates both JSON shapes, places every id exactly once, runs the gate and `mutate.mjs` itself for the header, computes each route from `docs/PLAN.md`, decides the verdict and writes `docs/REVIEW.md`.
6. `git add docs/review docs/REVIEW.md && git commit -m "Review cycle <n>: <verdict>"` (docs only, no slice active, so a plain message is accepted).
7. Replies with `Review cycle <n> committed as <hash>.` and exactly the verdict block `render` printed, nothing else: the human reads `docs/REVIEW.md` itself.

**Writes.** `docs/review/state.json`, `docs/review/<cycle>/brief.txt`, `verifier-brief.txt`, `finder-*.json`, `findings.json`, `verifier.json`, `verifier.txt`, and `docs/REVIEW.md`.

**The human.**

- `MERGE`: go to ship.
- `FIX FIRST`: read each confirmed finding, say accept or reject, and record it from your own terminal: `node sdlc/tools/review.mjs decide --cycle 1 --accept F-01,F-02 --reject F-03..F-18 --note "<your words>"`. Every confirmed F-id goes in exactly one list or the script refuses. Commit `docs/review/1/decisions.json`. Then follow the routes: a `code` route reopens the slice (`/sdlc:implement-slice S3 F-01 F-02`), a `plan` route means the human removes `Status: approved` from `docs/PLAN.md`, runs `/sdlc:plan-slices` again and approves the new plan, a `requirement` route is a `Q-nn` answered in `docs/REQUIREMENTS.md` (the human edits the approved file and re-approves it in the same commit), a trade-off is an ADR.
- `BUDGET: human decision`: cycle 2 ended with a reason left. Ship as it is (`/sdlc:ship` prints the review line as a warning) or reopen the finding as a new requirement (`R-nn`, re-plan, build, then a fresh review from cycle 1).
- Code committed after a `MERGE` or a `BUDGET`: run `/sdlc:review-change` again; it opens the next series from cycle 1 over the new commits and archives the old cycles. F-ids continue, so an id in an archived review still names the same finding.

**Next.** `/sdlc:review-change --cycle 2` after the fixes, or `/sdlc:ship`.

## Step 6: `/sdlc:ship`

**Input.** No active slice (the skill stops and names the open slice otherwise). The manual checks ticked by the human who ran them.

**What it does.** Runs `node "${CLAUDE_PLUGIN_ROOT}/tools/gate.mjs" --review`; on failure it stops and reports the failing line, fixing nothing. The `review` line is a warning here, never a failure: `none (run /sdlc:review-change)`, `<sha> is N commits old (...): re-review needed`, or `<sha> ok, verdict FIX FIRST`. Writes `docs/TRACE.md` with `node "${CLAUDE_PLUGIN_ROOT}/tools/trace.mjs" --markdown > docs/TRACE.md`. Runs `trace.mjs` and prints exactly `manual checks: <listed> listed, <passed> passed; the unticked ones stay open for QA`. Writes `docs/PR.md` with five short sections: **What** (a paragraph and the slice list from `git log --oneline`), **Why** (the brief in two lines, a link to `docs/REQUIREMENTS.md`), **How it was verified** (the gate table with the `review` line, `node --test` totals, the manual checks line, the header and verdict of `docs/REVIEW.md`, the human's decisions from `decisions.json`, the review warning in plain words if any), **Open items** (every `LATER` requirement and every unticked manual check, marked `LATER` or `QA`), **Decisions** (the files in `docs/decisions/` with their titles), and, only when `.github/workflows/pages.yml` exists, a last line that is the output of `node "${CLAUDE_PLUGIN_ROOT}/tools/delivery.mjs" url` (`Live: https://<owner>.github.io/<repo>/`, computed from the origin remote, never typed by hand; when the command fails its reason goes there instead). Commits `git add docs/TRACE.md docs/PR.md && git commit -m "Ship: trace matrix and PR description"`. Prints the gate table, the manual checks line, the review verdict, and `run /cost now for the session total`.

**Never.** Push, open a pull request, merge, tag (ADR-002). Tick a manual check. Change code or tests.

**Writes.** `docs/TRACE.md`, `docs/PR.md`.

**The human.** Pushes, opens the pull request with `docs/PR.md`, and has it approved by a human. CI runs `gate.mjs --strict`: an unticked manual check, a stale or non-`MERGE` review, or a surviving planted defect fails the build.

## Files only humans write

The scope guard and the commit guard refuse these to every agent, by Edit, Write or shell:

| File | Why |
|---|---|
| `AGENTS.md`, `CLAUDE.md` | the rules the agents run under |
| `.claude/settings.json`, `.claude/settings.local.json` | the session's own configuration |
| `docs/decisions/**` | the ADRs and every answered question; the one exception is the architect, which may create an ADR or edit one still `Status: proposed` |
| any document under `docs/` once it says `Status: approved` or `accepted` (`docs/REQUIREMENTS.md`, `docs/UI-SPEC.md`, `docs/PLAN.md`, an ADR; on the ADR template's `Date: ... Status: accepted.` line as well) | it is the baseline from the commit that approved it; the gate's `contract` line checks the history, and no agent may write the approving line itself |
| `- [x]` in `docs/MANUAL-CHECKS.md` | a tick is the signature of the person who ran the check; agents append checks unticked |
| `.githooks/*`, `.github/**` unless the content is the kit's template | a changed hook or workflow turns the gate off |
| `.claude/skills/domain-*/SKILL.md` once it exists | the domain rules `D-nn` the human signed; the AI may draft the file once, as a project skill |
| `.claude/skills/legal-*/SKILL.md` once it exists | the project's own legal rules (`L?-nn`, from `templates/legal-skill.md`) the human signed; the kit's three legal skills live in the kit and are read-only from a project like every kit file |
| `docs/review/<cycle>/decisions.json` | the human's accept or reject on each finding, written by `review.mjs decide` |
| `.sdlc/**` | kit state; by shell only `mkdir`, `echo S<n> > .sdlc/slice` and `rm` are allowed |
| the kit's own folder | the kit changes in its own repository; a project session may only `cat`, `head`, `tail`, `grep`, `ls` it and run `node <kit>/tools/<name>.mjs` |

Two sets of files are not the human's but one role's alone, refused to the builder and to the main session, slice or no slice: the tester's `tests/**/*.spec.mjs` (`... is the tester's test (a .spec file); the builder makes it pass and adds its own tests in a .test file ...`) and the devops role's `.github/workflows/pages.yml` and `docs/RUNBOOK.md` (`... is the devops role's file (its x-writes); /sdlc:setup-delivery writes it through the devops agent, nobody else changes it.`). The ux-designer's `docs/UI-SPEC.md` is its own while a draft and human-only once approved.

Project skills under `.claude/skills/<name>/SKILL.md` are the one thing the main session may write when no slice is active, so a step you repeat becomes a skill written with the AI and reviewed like code. A domain skill (`domain-<area>`) or a project legal skill (`legal-<area>`) is written the same way once; after that it is human-only. They are written with the Write tool as a whole file; their frontmatter may hold only `name`, `description` and `argument-hint`; they may not mention `${CLAUDE_PLUGIN_ROOT}`, `.sdlc` or the kit path.

## Cycle rules

- Two fix rounds at most: cycle 1, fixes, cycle 2. Cycle 2 ends in `MERGE` or `BUDGET: human decision`, never `FIX FIRST`; a third `review-change` is refused with `BUDGET: human decision. Two fix rounds ran (cycles 1 and 2); a third review is not allowed, the human decides what ships.`
- Cycle 2 starts only after the human decided on every confirmed finding of cycle 1 (`review.mjs decide`). It carries the accepted findings under their F-ids, lists the rejected ones in `docs/REVIEW.md` under "Rejected by the human", and never raises them again: a rejected id the verifier confirms anyway is dropped from the count with the clerk note `<id> rejected by the human in cycle 1; not counted`.
- Cycle 2 runs only the finder classes that produced a confirmed or watch-listed finding in cycle 1. A `VER` finding against the tests counts as contract. The finders are not told about carried findings; a re-found defect is merged under its F-id. A new verifier re-checks each carried finding and marks it fixed (`refuted`, with the fix as evidence) or still present (`confirmed`). New findings number after cycle 1's last id per class (`COR-9`, `SEC-5`, `CON-4`, `LEG-2`, `VER-7`); new confirmed findings get the next free F-ids. F-ids never change.
- A finished series (`MERGE`, or `BUDGET` at cycle 2) is bound to its commit. Code commits after it (docs-only commits do not count) make the next `start` open a new series at cycle 1: the finished cycles and a copy of `docs/REVIEW.md` move to `docs/review/archive/<series>-<sha7>/`, the default scope is `<reviewed sha7>..HEAD`, `nextF` carries over so an F-id is never reused. No code after a finished series: `Review refused: <sha7> is reviewed (MERGE) and no code changed since; nothing to review.` (after a `BUDGET` at cycle 2 the `BUDGET: human decision` sentence is printed instead).
- A finder whose answer is not valid JSON, or misses a field, is re-asked once with the problem named. The second answer is used as it is. The critic, a judge too, is re-asked once by `plan-slices` when its answer has no JSON array.
- The builder stops after two attempts on one gate failure, leaves `.sdlc/slice` in place and reports.
- The stop hook blocks a stop on red tests once per slice, and never when the agent is asking the human a question or reporting a denial.
