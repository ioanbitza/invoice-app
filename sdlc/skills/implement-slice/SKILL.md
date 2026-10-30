---
name: implement-slice
disable-model-invocation: true
description: Build one slice from docs/PLAN.md test-first, inside the files the plan allows, then commit. Use for "implement S1", or "S3 F-01 F-02" to reopen a slice with review findings.
argument-hint: S<n> [F-xx ...]
---

# Implement slice $ARGUMENTS

## How this skill runs
You are the clerk: you write no code yourself. Launch the builder with the Agent tool, `subagent_type` `sdlc:builder`, model unset (the agent file names it), and give it as its whole prompt the text from "## Brief" to the end of this file with the first line `Arguments: $ARGUMENTS`. The agent guard refuses the builder while `docs/PLAN.md` is not approved; show that sentence and stop. When it returns, run `node "${CLAUDE_PLUGIN_ROOT}/tools/gate.mjs"` and `git log --oneline -1`, then reply with the builder's report plus those two results, nothing else.

## Brief

You are the builder agent. The first line of this prompt gives your arguments: `S<n>` is the slice, any `F-xx` after it are review findings to fix. You run in a fresh context: read the files, do not assume anything from a conversation you did not see.

The kit root is `${CLAUDE_PLUGIN_ROOT}`; the commands below use it as written. `S<n>` is the first word of `$ARGUMENTS`; any `F-xx` after it are review findings to fix.

## Steps
0. Check that `docs/PLAN.md` carries `Status: approved`; if not, stop and say so: the human approves the plan before anyone builds it. Then mark the slice active, so the guards know what you are allowed to touch: `mkdir -p .sdlc && echo S<n> > .sdlc/slice` (the slice id only; the guard refuses the marker while the plan is not approved). Then `node "${CLAUDE_PLUGIN_ROOT}/tools/scope.mjs" S<n>` prints the files you may change.
1. Run `node "${CLAUDE_PLUGIN_ROOT}/tools/profile.mjs" builder` and read every skill it lists (the discipline and stack rules the ADR tags switched on; the review cites them by id). Read the slice in `docs/PLAN.md`, its requirements in `docs/REQUIREMENTS.md`, and `AGENTS.md`. For a UI slice (files under `src/ui/`, `index.html`, `styles.css` on its `**Files:**` line) read the UI rules first: `cat "${CLAUDE_PLUGIN_ROOT}/skills/ui-ux/SKILL.md"` (`cat` on the kit path is allowed), then `docs/UI-SPEC.md`, which must carry `Status: approved`: its tokens go into `:root` of `styles.css` as written and its section 7 is the layout of each screen the slice builds. If `docs/UI-SPEC.md` is missing or not approved, stop before touching a UI file and report `NEEDS HUMAN: docs/UI-SPEC.md is missing or not approved; run /sdlc:design-ui and approve it first`. If a domain skill exists under `.claude/skills/domain-*/SKILL.md`, read it before a domain or storage slice: its `D-nn` rules are what `finder-domain` checks the code against.
2. Write a three-line start note in the chat: what you will change, and what you are assuming.
3. Tests first for domain and storage: write them, run `node --test`, confirm they fail for the right reason (a missing module or a wrong value, not a syntax error). When the tester already wrote `tests/<area>.spec.mjs` for this slice, those tests skip themselves until the slice's module exists and run from then on: read them (they are the acceptance bar), make them pass together with your own `.test.*` tests, and never edit them (the guard denies it; a spec you believe wrong goes in the report).
4. Write the smallest code that makes them pass.
5. Run all tests until they pass. For a UI slice, add its manual checks to `docs/MANUAL-CHECKS.md` as `- [ ] R-xx: ...` and the ten `- [ ] UX: ...` lines from the ui-ux skill (six UX, four design), and leave them unticked: the human ticks what they ran.
6. Run `git status` and check that only the planned files changed. Then run the gate: `node "${CLAUDE_PLUGIN_ROOT}/tools/gate.mjs"`.
7. Stage the slice's files by name and commit in one command, for example `git add src/domain/lines.js tests/lines.test.js && git commit -m "S3: lines and totals (R-11..R-13)"`. The subject starts with `S<n>` (never the whole `$ARGUMENTS`); on a reopen it names the findings: `git commit -m "S3: fix F-01, F-02 (R-12, R-15)"`. The IDs are the ones in the slice's `**Covers:**` line; a range is written `R-11..R-17`. `git add -A`, `git add .` and `git commit -a` are refused: the hook must see the files. The hook runs the same gate and refuses anything red.
8. After the commit: `rm .sdlc/slice`. The slice is closed; the guard goes back to docs-only.
9. Report in five lines: what changed, which tests ran, the commit hash, what you were unsure about.

## When the slice is reopened by a review
`$ARGUMENTS` then names findings too, for example `S3 F-01 F-02`. Read them in `docs/REVIEW.md`, only the ones the human accepted (`docs/review/<cycle>/decisions.json`); an F-id that is not in `docs/REVIEW.md` is the human's own report from the browser, with its file, line and text under `reported` in that `decisions.json`. For each: first the test that would have caught it (it must fail now), then the smallest fix, inside the slice's files. The commit names them: `S3: fix F-01, F-02 (R-12, R-15)`. Do not touch findings routed elsewhere (plan, requirement, ADR).

## When a guard denies something
The denial sentence says which slice is active, which files are allowed and what to do. Do not retry the same action another way, do not edit `docs/PLAN.md` to widen the slice. Stop and tell the human what you need and why.

## Never
- Touch another slice, add a dependency, or create files the plan does not list.
- Skip, weaken or delete a test to make it pass.
- Put user data into `innerHTML` or `insertAdjacentHTML`.
- Leave `TODO`, `FIXME`, `placeholder` or "for now" in code, or write a test that cannot fail (`test.skip`, `.only(`, `assert.ok(true)`); the guard denies these and names the rule.
- Leave `.sdlc/slice` behind after the commit.
