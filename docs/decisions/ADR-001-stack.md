# ADR-001: Stack

Date: 2026-10-27. Status: accepted. Author: Ioan Bita.

## Context

The brief asks for a small local JavaScript app with `localStorage`. The exercise is about the method, not about a framework. Anything that needs installing, building or explaining takes time and gives the AI more places to go wrong.

## Decision

- Plain JavaScript, ES modules in the browser. No transpiler, no bundler, no build step.
- No dependencies, runtime or dev. `npm install` is not allowed.
- Tests with Node's built-in runner: `node --test`, files in `tests/`, named `<module>.test.js`. Assertions with `node:assert` only.
- Persistence: one `localStorage` key holding the whole state, written whole on every change.
- Run locally with `python3 -m http.server 8000` (ES modules do not load from `file://`).
- Three layers:
  - `src/domain/`: pure logic, no DOM, no storage;
  - `src/storage/`: the only code that touches `localStorage`;
  - `src/ui/`: DOM only, no business rules.
- Money is whole cents in one currency (EUR), never floats.

## Consequences

- Every test runs in about a second, so the gate can run on every edit and every commit.
- No framework means a bit more DOM code by hand in `src/ui/`. Fine at this size.
- An agent that needs anything outside this list writes `NEEDS HUMAN` in the plan and stops.

## Not decided here

- Configuration files at the repository root (the plan raises them if the tests need any).
- Browser support beyond current Chrome, Edge, Firefox and Safari.
