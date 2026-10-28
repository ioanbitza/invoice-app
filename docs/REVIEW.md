# Review, cycle 2
Reviewed: 84ea41f (main..HEAD, 21 commits)   Date: 2026-10-28
Finders: correctness, security, contract (opus)   Verifier: opus (reported)   Author: sonnet
Gate: GATE PASS, tests 61 passed, 0 failed   Mutations: 209 planted, 206 caught, 3 survived
  survived (equivalent): src/domain/customers.js:17 ">" -> ">=" (Only the domain.length > 0 operand
      can survive. The local operand is killed by the '@b.com' refusal test. A domain that passes
      includes('.') && !startsWith('.') && !endsWith('.') is already at least 3 characters long, so
      domain.length >= 0 accepts the same inputs.)
  survived (equivalent): src/domain/customers.js:17 "0" -> "1" (Same reasoning. local.length > 1
      would refuse 'a@b.c', which a test accepts, so it is caught. domain.length > 1 is implied by
      the dot rules, because a valid domain has at least 3 characters.)
  survived (equivalent): src/domain/orders.js:45 "<" -> "<=" (Line 45 runs only when a.date !==
      b.date, so a.date < b.date and a.date <= b.date give the same result.)

## Confirmed (6)
F-15  COR-9  advisory  code  src/ui/lines-view.js:4  R-13  lineView.editingLineId is module-level
      state. Only a successful submit (line 106) and Cancel (line 85) reset it. The Back button
      (orders-view.js:136, show() at 17-21) does not. If the user clicks Edit on a line, then Back,
      then reopens the same order, the form opens as 'Edit line' with that line's values filled in,
      not as 'Add line'.
      evidence: Traced the path: buildRow Edit sets lineView.editingLineId = line.id (line 48). Back
      calls show(root, ctx, 'list'), which never touches lineView. When the order reopens, buildForm
      line 73 runs order.lines.find((l) => l.id === lineView.editingLineId), finds the line again
      and renders the edit form. No data is lost unless the user then saves over it, so this is
      advisory.
      route: reopen S7
F-16  COR-8  advisory  code  src/ui/app.js:25  R-05  The error banner is cleared only after a
      successful commit. A refusal stays on screen across tabs and screens and then sits above
      unrelated content, for example the 'This customer has 1 order...' refusal shown on the Orders
      tab.
      evidence: grep shows clearError() called only at app.js:60, inside commit() after a successful
      save. switchTab (65-68), orders-view show() (17-21) and the customer view navigation never
      call it. customers-view.js:113 calls ctx.showError(result.errors.orders) when a delete is
      refused. The message is correct when it first shows, so this is advisory.
      route: reopen S6, S7
F-17  COR-7  advisory  code  tests/lines.test.js:6  R-11  stateWith() always builds exactly one
      order (o1), so the tests cannot tell whether changeOrder writes lines only to the target
      order. A regression that wrote the new lines to every order would pass every lines test and
      corrupt the other orders.
      evidence: tests/lines.test.js:6-9 has orders: [order] only, and grep finds no 'o2' in the
      file. The current code at src/domain/lines.js:33 is correct, so this is a test gap and not a
      live defect.
      route: reopen S4
F-18  COR-6  advisory  code  tests/customers.test.js:68  R-03  Every updateCustomer test (lines
      68-89) uses stateWith([ana]) with a single customer. A regression that overwrote every
      customer with the edited fields would pass all R-03 tests.
      evidence: Read tests/customers.test.js:68-89: there is one customer in every updateCustomer
      call and no assertion that a second customer stays unchanged. The current code at
      src/domain/customers.js:49 is correct, so this is a test gap and not a live defect.
      route: reopen S2
F-19  CON-10  advisory  plan  src/ui/app.js:46  R-18  The F-07 fix replaces the main area with one
      message on a load error. PLAN S6 step 2 and the ticked R-18 manual check (MANUAL-CHECKS.md:12,
      'forms are disabled') still describe disabled forms, so the plan and that check no longer
      match the screen. R-18 itself still holds: nothing is written over the data.
      evidence: docs/PLAN.md:143 says 'On a load error it shows the banner and disables all forms.'
      app.js:35-46 calls showLockedMessage(), which runs main.replaceChildren(message).
      docs/MANUAL-CHECKS.md:12 still says 'forms are disabled'. Line 28 says 'there are no forms'.
      route: re-plan: /sdlc-kit:plan-slices with the finding
