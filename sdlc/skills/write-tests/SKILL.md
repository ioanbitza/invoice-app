---
name: write-tests
disable-model-invocation: true
description: Write the tester's acceptance tests from the approved plan, one tests/<area>.spec.mjs per domain or storage slice, before the builder runs; each spec self-skips until its module exists. Use after the plan is approved, before implement-slice or build-slices.
argument-hint: [S<n> S<m> ...]
---

# Write the acceptance tests

## How this skill runs
You are the clerk: you write nothing yourself. Launch the tester with the Agent tool, `subagent_type` `sdlc:tester`, model unset (the agent file names it), and give it as its whole prompt the text from "## Brief" to the end of this file with the argument `$ARGUMENTS` on the first line. The agent's write scope is enforced by the hooks (`x-writes` in `agents/tester.md`); the main session has no right to its files, so do not retry a denied write yourself. When it returns, reply with its report verbatim and nothing else.

## Brief

You are the tester agent. You run in a fresh context: read the files, assume nothing from a conversation you did not see. The kit root is `${CLAUDE_PLUGIN_ROOT}`; the commands below use it as written. Slices to cover: `$ARGUMENTS` (empty means every domain and storage slice of the plan).

## Steps
0. `grep -m1 '^Status:' docs/PLAN.md` must say `Status: approved`, and `docs/REQUIREMENTS.md` too; otherwise stop and say so. Tests are written against a frozen plan, so the builder and you read the same contract.
1. `node "${CLAUDE_PLUGIN_ROOT}/tools/profile.mjs" tester` and read every skill it lists once. Read `AGENTS.md`, `docs/REQUIREMENTS.md`, `docs/PLAN.md`, every `docs/decisions/ADR-*.md`, and `.claude/skills/domain-*/SKILL.md` when it exists.
2. For each slice in scope that is not a UI slice (no file under `src/ui/`, no `index.html`, no `styles.css` on its `**Files:**` line): note its `**Covers:**` ids, the module paths on its `**Files:**` line and the titles under **Tests first**.
3. Write `tests/<area>.spec.mjs` per slice with the Write tool, `<area>` being the slice's subject (`customers`, `orders`, `storage`), with the self-skip below at the top and one or more tests per requirement, every title starting with the `R-xx` id. The scope guard allows `tests/**/*.spec.mjs` and nothing else; if it denies a write, stop and report.
4. `node --test tests/<area>.spec.mjs` per file: it loads, and every test is reported `# SKIP S<n> not built yet` while the module is missing (or runs green when the slice is already built). A file that throws on load is yours to fix.
5. `node "${CLAUDE_PLUGIN_ROOT}/tools/trace.mjs" --listed`: every requirement you covered now shows `test: <area>.spec.mjs`.

## The self-skip pattern, complete example
`tests/orders.spec.mjs` for a slice `S3` whose `**Files:**` line names `src/domain/orders.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

// S3 not built yet: every test below is skipped until the builder creates the module, then it runs and must pass.
const built = existsSync(new URL('../src/domain/orders.js', import.meta.url));
const skip = built ? false : 'S3 not built yet';
const { newOrder, addLine, orderTotal } = built ? await import('../src/domain/orders.js') : {};

test('R-06 a new order has no lines and a total of zero cents', { skip }, () => {
  const order = newOrder({ customerId: 'c1' });
  assert.deepEqual(order.lines, []);
  assert.equal(orderTotal(order), 0);
});

test('R-07 order total sums its lines in integer cents', { skip }, () => {
  const order = addLine(addLine(newOrder({ customerId: 'c1' }), { cents: 250, qty: 1 }), { cents: 199, qty: 2 });
  assert.equal(orderTotal(order), 648);
});

test('R-08 a line with a zero quantity is rejected with a visible error', { skip }, () => {
  assert.throws(() => addLine(newOrder({ customerId: 'c1' }), { cents: 100, qty: 0 }), /quantity/);
});
```
Why this shape: a static `import` of a missing module throws at load and turns the whole gate red for the slices before `S3`; the `existsSync` check plus the dynamic import after it keeps the file loadable, and `{ skip }` becomes `false` the moment the module exists, so from then on these are ordinary tests the builder has to make pass. `node --test` counts a skipped test as skipped, never as passed, so the trace still sees the `R-xx` titles while nothing is claimed green.

## Rules
- Titles: `R-xx` first, then the behaviour in the requirement's words. One requirement per test; several tests per requirement are welcome.
- Assertions are exact (`assert.equal`, `assert.deepEqual`, `assert.throws` with a message or class). No `assert.ok(true)`, no `test.skip`, no `.only(`: the guard refuses them, and the verifier plants defects later to prove each test can fail.
- Imports use the plan's paths only. A path the plan does not name is a finding for the plan, not a new file.
- The builder never edits a `.spec.mjs` file; it adds its own tests in `.test.*` files. When a spec is wrong, the human asks you to change it.

## Report
```
Written: tests/customers.spec.mjs  S1  R-01, R-02, R-03  (7 tests, skipped until src/domain/customers.js exists)
Written: tests/orders.spec.mjs     S3  R-06..R-08        (3 tests, skipped until src/domain/orders.js exists)
Not covered by a spec: R-09, R-10 (UI, manual checks in the plan)
Trace: 10 MUST, 0 missing, 0 orphan IDs
```
Then one line on what you could not test as written, if anything.
