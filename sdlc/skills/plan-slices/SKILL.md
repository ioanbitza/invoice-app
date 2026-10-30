---
name: plan-slices
disable-model-invocation: true
description: Split approved requirements into small slices and write docs/PLAN.md (files, tests, steps, checks, decisions for the human). Use after the requirements are approved, before any code.
model: opus
---

# Plan slices

Input: `docs/REQUIREMENTS.md` (must say `Status: approved`), `AGENTS.md`, `docs/decisions/*.md`, the skills `node "${CLAUDE_PLUGIN_ROOT}/tools/profile.mjs" planner` lists (the layering and stack rules decide the folders and the test command a slice names), and `docs/UI-SPEC.md` when it exists (the design contract from `/sdlc:design-ui`; its section 7 names the screens, and a UI slice is planned per screen or group of screens from it). Output: `docs/PLAN.md`. No code.

If the app has a screen and `docs/UI-SPEC.md` is missing or not approved, plan the domain and storage slices and mark every UI slice `NEEDS HUMAN: docs/UI-SPEC.md missing or not approved; run /sdlc:design-ui and approve it before this slice`.

If the requirements are not approved, stop and say so. Do not plan a draft.

## The plan format is a contract
The scope guard, the commit gate and `tools/scope.mjs` parse `docs/PLAN.md`. Each slice must be written exactly like this:

```
## S1 Customer rules (domain)
**Goal:** one sentence. **Covers:** R-01, R-02, R-03, R-05.
**Files:** `src/domain/customers.js`, `tests/customers.test.js`
```

- Line 3 of the file is `Status: draft`. The human changes it to `Status: approved` once the decision package is answered; from then on the plan is frozen (the guards refuse every change by an agent, and the builder cannot start without that line). To re-plan later, the human removes the line first, then runs this skill again.
- The heading is `## S<n> <title>`, numbered from S1 with no gaps.
- `**Covers:**` lists the requirement IDs the slice implements or shows on screen. A range is written `R-11..R-17`. A UI slice may say `**Covers on screen:**`.
- `**Files:**` is one line, every path in backticks, separated by commas, relative to the repo root, at most six. While the slice is active the agent may change only these files. `docs/MANUAL-CHECKS.md` is allowed in every slice without being listed; never put it on a `**Files:**` line. A file that is not on this line cannot be created or edited, so think about every file the slice needs, including `index.html` or `styles.css` for UI slices.

## For each slice also write
- **Tests first:** the test titles, each starting with its requirement ID, for example `R-07 order total sums its lines`.
- **Steps:** at most five. In a UI slice the steps name the screens it builds, by the screen names of `docs/UI-SPEC.md` section 7 (`build screen 7.1 Orders list and its empty state from UI-SPEC.md`), and the first UI slice's steps include the `:root` tokens of `styles.css` from sections 3 to 5 and 9 of the spec.
- **Verify:** commands, and for UI requirements that a unit test cannot cover, the manual checks that go into `docs/MANUAL-CHECKS.md` as `- [ ] R-xx: what to do, what you should see`. A UI slice (files under `src/ui/`, `index.html`, `styles.css`) also lists the ten `- [ ] UX: ...` checks of `skills/ui-ux/SKILL.md`: the six UX checks (keyboard-only path, 200% zoom, contrast, empty states, error next to the field, 320 px width) and the four design checks (tokens only, states present, type and spacing scales, screens match `docs/UI-SPEC.md`).
- **Risks:** what you are unsure about.

## Rules
- Order the slices so each one ends in something that can be tested. Domain and storage first, UI after.
- Every MUST requirement appears in at least one slice's `**Covers:**`. Check this before you finish.
- Mark any architectural choice (a dependency, a new folder, a change to the stack, a config file the decisions do not mention) as `NEEDS HUMAN` inside the slice and do not decide it.
- End the file with the decision package, a section `## Decisions needed from the human`, mandatory even when it says `none`:
  - at most three decisions; each at most five lines; the recommendation first, then the alternative and what it costs;
  - plain words, written for the person who owns the product, not for the team (what changes for them, not which file changes);
  - more than three open: list the three that block the first slices and say how many more wait, then ask which three to settle now.
  Format of one decision:
  ```
  D1. Where does the app keep its data between sessions?
      Recommended: localStorage, one key per entity (no setup, works offline; limit about 5 MB).
      Alternative: IndexedDB (more room, more code: two more files and a slice of its own).
      Answer in: docs/decisions/ADR-003-storage.md under "## Answered".
  ```
- After writing the file, have the critic judge it before the human sees it (the critic did not write the plan and runs on another model; the agent guard refuses it on the planner's model):
  1. Launch `sdlc:critic` with the Agent tool, model unset, with this prompt: `Judge docs/PLAN.md (draft) against docs/REQUIREMENTS.md, docs/decisions/ADR-*.md and AGENTS.md. The kit root is ${CLAUDE_PLUGIN_ROOT}. Return the JSON array of findings and the Checklist line, nothing else.`
  2. Save its answer verbatim to `docs/plan-review/critic.json` with the Write tool (the main session may write under `docs/` when no slice is active). If the answer carries no JSON array, launch the critic once more with the same prompt plus `Your previous answer was not usable: no JSON array. Return the array and the Checklist line, nothing else.`; save that. At most one re-ask.
  3. Apply every `blocking` finding to the plan (its `fix` says what to change: a Covers id, a Files path, a test title, a manual check). List every `advisory` finding under `## Decisions needed from the human` as `Critic CRI-n (advisory): <what>; <fix>`, after the decisions, without counting them against the limit of three.
  4. Tell the human in one line how many findings the critic returned, how many blocked and were applied, how many are advisory and listed.
- Then stop and show the decision package to the human in under ten lines. Nothing said in the chat counts as a decision: the human answers in `docs/decisions/ADR-*.md` under `## Answered` with the line `Q: <question>  A (<date>, <name>): "<exact words>"`. When the answers are there, update the plan to match and remove the decided items from the package, then tell the human the plan is ready for `Status: approved`: the human types that line and commits the file; nothing builds before it. Once it is approved, `/sdlc:write-tests` writes the tester's acceptance tests (`tests/<area>.spec.mjs`, one per domain or storage slice, self-skipping until the slice's module exists) before the first builder run; the builder makes them pass and never edits them.
