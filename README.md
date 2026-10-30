# Invoice app

A small local application for one person: customers, their orders and the lines of each order, with exact totals. Plain JavaScript in the browser, data in `localStorage`, no server.

It is built from the brief in [docs/BRIEF.md](docs/BRIEF.md) with Claude Code and the process that lives in [`sdlc/`](sdlc/README.md): requirements with IDs, decisions as ADRs the human accepts, a design contract, a plan cut into slices, acceptance tests written before the code, a builder on a cheap model, an independent review on a stronger one, and one gate script that runs in the Claude hooks, in the git hooks and in CI.

The rules every agent reads are in [AGENTS.md](AGENTS.md). What the AI may and may not decide is in [docs/decisions/ADR-002-ai-boundaries.md](docs/decisions/ADR-002-ai-boundaries.md).

To work on it with the same process: `claude --plugin-dir sdlc` from the repository root, and once per clone `git config core.hooksPath .githooks`.
