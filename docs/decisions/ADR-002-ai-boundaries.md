# ADR-002: AI boundaries

Date: 2026-10-27. Status: accepted. Author: Ioan Bita.

## Context

The app is built with AI agents (Claude Code with the `sdlc-kit` plugin). The agents write requirements, plans, code, tests and a review. A human stays the owner of the result, and the limits must be enforced by scripts, not only written down.

## Decision

### Who does what, on which model

- **Requirements and plan**: the strong model (Opus). The expensive mistakes are made here.
- **Code and tests**: the cheaper model (Sonnet). One slice at a time, test-first, inside the files the plan lists.
- **Review**: three finders in parallel (Opus), one class of defect each: correctness, security, contract with the requirements. Read-only, fresh context. Then a verifier on a model that did not write the code. It re-checks every finding and plants defects to prove the tests can fail. A script, not a model, writes `docs/REVIEW.md`.
- **The human**: approves the requirements, answers the plan's open decisions in an ADR, ticks only the manual checks they ran, accepts or rejects each finding from their own terminal, opens and approves the pull request.
- **Fix rounds**: two at most. After that, the human decides what ships and what waits.

### What the AI may not decide

- The stack and the dependencies (ADR-001).
- The data model, once the requirements are approved.
- The security rules: user text is never rendered as HTML; errors are never swallowed.
- Anything marked `NEEDS HUMAN`. The answer goes into an ADR, not into the chat.

### What data goes to the model

- The repository, the brief, the requirements and the plan. No customer data: the app has none during development, and the manual checks use invented names.

### How it is enforced

- Hooks refuse: edits outside the active slice, edits to decision files and approved requirements, HTML sinks (`innerHTML` and friends), unfinished-work words (`TODO`, `FIXME`, `placeholder`, "for now"), tests that cannot fail (`test.skip`, `.only(`, `assert.ok(true)`).
- Each role has a write scope in its agent file. The builder writes only its slice. The finders and the verifier write nothing.
- One gate script (tests, scope, trace, commit message) runs in the Claude hooks, in the git hooks and in CI. No red tests and no unplanned files get committed.
- Every commit names its slice and requirement IDs. `docs/TRACE.md` links each requirement to its tests, commits and manual check.
- The review is bound to the commit it reviewed. Code changed after it means a new review.

### Pull requests

- The AI writes the PR text (`docs/PR.md`). A human opens, approves and merges. The AI never pushes, merges or tags; the hooks refuse it.

## Consequences

- Slower than letting one agent run free. Every stop is a place where the human decides.
- Manual checks nobody ran stay visibly unticked; the strict gate in CI reports them.
- A review costs four strong-model agents per cycle. That is the price of findings with evidence instead of opinions.

## Not decided here

- Which agent or model handles production incidents. Out of scope for this build.
