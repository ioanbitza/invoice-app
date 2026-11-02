# ADR-001: Stack and runtime

Date: 2026-10-30. Status: accepted. Author: architect, accepted by Ioan Bita.
Tags: javascript, node, browser, localstorage, web-ui

## Context
The brief asks for a simple local JavaScript application with `localStorage`, and R-19 and A-01 rule out a server. `AGENTS.md` and the gate both point to this file for the stack and the dependency rule, but it does not exist yet. The plan needs the language, the module system, the test runner, the supported runtimes and the rule for dependencies, and the kit's licence rule needs the licence named here (A-15).

## Decision
- Language: plain JavaScript, no TypeScript, no JSX, no transpiler, no bundler, no build step. The files in the repository are the files the browser loads.
- Modules: ES modules only. `index.html` holds one `<script type="module" src="src/ui/main.js">` and no inline script; every import is a relative path with its `.js` extension (JS-01).
- Framework: none. The UI uses the DOM, `<template>` and `Intl` (JS-10, JS-15).
- Dependencies: none, neither runtime nor development. No `node_modules`, no lockfile, no CDN script, no web font from another host, no `fetch` (JS-18, A-01). A later dependency needs its own accepted ADR with its name, its SPDX licence (A-15) and why the platform is not enough.
- `package.json` at the root has exactly this content:
  ```json
  {
    "name": "invoice-app",
    "private": true,
    "license": "MIT",
    "type": "module",
    "scripts": { "test": "node --test \"tests/**/*.test.js\" \"tests/**/*.spec.mjs\"" }
  }
  ```
- The human commits that `package.json` before the first slice, with no slice active. The gate's `deps` check fails any change to it inside a slice, so the plan must not list it in a `**Files:**` line.
- The one test command is `npm test` (DR-01). It departs from the `"test": "node --test"` line of JS-02 on purpose: a bare `node --test` finds `*.test.js` but not `tests/*.spec.mjs` (checked on 2026-10-30 with a sample of each in a `tests/` folder). The gate names the test files itself, so it runs both either way. Where `AGENTS.md` says `node --test` passes, a person checks that with `npm test`.
- Test tools: `node:test` and `node:assert/strict`, nothing else (JS-16).
- Node version: 22, the version `.github/workflows/gate.yml` pins. Any later version works locally.
- Browsers: the current versions of Chrome, Edge, Firefox and Safari. No polyfills. The app needs a secure context for `crypto.randomUUID()` and the clipboard, which `localhost` and `https:` both are.
- Local run: `python3 -m http.server 8000`, then http://localhost:8000. ES modules do not load from `file://`.
- Mutation threshold (TS-12): no real survivor in `src/domain/` and `src/storage/`, as the gate measures on merge. A survivor counts unless the verifier marks it equivalent.
- Licence: MIT (SPDX `MIT`), in `LICENSE` at the root (A-15).

## Consequences
- Anyone with Node 22 and Python can run and test the app with no install step, and the app has no supply chain to scan (SE-14 and DR-02 have nothing to bite on).
- Every convenience a framework gives (rendering, state, routing) is written by hand and kept small; ADR-003 and ADR-005 say how.
- Rendering code under `src/ui/` cannot be run under Node without a DOM library, which is ruled out, so DOM behaviour is covered by manual checks.
- An agent that hits the edge of this decision writes NEEDS HUMAN and stops.

## Not decided here
- Where the app is hosted and what the browser is told about it: ADR-008.
- Visual design, fonts and icons: `docs/UI-SPEC.md`. A font or icon set from outside the repository is a dependency under this ADR.
- JS-02 in the kit still says `node --test`. Whether the kit changes is the kit owner's call; this project follows the line above.

## Answered
