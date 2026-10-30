---
name: setup-delivery
description: Set up the delivery of the static app in the devops agent: a GitHub Pages workflow (.github/workflows/pages.yml) and the runbook (docs/RUNBOOK.md), committed through the gate. Use once the first slices are built, before ship.
disable-model-invocation: true
---

# Set up the delivery

## How this skill runs
You are the clerk: you write nothing yourself. Launch the devops role with the Agent tool, `subagent_type` `sdlc:devops`, model unset (the agent file names it), and give it as its whole prompt the text from "## Brief" to the end of this file. The agent's write scope is enforced by the hooks (`x-writes` in `agents/devops.md`); the main session has no right to its files, so do not retry a denied write yourself. When it returns, reply with its report verbatim and nothing else.

## Brief

You are the devops agent. You run in a fresh context: read the files, do not assume anything from a conversation you did not see. The kit root is `${CLAUDE_PLUGIN_ROOT}`; the commands below use it as written.

No slice may be active: if `.sdlc/slice` exists, stop and say which slice is still open (a slice commit may hold only the slice's files).

## Steps
1. Read `AGENTS.md`, every `docs/decisions/*.md`, and every skill `node "${CLAUDE_PLUGIN_ROOT}/tools/profile.mjs" devops` lists (the release rules `DR-nn`; the review cites them by id). If an ADR names another host than GitHub Pages or a build step, stop and report it: this skill deploys static files as they are.
2. `node "${CLAUDE_PLUGIN_ROOT}/tools/delivery.mjs" branch` prints the default branch (from `origin/HEAD`, else the current branch). `git remote get-url origin` must name a repository on github.com; if there is no origin, stop and report that the human adds the remote first.
3. Read `${CLAUDE_PLUGIN_ROOT}/templates/github-workflow-pages.yml`, replace `__DEFAULT_BRANCH__` with the branch from step 2, and write the result to `.github/workflows/pages.yml` with the Write tool. Change nothing else in it: the actions stay pinned to their major versions, `permissions` stay per job (`contents: read`, `pages: write`, `id-token: write`), `concurrency` stays `pages`, `timeout-minutes` stays, the copy step keeps `docs/`, `tests/`, `.github/`, `.githooks/`, `.sdlc/` and `.claude/` out of the site.
4. `node "${CLAUDE_PLUGIN_ROOT}/tools/delivery.mjs" check` reads the workflow back and prints what is wrong, or nothing. Fix the workflow until it prints nothing.
5. `node "${CLAUDE_PLUGIN_ROOT}/tools/delivery.mjs" url` prints `Live: https://<owner>.github.io/<repo>/`, computed from the origin remote. Never type the URL by hand.
6. Read `${CLAUDE_PLUGIN_ROOT}/templates/RUNBOOK.md`, replace `__DEFAULT_BRANCH__` and `__PAGES_URL__` (the URL from step 5, without the `Live: ` prefix), and write the result to `docs/RUNBOOK.md` with the Write tool. Keep every section: run locally (`python3 -m http.server`), the CI gate (`gate.yml` from init, never edited here), deployment and where the URL appears, the one setting the human switches once (Settings > Pages > Source: GitHub Actions), roll back (revert the commit, the workflow redeploys), logs.
7. `git status --short`: only the two files changed. Then `node "${CLAUDE_PLUGIN_ROOT}/tools/gate.mjs"`.
8. Commit both in one command: `git add .github/workflows/pages.yml docs/RUNBOOK.md && git commit -m "Delivery: GitHub Pages workflow and runbook"` (no slice is active, so a docs-and-setup commit takes a plain message).

## Report (under ten lines)
```
pages.yml   written   <hash>   deploys <branch> to GitHub Pages
RUNBOOK.md  written   <hash>
Live: https://<owner>.github.io/<repo>/   (after the first push to <branch>)
Human, once: Settings > Pages > Build and deployment > Source: GitHub Actions; then push.
Not computed: <what, or none>
```

## Never
- Edit `.github/workflows/gate.yml`, anything under `.githooks/`, `AGENTS.md`, `.claude/settings.json` or `.sdlc/`.
- Run `gh`, push, tag, or change a remote. The human enables Pages and pushes (ADR-002).
- Guess the owner, the repository, the branch or the URL.
