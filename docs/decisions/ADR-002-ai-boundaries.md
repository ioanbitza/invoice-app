# ADR-002: AI boundaries

Date: 2026-10-30. Status: accepted. Author: Ioan Bita.
Tags: web-ui

## Context
The app is built with AI agents (Claude Code with the `sdlc` plugin). Agents write the requirements, the architecture proposals, the design, the plan, the acceptance tests, the code, the delivery workflow and the review. A human stays the owner of the result, and the limits must be enforced by scripts, not only written down.

## Decision

### Who does what, on which model
- **Requirements** (the product owner's skill, Opus): writes `docs/REQUIREMENTS.md` from the brief. The human answers the open questions and approves.
- **Architecture** (the architect, Opus): proposes one ADR per open decision, `Status: proposed`. The human accepts each one.
- **Design** (the UX designer, Opus): proposes `docs/UI-SPEC.md`, `Status: draft`. The human approves.
- **Plan** (the planner's skill, Opus) and its **critic** (Fable, a judge on another model than the planner): the plan is written, the critic's findings are saved and applied, the human approves.
- **Acceptance tests** (the tester, Opus): one spec per domain or storage slice, from the requirements, before the build. The builder makes them pass and never edits them.
- **Code and the builder's tests** (the builder, Sonnet): one slice at a time, test-first, inside the files the plan lists.
- **Delivery** (the devops role, Sonnet): the GitHub Pages workflow and the runbook. The human enables Pages and pushes.
- **Review**: finders in parallel (Opus), one class of defect each (correctness, security, contract, legal), read-only, fresh context; then a verifier (Fable) that re-checks every finding and plants defects to prove the tests can fail. A script, not a model, writes `docs/REVIEW.md`.
- **The human**: approves the requirements, the ADRs, the spec and the plan; ticks only the manual checks they ran; accepts or rejects each finding from their own terminal; opens and approves the pull request.
- **Fix rounds**: two at most per review series. After that, the human decides what ships. A later change opens a new series.

### What the AI may not decide
- Accepting an architecture proposal, approving the design, the requirements or the plan.
- The data model and the stack, once their documents are accepted.
- The security rules: user text is never rendered as HTML; errors are never swallowed.
- Anything marked `NEEDS HUMAN`. The answer goes into an ADR, not into the chat.

### What data goes to the model
- The repository, the brief, the requirements, the decisions, the spec and the plan. No customer data: the app has none during development, and the manual checks use invented names.

### How it is enforced
- Hooks refuse: edits outside a role's write scope or the active slice, edits to accepted or approved documents, HTML sinks (`innerHTML` and friends), unfinished-work words (`TODO`, `FIXME`, `placeholder`, "for now"), tests that cannot fail (`test.skip`, `.only(`, `assert.ok(true)`), and any agent writing `Status: accepted` or `Status: approved`.
- Each role has a write scope in its agent file. Judges (critic, finders, verifier) write nothing.
- One gate script (tests, scope, trace, contract, secrets, dependencies, commit message, CI workflow, review binding, mutations) runs in the Claude hooks, in the git hooks and in CI. No red tests and no unplanned files get committed.
- Every commit names its slice and requirement IDs. `docs/TRACE.md` links each requirement to its tests, commits and manual check.
- The review is bound to the commit it reviewed. Code changed after it means a new review.

### Pull requests
- The AI writes the PR text (`docs/PR.md`). A human opens, approves and merges. The AI never pushes, merges or tags; the hooks refuse it.

## Consequences
- Every decision has a file and a commit by the human; nothing said in a chat counts.
- More steps before the first line of code (ADRs, spec, plan, specs), each one cheap and visible.
- An agent that hits the edge of its scope writes `NEEDS HUMAN` and stops.

## Not decided here
- The stack (ADR-001, proposed by the architect).
- The visual direction (`docs/UI-SPEC.md`, proposed by the designer).

## Answered