F-20  CON-11  advisory  code  src/ui/orders-view.js:45  R-18  Commit f558ef5 'S7: fix F-07, F-10
      (R-10, R-18)' contains no F-07 change and names R-18, which S7 does not cover. The commit
      message traces a requirement to the wrong slice.
      evidence: git show f558ef5 changes only orders-view.js:45 (the F-10 filter reset) and adds the
      F-10 manual-check line. The F-07 code is in abf900c (S6). PLAN S7 says 'Covers on screen:
      R-07..R-16, R-20, R-21', and the coverage check puts R-18 in S5 and S6 only.
      route: reopen S7

## Watch list (2)
        SEC-8  advisory  src/ui/app.js:5  R-18  window.localStorage is read at module top level with
      no try around it. If the browser blocks site data and the getter throws a SecurityError, the
      module stops before load() and render() run. The page stays blank and shows no banner.
      evidence: app.js:5 is `const store = createStore(window.localStorage);` with no try. store.js
      wraps only getItem.
      why unproven: Whether the getter throws depends on the browser and its settings. The guard
      does not allow a browser run in this session.        how to settle: In Chrome, block all site
      data for localhost, serve with python3 -m http.server 8000, open http://localhost:8000, and
      check whether the banner shows or main is blank with a SecurityError in the console.
        SEC-9  advisory  src/ui/app.js:22  R-01  crypto.randomUUID exists only in secure contexts.
      Served over plain http on a LAN IP, newId would throw inside the submit handlers, and Add
      customer, New order and Add line would fail with no message on the page.
      evidence: app.js:22 has `newId: () => crypto.randomUUID()`, called unguarded from the view
      submit handlers. The documented run path (AGENTS.md: http://localhost:8000) is a secure
      context, where the call works.
      why unproven: This needs a browser on a non-localhost http origin, which is outside the
      documented run path and was not run here.        how to settle: Serve with python3 -m
      http.server 8000, open http://<LAN-IP>:8000, add a customer, and watch the page and the
      console for a TypeError.

## Refuted (9)
      F-01  Fixed in 5a31758. The test 'R-05 delete refuses a customer with exactly one order'
      (tests/customers.test.js) asserts ok false and orderCount 1. In this session's mutate.mjs run,
      the customers.js:55 mutant is no longer among the survivors.
      F-02  Fixed in 149dd6d. tests/orders.test.js now asserts unknown.ok === false and
      unknown.state === undefined for updateOrderDate(state, 'nope', ...). The orders.js:30 mutant
      was caught in this session's run.
      F-03  Fixed in 149dd6d. tests/orders.test.js now asserts badDate.ok === false and
      badDate.state === undefined for '2026-02-30'. The orders.js:32 mutant was caught in this
      session's run.
      F-04  Fixed in c21a7a6. The test 'R-17 after loading existing data a save succeeds and a new
      store reads it back' in tests/store.test.js saves after a load of existing data. The
      store.js:61 mutant was caught in this session's run.
      F-05  Fixed in 149dd6d. The test 'R-09 deleting the only order works and an unknown id is
      refused when orders exist' covers both directions. The orders.js:38 mutant was caught in this
      session's run.
      F-06  Fixed in c4dd9a7. The tests 'R-13 edit of the only line of an order succeeds' and 'R-13
      edit of an unknown line on an order with lines is refused and changes nothing' cover both
      directions. The lines.js:47 mutant was caught in this session's run.
      F-07  Fixed in abf900c. app.js:46 now renders only showLockedMessage() when the load failed,
      so the empty-list messages can no longer appear. The manual check at MANUAL-CHECKS.md:28 is
      ticked.
      F-10  Fixed in f558ef5. orders-view.js:45 resets view.customerId to '' when that customer no
      longer exists. The manual check at MANUAL-CHECKS.md:29 is ticked.
      F-11  Fixed in 149dd6d. orders.js:54 now matches against `#${o.number}`, which still contains
      a plain '12'. The test 'R-10 a search written as #12 finds order number 12' passes.

## Trade-offs (0)

## Rejected by the human (cycle 1)
      F-08, F-09, F-12, F-13, F-14  note: Fix the six blocking ones and the three defects a user can
      see: the wrong empty message on a load error, the stale customer filter, and the #12 search.
      The stricter email rule is what I want, hand-edited data is out of scope for this build, the
      clickable orders in the customer view and the shared DOM helpers go to a later slice, and the
      CI pin is a repo chore I will do myself.

## Checklists
correctness: items 1-8 ran; fired: 4, 8; not run: none
security: items 1-8 ran; fired: 5, 8; not run: none
contract: items 1-9 ran; fired: 1, 8; not run: none

## Verdict: MERGE
Routes: reopen S7 (F-15, F-20); reopen S6, S7 (F-16); reopen S4 (F-17); reopen S2 (F-18); re-plan:
      /sdlc-kit:plan-slices with the finding (F-19).
Next: /sdlc-kit:ship.
Not checked: UI in a real browser (manual checks in docs/MANUAL-CHECKS.md).
