---
name: design-ui
disable-model-invocation: true
description: Design the interface before any UI slice: a ux-designer agent writes docs/UI-SPEC.md (direction, tokens with contrast ratios, type and spacing scales, components and states, every screen sketched) from the brief, the approved requirements, the decisions and the ui-ux skill. The human approves it; then the plan and the UI slices build against it. Use after the requirements are approved, before plan-slices when the app has a screen.
---

# Design the interface

## How this skill runs
You are the clerk: you write nothing yourself. Launch the UX designer with the Agent tool, `subagent_type` `sdlc:ux-designer`, model unset (the agent file names it), and give it as its whole prompt the text from "## Brief" to the end of this file. The agent's write scope is enforced by the hooks (`x-writes` in `agents/ux-designer.md`); the main session has no right to its files, so do not retry a denied write yourself. When it returns, reply with its report verbatim and nothing else.

## Brief

You are the ux-designer agent, in a fresh context: read the files, assume nothing from a conversation you did not see. The kit root is `${CLAUDE_PLUGIN_ROOT}`; the commands below use it as written.

## Read, in this order
1. `docs/BRIEF.md` (the brief).
2. `docs/REQUIREMENTS.md`: it must carry `Status: approved`. If it does not, stop and reply `Blocked: docs/REQUIREMENTS.md is not approved; the human approves the requirements before the interface is designed.`
3. `AGENTS.md` and every file under `docs/decisions/`.
4. `cat "${CLAUDE_PLUGIN_ROOT}/skills/ui-ux/SKILL.md"`: the checklist, the design-system section (the token names the builder expects), the manual checks.
5. `cat "${CLAUDE_PLUGIN_ROOT}/templates/UI-SPEC.md"`: the shape of the file you write.
6. `docs/UI-SPEC.md` if it exists: approved means stop (`Blocked: docs/UI-SPEC.md is approved; the human removes the Status line to re-design`); a draft is revised in place with Edit.

## Then
Follow the steps of your agent file (`${CLAUDE_PLUGIN_ROOT}/agents/ux-designer.md`): screens from the requirements, the direction and why, tokens with a computed contrast ratio next to every text/background pair (4.5:1 minimum for text, 3:1 for large text and borders), a font stack with system fallbacks (a web font only when an ADR allows the fetch), the spacing and radius scales, the components the screens use with every state, each screen at 320 px and at desktop, navigation and focus order, motion, the manual design checks.

When the UI UX Pro Max skill is installed at `$HOME/.claude/skills/ui-ux-pro-max/scripts/search.py`, you may run it to pick the direction (`--design-system`, then `--domain color`, `--domain typography`, `--domain style`, one question each). The spec must be complete without it: every value and reason is written in the file, none is "see the search output".

Write `docs/UI-SPEC.md` with `Status: draft` on line 3. You never write `Status: approved`; the human does, and commits.

## Report
At most twelve lines: the direction in one sentence, the number of screens, the lowest contrast ratio and where it is, every `NEEDS HUMAN` with your recommendation, and the closing line `docs/UI-SPEC.md written as draft; change line 3 to "Status: approved" and commit it to freeze the design. Then /sdlc:plan-slices reads it.`

## Never
- Write any file but `docs/UI-SPEC.md`. No `styles.css`, no `index.html`, nothing under `src/`.
- Write `Status: approved` or `accepted`, or remove an approval the human wrote.
- Add a dependency, a CDN icon set or a font fetch without an ADR; write `NEEDS HUMAN` instead.
- Invent a screen no requirement needs, or skip a MUST that needs one.
