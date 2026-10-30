# Build slices in sequence

Slices to build, in this order: $ARGUMENTS

## How this skill runs
You are the clerk: you write no code yourself. For **each slice in order**, launch a fresh builder with the Agent tool, `subagent_type` `sdlc:builder`, model unset (the agent file names it), and give it as its whole prompt the text from "## Brief" to the end of this file with the first line `Slice: S<n>`. One builder per slice, never two at once: the next one starts after the previous one reported. After each report run `node "${CLAUDE_PLUGIN_ROOT}/tools/gate.mjs"` and `git log --oneline -1` yourself and keep the line for the final report. Stop at the first builder that reports `FAILED` or `NEEDS HUMAN`: do not launch the next slice, do not touch its files. The agent guard refuses the builder while `docs/PLAN.md` is not approved; show that sentence and stop.

End with the report below, one line per slice, then the two lines the builders gave you (what they were unsure about, what the human should check in the browser), joined.

## Brief

You are the builder agent for the slice named on the first line of this prompt. You run in a fresh context: read the files, do not assume anything from a conversation you did not see. The kit root is `${CLAUDE_PLUGIN_ROOT}`; the commands below use it as written.

Run `node "${CLAUDE_PLUGIN_ROOT}/tools/profile.mjs" builder` and read every skill it lists once (the discipline and stack rules the ADR tags switched on; the review cites them by id). Read `AGENTS.md`, `docs/REQUIREMENTS.md` and `docs/PLAN.md` once, and every `.claude/skills/domain-*/SKILL.md` when one exists (its `D-nn` rules bind the domain and storage slices). For a UI slice (files under `src/ui/`, `index.html`, `styles.css`) read the UI rules: `cat "${CLAUDE_PLUGIN_ROOT}/skills/ui-ux/SKILL.md"`, then `docs/UI-SPEC.md` (it must carry `Status: approved`; its tokens go into `:root` of `styles.css` as written, its section 7 is the layout of every screen). If it is missing or not approved, stop with `NEEDS HUMAN: docs/UI-SPEC.md is missing or not approved; run /sdlc:design-ui and approve it first`. Then run these steps for your slice:

0. `mkdir -p .sdlc && echo S<n> > .sdlc/slice`, then `node "${CLAUDE_PLUGIN_ROOT}/tools/scope.mjs" S<n>` to see the allowed files.
1. Read the slice section in the plan and its requirements.
2. Tests first for domain and storage: write them, run `node --test`, confirm they fail for the right reason. When the tester already wrote `tests/<area>.spec.mjs` for the slice, read it first: it is the acceptance bar, it skips itself until the slice's module exists, and from then on it runs with your `.test.*` files and must pass; never edit it (the guard denies it; a spec you believe wrong goes in the report).
3. Write the smallest code that makes them pass. Run `node --test` until green.
4. For a UI slice add its manual checks to `docs/MANUAL-CHECKS.md` as `- [ ] R-xx: ...` plus the ten `- [ ] UX: ...` lines from the ui-ux skill (six UX, four design), unticked.
5. `git status`: only the planned files changed. Then `node "${CLAUDE_PLUGIN_ROOT}/tools/gate.mjs"`.
6. Stage the slice's files by name and commit in one command: `git add <file> <file> && git commit -m "S<n>: <what changed> (R-xx, R-yy)"` with the IDs from the slice's `**Covers:**` line (ranges as `R-11..R-17`). `git add -A` and `git commit -a` are refused.
7. `rm .sdlc/slice`. Report the commit hash and the test count in the format below; the clerk launches the next slice.

## Stop rule
If the gate fails and you cannot make it pass inside the slice's files within two attempts, stop. Do not touch files outside the slice, do not weaken a test. Leave `.sdlc/slice` in place so the state is visible, and report.

## Report (the clerk collects one line per slice)
```
S2  done   a1b2c3d  12 tests green
S3  done   d4e5f6a  21 tests green
S4  FAILED gate: tests 1 failed: R-20 invalid JSON ...  (files left uncommitted, .sdlc/slice = S4)
S5  not started
```
Then two lines: what you were unsure about, and what the human should check in the browser.

## Never
- Add a dependency, create files the plan does not list, use `innerHTML`, skip or weaken a test, leave `TODO` or `placeholder` in code.
- Edit `docs/PLAN.md`, `docs/REQUIREMENTS.md`, `AGENTS.md` or anything in `docs/decisions/`.
