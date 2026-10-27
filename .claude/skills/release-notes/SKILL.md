---
name: release-notes
description: "Write docs/RELEASE-NOTES.md from git log and docs/TRACE.md: one line per shipped requirement with its commit, grouped by slice; LATER items listed as not shipped. Use after /sdlc-kit:ship."
---

# Release notes

1. Read `docs/TRACE.md`. If it is missing, stop and say to run `/sdlc-kit:ship` first.
2. Run `git log --oneline` and map each `S<n>: ... (R-xx, R-yy)` commit to its slice and requirement IDs.
3. Write `docs/RELEASE-NOTES.md`:
   - A `# Release notes` title and a `Built from: <short sha of HEAD>` line.
   - One `## S<n>: <slice title>` section per slice, in slice order.
   - Under it, one line per shipped requirement: `- R-xx <requirement summary> (<short sha>)`.
   - A final `## Not shipped` section listing every requirement TRACE.md marks `LATER`, with its reason.
4. A requirement in TRACE.md without a matching commit is not shipped: list it under `## Not shipped` as `no commit found`, never invent a sha.
5. Show the user the full file content.
