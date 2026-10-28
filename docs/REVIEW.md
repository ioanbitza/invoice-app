# Review, cycle 1
Reviewed: b00627a (main..HEAD, 12 commits)   Date: 2026-10-28
Finders: correctness, security, contract (opus)   Verifier: opus (reported)   Author: sonnet
Gate: GATE PASS, tests 55 passed, 0 failed   Mutations: 209 planted, 200 caught, 9 survived
  survived (equivalent): src/domain/customers.js:17 ">" -> ">=" (The surviving site is domain.length
      (the local.length site would accept '@b.com', which the R-02 test refuses). A domain that
      includes '.' and does not start or end with '.' has length at least 3, so >= 0 and > 0 agree.)
  survived (equivalent): src/domain/customers.js:17 "0" -> "1" (The surviving site is domain.length
      (local.length > 1 would refuse 'a@b.c', which the test accepts). The domain length is at least
      3 under the other conditions, so > 1 and > 0 agree.)
  survived: src/domain/customers.js:55 "0" -> "1"
  survived: src/domain/lines.js:47 "===" -> "!=="
  survived: src/domain/orders.js:30 "false" -> "true"
  survived: src/domain/orders.js:32 "false" -> "true"
  survived: src/domain/orders.js:38 "===" -> "!=="
  survived (equivalent): src/domain/orders.js:45 "<" -> "<=" (This line is reached only when a.date
      !== b.date, so a.date < b.date and a.date <= b.date give the same result.)
  survived: src/storage/store.js:61 "true" -> "false"

## Confirmed (14)
F-01  VER-1  blocking  code  tests/customers.test.js:91  R-05  Planted defect
      src/domain/customers.js:55 'orderCount > 0' -> 'orderCount > 1' survived. With it, a customer
      with exactly one order can be deleted, and that order is left with no customer. No test
      deletes a customer who has exactly one order.
      evidence: mutate.mjs: survived src/domain/customers.js:55 "0" -> "1". The R-05 refusal test
      uses 2 orders for c1 (lines 92-96), and 2 > 1 still refuses. The R-05 delete test uses 0
      orders.
      route: reopen S2
F-02  VER-3  blocking  code  tests/orders.test.js:76  R-08  Planted defect src/domain/orders.js:30
      'ok: false' -> 'ok: true' survived. An unknown order would return ok:true with no state.
      app.js commit() would then call store.save(undefined), and the stored data would be
      overwritten.
      evidence: mutate.mjs: survived src/domain/orders.js:30 "false" -> "true". Test line 79 checks
      only `.errors.order` and never checks `ok === false`. app.js lines 54-55 save result.state
      whenever result.ok is true.
      route: reopen S3
F-03  VER-4  blocking  code  tests/orders.test.js:76  R-08  Planted defect src/domain/orders.js:32
      (bad date) 'ok: false' -> 'ok: true' survived. The same path as VER-3 would save undefined
      over the stored data when the user enters an invalid date.
      evidence: mutate.mjs: survived src/domain/orders.js:32 "false" -> "true". Test line 78 checks
      only `.errors.date`.
      route: reopen S3
F-04  VER-6  blocking  code  tests/store.test.js:34  R-17  Planted defect src/storage/store.js:61
      'loaded = true' -> 'loaded = false' survived. After a reload of existing data, every save
      would be refused, so the app could no longer persist changes. No test saves after loading data
      that already exists.
      evidence: mutate.mjs: survived src/storage/store.js:61 "true" -> "false". In the R-17
      round-trip test, the second store only calls load() and never calls save().
      route: reopen S5
F-05  VER-5  blocking  code  tests/orders.test.js:91  R-09  Planted defect src/domain/orders.js:38
      '===' -> '!==' survived. Deleting the only order would be refused, and an unknown id on a
      non-empty list would be accepted. The unknown-order test uses an empty orders list.
      evidence: mutate.mjs: survived src/domain/orders.js:38 "===" -> "!==". Test line 92 is
      deleteOrder(stateWith([]), 'nope'), and some() on [] is false either way. The R-09 delete test
      has 2 orders.
      route: reopen S3
F-06  VER-2  blocking  code  tests/lines.test.js:88  R-13  Planted defect src/domain/lines.js:47
      '===' -> '!==' survived. Editing the only line of an order would be refused, and editing an
      unknown line on a non-empty order would report success. The unknown-line test uses an order
      with no lines.
      evidence: mutate.mjs: survived src/domain/lines.js:47 "===" -> "!==". Test line 89 is
      updateLine(stateWith(), ...) with lines []. The R-13 edit test has 3 lines.
      route: reopen S4
