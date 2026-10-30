# Invoice app: rules for AI agents

## What this is
A small local app to manage customers, their orders and the lines of each order, with totals. It runs in the browser for one person and keeps its data in `localStorage`; there is no server.
Brief: `docs/BRIEF.md`. Requirements: `docs/REQUIREMENTS.md`. Design: `docs/UI-SPEC.md`. Plan: `docs/PLAN.md`. Review: `docs/REVIEW.md` (written by a script from the finders' and the verifier's answers). Decisions: `docs/decisions/`, answers under `## Answered`.

## Language
Everything in English: chat replies, documents, code, commit messages.

## Decisions (humans only)
The stack, the dependencies, the data model after approval, the visual design after approval and the security rules are decided in `docs/decisions/ADR-*.md` and `docs/UI-SPEC.md`. The architect and the designer propose (`Status: proposed`, `Status: draft`); only the human accepts or approves, by changing that line and committing. An agent never edits an accepted or approved document, `AGENTS.md` or `CLAUDE.md`. When something needs a decision, the agent writes `NEEDS HUMAN` and stops.

## Stack
Decided in `docs/decisions/ADR-001-stack.md`: plain JavaScript as ES modules in the browser, no framework, no build step, no dependencies; one `localStorage` key; tests with Node's built-in runner (`node --test`) and `node:assert/strict`. Run locally with `python3 -m http.server 8000` and open http://localhost:8000 (ES modules do not load from `file://`).

## Structure
- `src/domain/` pure logic: entities, validation, totals. No DOM, no `localStorage`.
- `src/storage/` the only code that touches `localStorage`.
- `src/ui/` DOM rendering and events. No business rules here.
- `tests/<module>.test.js` the builder's tests, one file per domain or storage module.
- `tests/<area>.spec.mjs` the tester's acceptance tests, written from the requirements before the build. They skip until their module exists, then they must pass. The builder never edits them.
- `index.html` and `styles.css` at the root; design tokens live only in `:root` of `styles.css`, as `docs/UI-SPEC.md` says.

## Rules
1. Work only on the slice you were given and touch only the files its `**Files:**` line in `docs/PLAN.md` lists. If you need another file, stop and ask.
2. Domain and storage code is test-first: write the test, run it, see it fail, then write the code. A test must be able to fail: no `test.skip`, no `.only(`, no `assert.ok(true)`, no assertion on a value the test itself set. The verifier plants defects to prove it.
3. Never put user data into `innerHTML`. Use `textContent` or DOM APIs.
4. Every requirement you implement is named in a test title, for example `test('R-07 order total sums its lines', ...)`.
5. No new dependencies and no folders outside the structure above.
6. Errors are visible. No empty `catch`, no silent fallbacks, never lose user data silently; no `console.log` or `debugger` under `src/`. No unfinished work left in code: `TODO`, `FIXME`, `placeholder` and "for now" are banned words; finish it or stop and ask.
7. Small functions, plain names, no speculative abstractions or "utils" dumping grounds.
8. One commit per finished slice: `S<n>: <what changed> (R-xx, R-yy)`.
9. A UI slice follows `docs/UI-SPEC.md` (approved) and the kit's UI rules; without an approved spec it stops with `NEEDS HUMAN`.

## How the rules are enforced
Most rules are scripts, not prompts. Rules 1, 3, 5, 6, 8 and the write scopes of rule 9 are enforced: the kit's hooks deny the action and print why, and the content guard refuses the banned words of rules 2, 3 and 6 on write under `src/` and `tests/`. Test-first (rule 2) is the one the builder is told; the tester's specs and the verifier's planted defects show afterwards whether the code and the tests hold. The same gate (`gate.mjs`: tests, scope, trace, contract, secrets, deps, commit message, CI workflow, review binding, mutations) runs in the Claude hooks, in `.githooks/` for any tool or human, and in CI. The review is bound to the commit it reviewed: `docs/REVIEW.md` says `Reviewed: <sha>`, and the gate's `review` line says when code changed after it. Roles have write scopes: the architect writes proposed ADRs, the designer the draft spec, the tester its specs, the builder its slice, the devops role the Pages workflow and the runbook; the critic, the finders and the verifier write nothing.

## Definition of done for a slice
- `node --test` passes, the tester's specs for the slice included.
- The slice's requirement IDs are covered by tests (domain, storage) or listed for a manual check (UI) in `docs/MANUAL-CHECKS.md`.
- `git status` shows only the files the plan allowed.
- `gate.mjs` prints `GATE PASS`.