F-07  COR-3  advisory  code  src/ui/app.js:19  R-18  When stored data cannot be loaded, ctx.state
      falls back to a copy of the empty state kept in the UI. Next to the error banner, the lists
      then say 'No customers yet. Use "Add customer"...', although the data exists and every control
      is disabled.
      evidence: app.js line 14 defines emptyState and line 19 returns it when store.current() is
      null, which is the case after a failed load (store.js lines 57-58 leave state null).
      customers-view.js buildResults shows the 'No customers yet' text when customers.length === 0.
      disableForms (app.js line 48) disables the Add button.
      merged: CON-4
      route: reopen S6, S7
F-08  COR-4  advisory  requirement  src/storage/store.js:25  R-18  The load check tests types only.
      Hand-edited data loads as valid in four cases: nextOrderNumber at or below an existing order
      number (the next order then reuses a number, against A-04), an order whose customerId points
      to no customer, duplicate ids, and negative amounts (formatEuros(-5) gives '€-1.-5'). The
      app's own UI cannot produce any of these states.
      evidence: hasValidShape (lines 25-29) calls only isObject, Number.isInteger and typeof string
      checks. The object
      {version:1,nextOrderNumber:1,orders:[{number:1,...,lines:[{quantity:-3,unitPriceCents:-5}]}]}
      passes every check. addOrder (orders.js line 19) assigns state.nextOrderNumber, which is 1
      again. formatEuros: Math.floor(-0.05) is -1 and String(-5 % 100).padStart(2,'0') is '-5'.
      Traced by reading the code: node one-liners are refused by the guard in this session.
      merged: SEC-1, SEC-2, SEC-3
      route: question to the human: Q-04 in docs/REQUIREMENTS.md
F-09  COR-1  advisory  code  src/domain/customers.js:18  R-02  The email rule is stricter than R-02.
      A domain part that starts or ends with a dot ('a@b.com.', 'a@.com') has one @, text on both
      sides and a dot after the @, yet it is refused. PLAN S2 Risks says 'nothing stricter'.
      tests/customers.test.js line 46 locks in the refusal of 'a@.'.
      evidence: isValidEmail returns false when domain.startsWith('.') or domain.endsWith('.'). For
      'a@b.com.', the domain 'b.com.' ends with '.', so validateCustomer sets errors.email. Severity
      is advisory: no data is lost, and the refused inputs are not deliverable addresses.
      merged: CON-1
      route: reopen S2
F-10  COR-5  advisory  code  src/ui/orders-view.js:49  R-10  The order filter keeps view.customerId
      after that customer is deleted. Back on the Orders tab, the select has no matching option, but
      the filter still applies, so 'No orders match your filter.' shows while orders exist.
      evidence: view.customerId is module state (line 8) and is never reset. R-05 lets a customer be
      deleted only when they have no orders, so filterOrders with that customerId returns [].
      buildResults line 73 then shows the no-match text. The user can recover by picking 'All
      customers'.
      route: reopen S7
F-11  COR-2  advisory  code  src/domain/orders.js:54  R-10  The list shows order numbers as '#12'
      (orders-view.js line 81), but typing '#12' in the filter finds nothing, because the needle is
      compared with String(o.number).
      evidence: For needle '#12', '12'.includes('#12') is false, and no customer name contains '#',
      so the result is [].
      route: reopen S3
F-12  CON-2  advisory  plan  src/ui/customers-view.js:102  R-04  PLAN S7 step 4 ('opening an order
      from the customer view') is not done. The customer's order rows are plain text, and app.js
      wires only the tab switching.
      evidence: customers-view.js line 102 is el('td', `#${order.number}`) with no button. app.js
      lines 65-71 hold only switchTab. customers-view.js is not on the S7 Files line (PLAN line
      164), so the plan made the step impossible inside S7. R-04 itself (fields, orders, totals) is
      met.
      route: re-plan: /sdlc-kit:plan-slices with the finding
F-13  CON-6  advisory  plan  src/ui/lines-view.js:7  none  The DOM helpers el and button exist
      twice. lines-view.js exports them for orders-view.js, and customers-view.js keeps its own
      copy.
      evidence: lines-view.js lines 7-18 export el and button, orders-view.js line 6 imports them,
      and customers-view.js lines 9-20 repeat them. The S6 and S7 Files lines name no shared UI
      module.
      route: re-plan: /sdlc-kit:plan-slices with the finding
F-14  SEC-7  advisory  requirement  .github/workflows/gate.yml:16  none  CI checks out
      ioanbitza/sdlc-kit without a ref or sha and runs its gate.mjs. A change upstream changes what
      CI enforces, with no change in this repository.
      evidence: gate.yml: the second actions/checkout step has repository and path but no 'ref:',
      followed by 'node .sdlc-kit/tools/gate.mjs --strict'. ADR-002 does not say whether the gate
      version is pinned.
      route: question to the human: Q-05 in docs/REQUIREMENTS.md

## Watch list (5)
        SEC-4  advisory  src/ui/app.js:5  R-18  window.localStorage is read at module top level with
      no try. In a browser that blocks site data, the getter throws a SecurityError, the module
      stops, and no banner is shown.
      evidence: Line 5: const store = createStore(window.localStorage); store.load guards only
      getItem.
      why unproven: Needs a browser with site data blocked; no browser was available in this
      session.        how to settle: In Chrome, block all site data for localhost, reload
      http://localhost:8000, and check whether the banner shows an error or the page is blank.
        SEC-5  advisory  src/ui/app.js:23  R-01  crypto.randomUUID exists only in secure contexts.
      Served over plain http on a LAN IP, newId throws inside the submit handlers, and Add customer,
      New order and Add line fail without a message on the page.
      evidence: newId is called unguarded at customers-view.js:158, orders-view.js:123 and
      lines-view.js:105. AGENTS.md documents localhost, which is a secure context.
      why unproven: Needs a browser on a non-localhost http origin; the documented run uses
      localhost, where this does not happen.        how to settle: Serve with python3 -m http.server
      8000, open http://<LAN-IP>:8000, add a customer and watch the console and the page.
        CON-3  advisory  src/ui/customers-view.js:95  R-20  The empty state 'This customer has no
      orders yet.' offers no next action, such as creating an order for this customer.
      evidence: The text is el('p', 'This customer has no orders yet.'). R-20 names 'no orders' but
      does not say whether a customer's own order list is one of its states.
      why unproven: R-20 can be read either way. The code behaviour is clear, but whether it breaks
      the requirement is not.        how to settle: The human says whether R-20 covers the customer
      view's order list; if it does, add a 'New order for this customer' action (this needs
      customers-view.js in a slice).
        CON-5  advisory  src/ui/lines-view.js:20  R-12  centsToInput formats cents as euro text in
      the UI, repeating the arithmetic of formatEuros from money.js.
      evidence: lines-view.js line 20-21. PLAN line 'Text becomes cents only in src/domain/money.js'
      covers text to cents, not cents to text.
      why unproven: Whether cents-to-input-text is a business rule under AGENTS.md is a judgement no
      rule settles.        how to settle: The human decides; if yes, move it to money.js with a test
      such as 'R-13 1250 cents edits as "12.50"'.
        CON-8  advisory  docs/MANUAL-CHECKS.md:5  none  Commit b00627a ticks every manual check at
      once under 'Manual checks'. Nothing in the repository shows which checks a human actually ran.
      evidence: git log shows b00627a by Bita Ioan with every '- [ ]' changed to '- [x]'. ADR-002
      says the human ticks only the checks they ran. Rule 8 applies to slice commits, and this is
      not a slice commit.
      why unproven: Authorship cannot show whether the checks were performed.        how to settle:
      The human confirms in their own terminal that they ran each ticked check, or unticks the ones
      not run.

## Refuted (3)
      CON-7  PLAN line 11 prescribes exactly this: 'The store in src/storage/ gets the storage
      object injected (createStore(storage))'. app.js line 5 only passes the reference, and every
      getItem/setItem call is in src/storage/store.js.
      CON-9  ADR-002 line 34, a human decision, says the one gate script 'runs in the Claude hooks,
      in the git hooks and in CI'. .githooks/ and .github/workflows/ are the enforcement files that
      ADR decided, not app folders under AGENTS.md rule 5.
      SEC-6  The banner is set with textContent (app.js line 27), so nothing can run as markup. The
      message text comes from the user's own data in their own browser (A-01: one user, one
      browser). R-18 requires that an error be shown. No rule or requirement is broken.

## Trade-offs (0)

## Checklists
correctness: items 1-8 ran; fired: 1, 3, 4, 5, 6, 7, 8; not run: none
security: items 1-8 ran; fired: 4, 5, 6, 8; not run: none
contract: items 1-9 ran; fired: 1, 2, 3, 4, 8, 9; not run: none

## Verdict: FIX FIRST
Why: 6 blocking findings confirmed; 6 planted defects survived.
Routes: reopen S2 (F-01, F-09); reopen S3 (F-02, F-03, F-05, F-11); reopen S5 (F-04); reopen S4
      (F-06); reopen S6, S7 (F-07); question to the human: Q-04 in docs/REQUIREMENTS.md (F-08);
      reopen S7 (F-10); re-plan: /sdlc-kit:plan-slices with the finding (F-12, F-13); question to
      the human: Q-05 in docs/REQUIREMENTS.md (F-14).
Next: say accept or reject for each F-id, then: node review.mjs decide --cycle 1 --accept <F-ids>
      --reject <F-ids> --note "<your words>"
      /sdlc-kit:implement-slice S2 F-01 F-09
      /sdlc-kit:implement-slice S3 F-02 F-03 F-05 F-11
      /sdlc-kit:implement-slice S4 F-06
      /sdlc-kit:implement-slice S5 F-04
      /sdlc-kit:implement-slice S6 F-07
      /sdlc-kit:implement-slice S7 F-07 F-10
      then /sdlc-kit:review-change --cycle 2.
Not checked: UI in a real browser (manual checks in docs/MANUAL-CHECKS.md).
