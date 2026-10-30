# Review, cycle 1
Reviewed: 21f920b (main..HEAD, 29 commits)   Date: 2026-10-30
Finders: correctness, security, contract, legal (opus)   Verifier: fable (reported)   Author: sonnet
Gate: GATE PASS, tests 421 passed, 0 failed   Mutations: 254 planted, 244 caught, 10 survived
  survived (equivalent): src/domain/customers.js:4 "<" -> "<=" (compareById is only reached as a
      tie-break between two different customers, whose ids are unique (shape.js:40 refuses
      duplicates, deps.newId is a UUID), so a.id === b.id never occurs and the equality branch never
      runs; sort uses only the sign.)
  survived (equivalent): src/domain/customers.js:4 "1" -> "2" (-1 became -2: Array.prototype.sort
      reads only the sign of the comparator, so every order is unchanged.)
  survived (equivalent): src/domain/customers.js:4 ">" -> ">=" (Same reason as the < mutant: with
      unique ids the operands are never equal, so > and >= answer the same for every pair the sort
      passes.)
  survived (equivalent): src/domain/customers.js:4 "1" -> "2" (-1 became -2: Array.prototype.sort
      reads only the sign of the comparator, so every order is unchanged.)
  survived (equivalent): src/domain/customers.js:4 "0" -> "1" (The 0 branch is reached only when
      a.id === b.id, which unique ids rule out for any two distinct customers, so the value is never
      returned.)
  survived (equivalent): src/domain/lines.js:20 "+" -> "-" (sumIsExact only tests
      Number.isSafeInteger(sum); subtracting every line total from 0 gives exactly the negation of
      the sum (IEEE 754 negation is exact and addition is sign-symmetric), and isSafeInteger is
      symmetric in sign, so the answer is identical for every input.)
  survived: src/domain/lines.js:20 "0" -> "1"
  survived (equivalent): src/domain/orders.js:15 "<" -> "<=" (The line runs only inside if (a.date
      !== b.date), so the two date strings are never equal and < and <= give the same answer.)
  survived: src/domain/validation.js:7 "5" -> "6"
  survived: src/storage/storage.js:31 "false" -> "true"

## Confirmed (45)
F-01  COR-1  blocking  code  src/ui/views/order-view.js:279  R-21  A failed line save on a long
      order shows no error in view: the banner lands under the h1 while focus jumps to Save far
      below, so the form reads as if Save did nothing.
      evidence: order-view.js:277 commit fails, :279 showBanner(code); main.js:64
      querySelector('[data-banner-region]') returns the one region the view placed at :335 directly
      under the h1, and lineForm (:136-154) builds no region of its own. :280 ui.save.focus() then
      scrolls the Save button into view. styles.css:54 sets --row-height 2.75rem, so 20 lines put
      55rem (880px) between the banner and Save, beyond a usual viewport. UI-SPEC lines 130 and 438:
      with a form open the banner goes at the top of that form's panel; line 425 keeps the page
      region only for Remove. R-21 is a MUST (the app shows an error) and storage full plus a long
      order is an input a user can produce (MANUAL-CHECKS.md:117 describes filling storage). The
      banner keeps role=alert, so only sighted users miss it.
      merged: CON-23
      route: reopen S15, S16
F-02  VER-3  blocking  code  tests/storage.test.js:24  R-20  No test pins the write lock after a
      load whose getItem throws: a planted defect that leaves canWrite true survives, so save()
      would write over a store that could not be read.
      evidence: mutate.mjs: storage.js:31 'canWrite = false' became 'canWrite = true' and all 421
      tests passed. With the mutant, a backing whose getItem throws returns unavailable at :36 with
      canWrite still true, so save() at :48 skips the blocked answer and calls setItem; the original
      answers { ok: false, reason: 'blocked' }. ADR-004 line 37: save answers blocked until the last
      load or erase succeeded, and a test can prove it. tests/storage.test.js:24 covers save before
      any load and nothing covers save after a throwing getItem; tests/storage.spec.mjs:335-507
      cover corrupt, newer and a throwing localStorage access, none of which this mutant changes.
      The UI never reaches the path today (main.js:191 renders the blocked screen), so no user loses
      data now.
      route: reopen S7
F-03  VER-1  blocking  code  tests/validation.test.js:115  R-11  The quantity rule is neither the
      one ADR-007 decided nor pinned by a test: a planted defect widening the pattern survives, and
      a zero-padded value such as 000005 is refused although it is 5.
      evidence: mutate.mjs: validation.js:7 /^\d{1,5}$/ became /^\d{1,6}$/ and all 421 tests passed.
      Input '000005': the original parseQuantity (:98) returns null and the form shows
      line.quantity.invalid; the mutant returns 5 and accepts the line, while '00005' passes both.
      ADR-007 line 15: quantity is trimmed text matching ^\d+$, then the range 1 to MAX_QUANTITY, so
      the mutant is closer to the decision than the code (COR-11, SEC-11, CON-11 report the same
      deviation). tests/validation.test.js:115-127 try '0', '10000', '2.0', '1e3', '-1', '', '+1',
      'two' and never a six-digit zero-padded value; tests/validation.spec.mjs:210-216 neither. Fix:
      the ADR-007 pattern plus tests that '000005' is stored as 5 and '100000' is refused by the
      range.
      merged: COR-11, SEC-11, CON-11
      route: reopen S2
F-04  VER-2  blocking  code  tests/lines.test.js:39  R-15  R-15 is tested only on its refusal side:
      a planted defect moving the safe-total boundary by one survives, and a total of exactly
      Number.MAX_SAFE_INTEGER would be refused.
      evidence: mutate.mjs: lines.js:20 reduce start value 0 became 1 and all 421 tests passed.
      Input: an order with one line of quantity 1 and unitPriceCents 9007199254740990 (a safe
      integer, accepted by shape.js:12), then addLine of quantity '1' at unit price '0.01': the
      original sums to 9007199254740991, Number.isSafeInteger true, ok; the mutant sums to
      9007199254740992, not safe, and answers line.total.too-large. tests/lines.test.js:39-44 and
      tests/lines.spec.mjs:229 assert only the refusal above the limit, never the largest accepted
      total. Through the forms the same total takes about 9008 largest lines, so no user meets it;
      the boundary test is still owed by AGENTS.md rule 2.
      route: reopen S5
F-05  COR-2  advisory  code  src/ui/views/order-view.js:320  R-08  Deleting an order while a dirty
      line form is open asks 'Discard your changes?' after the delete; Keep editing leaves the
      deleted order on screen, then Cancel throws APP-01 and Save line drops the typed text.
      evidence: deleteButton (order-view.js:178, listener :323) is never disabled while ui.open is
      true; only addButton (:206) and the row buttons (:74-75) are. Path: Add line, type 'x', Delete
      order, confirm. confirmDelete :315 commits, :320 location.replace('#/orders') leaves
      state.form set. main.js:182-184: the hash differs, form.isDirty() is true ('x' !== ''),
      askToDiscard opens. Keep editing: main.js:175 sets location.hash back to the deleted order's
      hash, which equals renderedHash, so :182 returns without a render and the stale screen stays.
      Cancel: cancelForm, closeForm, drawLines :205 currentOrder() is undefined and :207 now.lines
      throws TypeError, main.js:197 shows APP-01. Save line: addLine finds no order, NOT_FOUND, :274
      renderNotFound, the typed text is gone. Advisory: the user asked for the delete and only text
      typed for the deleted order is lost.
      route: reopen S15, S16
F-06  COR-3  advisory  code  src/ui/views/order-view.js:237  R-21  Keep editing throws APP-01 when
      focus was last on Save line or Cancel in the line form, which is exactly where a failed save
      puts it; Reload then loses the typed line.
      evidence: order-view.js:217-219 stores event.target.id on focusin; actionButton
      (components.js:11-16) sets no id, so when :280 ui.save.focus() runs after a failed save,
      ui.lastFocused becomes ''. Leave to another route with the dirty form: main.js:184
      askToDiscard, Keep editing :176 form.restoreFocus, order-view.js:237
      document.getElementById('') is null and .focus() throws TypeError; main.js:197 shows APP-01
      whose only action is Reload. customer-form.js:124 and order-form.js:216 guard the same case
      with lastFocused ? ... : first field; the line form does not.
      route: reopen S15, S16
F-07  COR-5  advisory  requirement  src/ui/views/customer-list.js:114  R-01  A newly saved customer
      is hidden by a search text kept from before: the user lands on 'No customers match this
      search.' right after saving.
      evidence: customer-list.js:97 input.value = state.searchCustomers and :114 showResults filters
      with it; customer-form.js:56 targets() sends a saved new customer to '#/customers' and nothing
      resets state.searchCustomers on the way. Input: search 'zzz', New customer, save 'Ana':
      searchCustomers(data, 'zzz') returns [] and the list shows the no-match state with 'zzz' in
      the box. R-01 (MUST): 'then the customer appears in the list'. ADR-005 line 46 (accepted):
      search texts 'survive moving between screens'. Both hold at once only if a save clears or
      bypasses the search, which neither document says; the human answers. Advisory: the customer is
      saved and the box shows why it is hidden.
      route: question to the human: Q-04 in docs/REQUIREMENTS.md
F-08  COR-4  advisory  code  src/ui/views/order-view.js:283  R-21  After a failed line save or
      Remove, a successful retry leaves the 'so this was not saved' banner on screen for a change
      that was saved.
      evidence: order-view.js:279 and :295 call showBanner into the region of :335; on a later
      success :283-284 (closeForm, addButton.focus) and :298-299 (drawLines, addButton.focus) touch
      only linesHolder, totalHolder and formHolder, and nothing empties the region before the next
      route render. UI-SPEC line 89: a banner leaves when its cause is gone. Message-only: the data
      is saved.
      merged: CON-24
      route: reopen S15, S16
F-09  COR-10  advisory  code  src/storage/shape.js:17  R-20  A document that passes the shape check
      can still make every order screen throw, so a hand-edited data set gives APP-01 with Reload
      instead of the R-20 blocked screen, and the records cannot be opened or deleted except through
      Erase all data.
      evidence: shape.js:17 checks date only with isText and :12 checks quantity and unitPriceCents
      only with isCount. Input 1 (SEC-1): an order with date 'not-a-date' loads ok; format.js:14 new
      Date('not-a-dateT00:00:00Z') is Invalid Date and Intl.DateTimeFormat.format throws RangeError
      from order-list.js:51, customer-detail.js:69 and order-view.js:30. Input 2 (SEC-2): quantity
      9007199254740991 and unitPriceCents 2 pass isCount; lineTotalCents gives about 1.8e16 and
      money.js:25 throws from orders.js:26 on #/orders and from order-view.js:91, so the order and
      its customer (R-04) stay locked; unitPriceCents -50 also passes and priceInputText gives
      '-1.-50'. main.js:197 shows APP-01 with Reload only. ADR-004 line 33 names the purpose of the
      check (no lock-out) and the sketch types date as YYYY-MM-DD, so a date format check and a
      safe-total check are the invariants the screens rely on, not form rules. Hand-edited data
      only.
      merged: SEC-1, SEC-2
      route: reopen S7
F-10  SEC-3  advisory  code  src/storage/shape.js:53  R-06, R-20  SE-02  The order-number invariants
      are not enforced on stored data: a negative or maximal nextOrderNumber makes the app write a
      document it refuses on the next load, and two orders can share a sequence number.
      evidence: shape.js:53 isCount accepts any safe integer. Input 1: nextOrderNumber -5 with no
      orders: orders.js:7 gives 'ORD-' + String(-5).padStart(4, '0') = 'ORD-00-5', save succeeds,
      and on the next load ORDER_NUMBER /^ORD-(\d+)$/ fails at shape.js:18, so the document the app
      itself wrote is corrupt. Input 2: nextOrderNumber 9007199254740991: createOrder stores
      9007199254740992, isCount is false, corrupt. SEC-4 (merged): 'ORD-1' and 'ORD-0001' are
      distinct strings for allUnique at :42 while orderNumberValue gives 1 for both and both sit
      below nextOrderNumber 2, so the document passes and two orders show the same sequence. ADR-004
      line 15: the counter starts at 1. Hand-edited data only.
      merged: SEC-4
      route: reopen S7
F-11  SEC-5  advisory  code  src/storage/storage.js:22  R-29  SE-02  Unknown keys in a stored
      document are kept, written back on every save and, on a customer, copied into the R-29 export,
      so personal data outside the sketch survives every delete.
      evidence: hasValidShape checks named fields only; storage.js:22 keeps every other key in data;
      commands spread ...data (customers.js:20, orders.js:44) and save :50 writes it back. Input: a
      root key backup holding a name and email survives deleting every customer, against the R-04
      banner text. Input: nationalId on a customer: export.js:11 structuredClone copies it into the
      export, while updateCustomer :29 rebuilds the record from id plus checked fields and drops it,
      so two paths disagree. ADR-004 line 12: the fields of the sketch 'and nothing added'; line 57:
      shape.js refuses rather than repairs. Hand-edited data only.
      route: reopen S7
F-12  SEC-6  advisory  code  src/storage/shape.js:8  R-28  SE-01  Stored ids are accepted as any
      string and put raw into the hash, so some hand-edited records cannot be opened or open another
      screen, and cannot be deleted through their own screen.
      evidence: shape.js:8 isText accepts '' and any text for id; router.js:51-57 interpolate r.id
      unencoded. Input id '': href '#/customers/', parseRoute :41 refuses the empty part, not-found.
      Input id 'new': '#/customers/new' opens the new-customer form (router.js:19). Input id 'a b':
      location.hash holds a%20b, parseRoute does not decode, the find at customer-detail.js:133
      fails, not-found. Line id '': order-view.js:229 treats '' as no line and Edit opens Add. The
      value stays inside the fragment, so no script URL results. The app's own ids are UUIDs;
      hand-edited data only.
      route: reopen S7
F-13  SEC-7  advisory  requirement  src/domain/validation.js:33  R-01, R-11  SE-02  A name or
      description made only of invisible characters passes the required-field check, so a customer
      or a line can be saved with no visible text.
      evidence: validation.js:33 trim() removes only ECMAScript WhiteSpace and LineTerminator
      (category Zs plus TAB, VT, FF, FEFF); U+200B is category Cf and stays. Input name '\u200B':
      length 1, lengthError at :62 passes, createCustomer stores it; customer-list.js:32 renders a
      row link with no visible text. Same path for description at :105-109. R-01's letter (1 to 100
      characters after trimming) is met, so whether invisible-only text counts as empty is the
      human's call.
      route: question to the human: Q-05 in docs/REQUIREMENTS.md
F-14  COR-15  advisory  requirement  src/ui/main.js:49  R-01  On a plain http origin other than
      localhost (a LAN address), crypto.randomUUID is undefined, so every create throws TypeError
      and shows APP-01; no customer or order can be added.
      evidence: main.js:49 deps.newId calls crypto.randomUUID() with no check; the Web Crypto IDL
      declares randomUUID [SecureContext], so on http://192.168.x.x:8000 the property is undefined,
      customers.js:19 throws TypeError and main.js:197 shows APP-01. ADR-008 line 11 names only
      http://localhost:8000/ and https://<owner>.github.io/<repo>/, both secure contexts, and its
      T-02 answer says real data runs 'from localhost or from an origin of their own'. The human
      says whether a LAN http origin is such an origin; if yes, newId needs crypto.getRandomValues,
      which has no secure-context limit. No browser ran here; the IDL is the evidence.
      route: question to the human: Q-06 in docs/REQUIREMENTS.md
F-15  COR-7  advisory  code  src/ui/views/customer-form.js:112  R-21  A storage failure on the
      customer or order form moves focus to the banner, so Save is not ready for a retry as the spec
      says.
      evidence: customer-form.js:112 and order-form.js:199 call showBanner(saved.code) and return;
      main.js:65 ends in setBanner(region, ...).focus(), so focus is on the banner. UI-SPEC line
      502: 'Failed Save, storage | stays on Save, ready to retry'. order-view.js:280 does it right
      with ui.save.focus().
      merged: CON-22
      route: reopen S11
F-16  COR-6  advisory  code  src/ui/main.js:162  none  Opening a route form puts focus on the h1,
      not on the first editable field, so a keyboard user must tab in.
      evidence: main.js:159-162 render() calls h1.focus() on whatever the screen returns;
      customer-form.js:130 and order-form.js:220 return h1. UI-SPEC line 499: a route that renders a
      form focuses the first editable field (Name; Customer select or Date; Date). restoreFocus
      (customer-form.js:124, order-form.js:216) already knows that field, so only the first render
      differs.
      merged: CON-21
      route: reopen S9, S10, S11, S12, S13, S14, S15
F-17  COR-8  advisory  code  src/ui/views/order-view.js:253  none  Cancel on an Edit line form
      always focuses Add line, never the Edit button that opened it.
      evidence: order-view.js:228-235: openForm stores the clicked Edit button as ui.opener and then
      drawLines() replaces every row (:207), which disconnects it; closeForm (:247) rebuilds again;
      cancelForm :253 finds opener.isConnected false and focuses addButton. UI-SPEC line 505: Cancel
      on the line form focuses the button that opened it. Add line keeps its node, so only Edit is
      affected.
      route: reopen S15, S16
F-18  COR-9  advisory  code  src/ui/views/order-view.js:114  R-18  The no-lines state has no Add
      line button in its panel while the h2 row keeps one, the reverse of the spec; the manual check
      was reworded to the built behaviour.
      evidence: order-view.js:113-115 appends only the paragraph for the empty state and :199
      appends addButton to the h2 row unconditionally. UI-SPEC line 438: the empty state holds 'Add
      line' (primary) inside the table panel and the h2 row's Add line is not shown then. PLAN S16
      says 'from the no-lines message, Add line opens the form'; MANUAL-CHECKS.md:116 says only 'the
      message shows and Add line opens the form' (CON-17).
      merged: CON-17
      route: reopen S15, S16
F-19  CON-18  advisory  code  src/ui/views/order-view.js:86  R-12  The row being edited shows its
      disabled Edit and Remove buttons instead of the text Editing.
      evidence: order-view.js:86 appends rowActions(line, position, ui.open) for every row,
      including the one with class row-editing (:81); the word Editing does not occur in the file.
      UI-SPEC line 84: 'Row being edited: --color-info-bg and the text Editing as its action cell'.
      route: reopen S15, S16
F-20  CON-19  advisory  code  src/ui/views/order-view.js:146  R-11  On desktop the line form stacks
      Quantity and Unit price instead of placing them side by side.
      evidence: order-view.js:146-151 appends the three fields and the buttons directly to the form
      with no .form-pair wrapper, the class customer-form.js:39 uses for email and phone. UI-SPEC
      line 437: desktop puts Quantity and Unit price side by side with gap --space-4.
      route: reopen S15, S16
F-21  CON-20  advisory  code  src/ui/main.js:150  R-28  An unknown id shows the not-found screen
      under the record screen's title and with a nav item marked current.
      evidence: main.js:150-156: for #/customers/x the parsed route is customer, markNav marks
      Customers current and document.title becomes 'Customer - Invoice app' before
      customer-detail.js:134 finds no record and renders not-found. UI-SPEC line 441: 'Not found -
      Invoice app'; line 125: neither nav item is current on the not-found screen;
      MANUAL-CHECKS.md:15 expects no current item.
      route: reopen S9, S10, S11, S12, S13, S14, S15
F-22  CON-25  advisory  code  src/ui/views/customer-list.js:37  R-03  In stacked rows a real email
      shows in normal text color, not muted.
      evidence: customer-list.js:37 gives a real email the class cell-email and only an empty one
      cell-muted; styles.css has .cell-muted (line 396) and no .cell-email rule. UI-SPEC line 197:
      stacked rows show the email in --color-text-muted.
      route: reopen S10
F-23  CON-26  advisory  code  styles.css:397  none  Row links look like plain bold text at every
      width instead of links.
      evidence: styles.css:397 .row-open { color: var(--color-text); font-weight:
      var(--weight-bold); text-decoration: none }. UI-SPEC line 84: the first cell holds an <a>
      styled as a link; line 82 gives links --color-primary text, underlined; line 197 asks for bold
      only in stacked rows.
      route: reopen S9, S10, S11, S12, S13, S14, S15, S16
F-24  CON-29  advisory  code  styles.css:395  none  The sticky table header never sticks while the
      page scrolls, because every table panel is an overflow: hidden scroll container.
      evidence: styles.css:395 .panel-table { overflow: hidden } wraps every table (customer-list.js
      panel('panel-table'), order-view.js:108); :423, :487, :538 and :611 set position: sticky on
      thead inside it from 64rem. CSS Positioned Layout 3, section 3.4: a sticky box is offset
      relative to its nearest scroll container ancestor, and overflow: hidden makes the panel one.
      The panel is as tall as its table and never scrolls, so the header moves with the page.
      UI-SPEC line 84 asks for sticky from 64rem.
      route: reopen S9, S10, S11, S12, S13, S14, S15, S16
F-25  CON-28  advisory  code  styles.css:314  none  Read-only inputs change border color on focus.
      evidence: styles.css:314 input:focus, select:focus, textarea:focus { border-color:
      var(--color-primary) } and :316 [readonly] { background: var(--color-bg) } with no exclusion.
      UI-SPEC line 83: read-only has 'no focus border change, ring still shown'.
      route: reopen S9, S10, S11, S12, S13, S14, S15, S16
F-26  CON-27  advisory  code  styles.css:186  none  Two motions of the spec are missing: the button
      press has no duration and the dialog backdrop does not fade.
      evidence: styles.css has no transition rule (grep finds none) and no keyframes; :186
      .button:active { transform: translateY(var(--press-offset)) } has no duration and :366
      dialog::backdrop { background } has no opacity change. UI-SPEC lines 527 and 529 give
      --duration-fast and --duration-base for them; --duration-fast is used only in :root.
      route: reopen S9, S10, S11, S12, S13, S14, S15, S16
F-27  CON-30  advisory  code  styles.css:264  none  A raw size sits outside :root, which the
      design-token check forbids.
      evidence: styles.css:264 .banner-text { flex: 1 1 12rem } carries a size that is no token.
      UI-SPEC line 7: a value not in the spec is NEEDS HUMAN, not a guess; MANUAL-CHECKS.md:24: no
      raw size outside :root.
      route: reopen S9, S10, S11, S12, S13, S14, S15, S16
F-28  COR-12  advisory  code  src/ui/format.js:8  R-14  Above 2^46 cents a shown total can be one
      cent off although addLine accepts it as safe; a theoretical limit at about 70 trillion euros.
      evidence: format.js:8 divides cents by 100 in double precision. For cents = 9007199254740987
      (safe, accepted by lines.js:21) the exact quotient 90071992547409.87 lies in [2^46, 2^47),
      where doubles are 1/64 apart: the nearest double is 90071992547409.875 and Intl.NumberFormat
      rounds that half to '...409.88', one cent above the stored total. Below 2^46 (about 7.04e15
      cents) the spacing is under 0.01 and the rounding is exact. Reaching it takes about 7042
      largest lines. Fix without a decision: format from integer division and remainder (as
      priceInputText does) or pass a decimal string to Intl.NumberFormat.format. Shown by
      arithmetic; not executed here.
      route: reopen S8
F-29  COR-16  advisory  code  tests/dates.test.js:5  R-06  No test covers years 0000 to 0099, so
      removing the setUTCFullYear line passes every test while '0099-01-01' would be refused.
      evidence: dates.js:9 setUTCFullYear(year) exists because Date.UTC maps 0 to 99 onto 1900 to
      1999. tests/dates.test.js:5-11 and tests/dates.spec.mjs:23 (accepts 2026-02-28, 2024-02-29,
      2000-02-29, 2026-12-31, 2026-01-01) and its refusal list use no year below 1000; grep for
      '00dd-' under tests/ finds nothing. The refusal list cannot catch the deletion because it only
      refuses more dates. mutate.mjs plants operator changes, not line deletions, so this gap is
      absent from the survivors list.
      route: reopen S1
F-30  CON-1  advisory  code  tests/storage.test.js  R-20  TS-02  S7's builder tests hold only part
      of the plan's Tests first list; the tester's specs are the only cover for 12 of 18 titles.
      evidence: PLAN.md:182-199 lists 18 S7 titles; tests/storage.test.js holds 5 tests and
      tests/shape.test.js 7, and 12 plan titles have no builder counterpart (lines 183-187, 189 on
      duplicate ids and numbers, 191, 192, 194, 195, 197, 198). storage.test.js:28 also drops 'and
      leaves the old text'. tests/storage.spec.mjs carries the rules, so nothing is untested; PLAN
      S7 step 1 ('Write the tests above') was not followed.
      route: reopen S7
F-31  CON-2  advisory  code  tests/lines.test.js  R-15  Four S5 plan tests are missing from the
      builder's file and exist only in the tester's spec.
      evidence: PLAN.md:138 (order of added lines), :141 (updateLine invalid price), :144
      (removeLine of the only line totals 0) and :146 (R-15 on updateLine) have no counterpart among
      the six tests of tests/lines.test.js; tests/lines.spec.mjs:66, 148, 186 and 229 hold them.
      route: reopen S5
F-32  CON-3  advisory  code  tests/customers.test.js:67  R-05  TS-02  S3 and S6 builder tests loosen
      plan titles: the R-05 test cannot tell sorting from insertion order and the export test checks
      only fragments of A-13 and A-14.
      evidence: tests/customers.test.js:67-76 uses ascending with c1 'Ana' before c2 'Bob', the
      insertion order, so ['c1', 'c2'] holds with no sort at all; tests/customers.spec.mjs:234
      proves the sort with a descending compare. tests/export.test.js:19-20 asserts endsWith('The
      data is used for nothing else.') and includes('there is no fixed period') for the plan's
      'states the purpose of A-13, the retention of A-14 and the currency EUR';
      tests/export.spec.mjs:77-98 hold the full texts.
      route: reopen S3
F-33  CON-4  advisory  code  src/ui/main.js:49  R-06  Production deps carry now while ADR-003 and
      every domain test use today, so the tests fake a key the app never supplies.
      evidence: ADR-003 line 31: deps carries newId and today. main.js:49 supplies { newId, now };
      tests/orders.test.js:5, customers.test.js:5 and lines.test.js:6 fake today: '2026-10-30';
      order-form.js:158 computes todayIso(deps.now) in the view. No domain command reads deps.today,
      so the behaviour is right and the contract is not.
      route: reopen S9, S10, S11, S12, S13, S14, S15
F-34  CON-5  advisory  code  src/ui/views/customer-detail.js:135  R-16  LY-10  Three views read
      navigator.language themselves instead of receiving it from the composition root.
      evidence: ADR-006 line 24 and ADR-003 line 33: navigator.language is read once in main.js and
      passed as an argument. main.js:37 reads it for compareNames only; customer-detail.js:135,
      order-list.js:105 and order-view.js:191 each read it again.
      route: reopen S12
F-35  CON-6  advisory  code  src/ui/views/order-view.js:312  none  JS-11  Views do not have the
      ADR-003 shape: one context object with the whole mutable state, several listeners per view,
      direct writes to state.
      evidence: ADR-003 line 35: render(container, viewModel, actions) and one delegated listener
      per container. renderOrderView(container, context) receives state; order-view.js:312 adds a
      listener to three parts and :323 another on deleteButton; customer-list.js:65 and :73 attach
      per-button listeners; views assign state.form and state.searchCustomers. No behaviour is
      wrong; the shape is.
      route: reopen S15, S16
F-36  CON-7  advisory  code  src/ui/main.js:56  R-21  commit only saves and swaps state; each view
      navigates and re-renders itself, so the one write path of ADR-003 is split over the views.
      evidence: ADR-003 line 32: commit saves, then replaces the state, navigates and renders.
      main.js:56-61 saves and swaps; customer-form.js:116, order-form.js:203, order-view.js:320 and
      customer-detail.js:156 navigate on their own.
      route: reopen S9, S10, S11, S12, S13, S14, S15
F-37  CON-8  advisory  code  src/ui/views/blocked.js:3  R-20  The code table is split: STO-03,
      STO-04 and a second STO-02 text live in the blocked view, not in the one frozen object of
      main.js.
      evidence: ADR-007 line 27: the table lives in one frozen object in src/ui/main.js. main.js:15
      CODES holds STO-01, STO-02, STO-05 and APP-01; blocked.js:3 TEXTS holds STO-03, STO-04 and its
      own STO-02 wording.
      route: reopen S9
F-38  CON-9  advisory  code  src/ui/format.js:6  R-16  formatMoney adds an option the accepted
      decision does not list.
      evidence: ADR-006 line 23 gives Intl.NumberFormat(locale, { style: 'currency', currency:
      CURRENCY }); format.js:6 adds currencyDisplay: 'narrowSymbol'. For EUR the symbol is the same
      in common locales, so the effect is a deviation from the decision's text.
      route: reopen S8
F-39  CON-10  advisory  code  src/ui/format.js:14  none  formatDate parses an ISO string instead of
      building the date from Date.UTC as the decision says; the shown day is the same.
      evidence: ADR-007 line 45: formatDate is built with Date.UTC and formatted with timeZone UTC.
      format.js:14 parses `${isoDate}T00:00:00Z`; for every real YYYY-MM-DD both give the same
      instant, so only the wording of the decision is not followed.
      route: reopen S8
F-40  CON-12  advisory  code  src/ui/router.js:58  none  CP-07  routeToHash silently maps not-found
      to the customer list; no caller in the app uses it and no document asks for it.
      evidence: router.js:58 'not-found': () => '#/customers'. Every routeToHash caller under src/
      passes a concrete route name (customer-list.js:33, order-view.js:26 and :179,
      order-form.js:122-152, customer-detail.js:65-137, order-list.js:44, customer-form.js:53); only
      tests/router.test.js:41 calls it with not-found. ADR-005 lists nine routes and no hash for
      not-found; CP-07 bans code for a requirement not in the story and AGENTS.md rule 6 bans silent
      fallbacks.
      route: reopen S8
F-41  CON-13  advisory  code  src/domain/customers.js  none  The S3 commit message names a range
      instead of its IDs, so a history search for R-03, R-04 or R-05 misses the slice.
      evidence: git log: bd4ef79 'S3: customer commands, list, search and label (R-01..R-06)'.
      AGENTS.md rule 8 asks for (R-xx, R-yy). The gate's commit check accepted the range; only a
      history rewrite changes it.
      route: reopen S3
F-42  CON-14  advisory  code  docs/MANUAL-CHECKS.md:6  none  Three slices dropped plan checks from
      the manual list: nine S8 UX lines, the two S11 screen checks (including the leave-a-form check
      S9 defers to S11) and the S13 screen check.
      evidence: PLAN.md:236-245 lists ten UX lines for S8; MANUAL-CHECKS.md section S8 (lines 3-6)
      carries one. PLAN.md:357-358 (customer form errors, leaving a form) are absent from section
      S11 (lines 53-68), although line 28 defers the leave-a-form check to S11. PLAN.md:430 (order
      list: Add a customer first, Back keeps the search) is absent from section S13 (lines 151-167).
      merged: CON-15, CON-16
      route: reopen: no slice in docs/PLAN.md owns docs/MANUAL-CHECKS.md; re-plan
F-43  LEG-1  advisory  code  src/ui/views/customer-detail.js:156  R-04  LD-07  Deleting a customer
      leaves the search text typed to find them in the box after the R-04 banner promised all of
      this customer's data erased; memory only, gone on reload.
      evidence: LD-07: the person can have their personal data erased; the skill's code question
      asks whether a delete leaves a copy in a cache or an index. customer-detail.js:156
      confirmDelete commits and calls location.replace('#/customers') with no reset of
      state.searchCustomers; main.js:125-126 resets both searches only in eraseAll;
      customer-list.js:97 puts the kept text back in the box. Path: search 'Jane', open Jane, Delete
      customer, confirm: the list shows 'Jane' in the box with 'No customers match this search.'.
      The stored document holds nothing of the customer, so the erasure itself is complete; the same
      reset eraseAll does would close the gap.
      route: reopen S12
F-44  LEG-6  advisory  plan  docs/MANUAL-CHECKS.md  R-31  LD-09  The R-31 clause that search text
      stays out of the URL and title has no test and no manual check; the code is right today and
      nothing would catch a regression.
      evidence: R-31: the URL and the title never contain the text typed into a search.
      tests/router.test.js:37 and :44 cover an unknown hash and the titles,
      tests/validation.test.js:164 covers error messages; no test and no MANUAL-CHECKS.md line (R-31
      at lines 5 and 16) types into a search box. Search state cannot run under Node (ADR-001), so
      the plan owed a manual line and listed none. main.js:43 keeps searchCustomers and searchOrders
      in state and never writes them to location or document.title.
      route: re-plan: /sdlc:plan-slices with the finding
F-45  SEC-10  advisory  code  .github/workflows/gate.yml:15  none  DR-04  CI actions are referenced
      by moving major tags, so the code the pipeline runs can change without a commit here.
      evidence: DR-04: actions are pinned by digest, commit SHA or exact version. gate.yml:15 and
      :20 use actions/checkout@v7 and :27 actions/setup-node@v7; node-version is the major 22. The
      kit checkout at :23 is pinned by SHA. Impact is limited by permissions: contents: read and
      persist-credentials: false.
      route: reopen: no slice in docs/PLAN.md owns .github/workflows/gate.yml; re-plan

## Watch list (11)
        COR-13  advisory  src/storage/storage.js:52  R-21  JS-07  A browser reporting a full quota
      under another error name would show STO-02 instead of STO-01; the failure stays visible and no
      data is lost.
      evidence: storage.js:52 maps only name === 'QuotaExceededError' to quota. JS-07 and MDN give
      that name for setItem; tests use a DOMException with the standard name.
      why unproven: No current browser is shown to use another name and no browser ran in this
      session. Same cause as SEC-9.        how to settle: Run the R-21 manual check of
      MANUAL-CHECKS.md line 57 in current Firefox and Safari and confirm STO-01, not STO-02,
      appears.
        SEC-9  advisory  src/storage/storage.js:52  R-21  JS-07  Quota detection depends on the
      exact error name; a different name gives the unavailable message while the data stays safe.
      evidence: Only name === 'QuotaExceededError' maps to quota; older Firefox used
      NS_ERROR_DOM_QUOTA_REACHED, not confirmed for current versions.
      why unproven: Needs a real browser filling localStorage; the test fake throws only the
      standard name. Same cause as COR-13.        how to settle: The manual R-21 check of S11 in
      current Firefox and Safari, reading which code appears.
        COR-14  advisory  src/ui/views/customer-detail.js:115  R-29  The blob URL is revoked in the
      same task as link.click(); a browser that starts the download later could drop it with no
      error shown.
      evidence: customer-detail.js:113-115 run link.click(), link.remove(), URL.revokeObjectURL(url)
      with nothing in between.
      why unproven: Chromium captures the blob at click time; Firefox and Safari behaviour cannot be
      shown without a browser. Same cause as SEC-13.        how to settle: Run the R-29 line of
      MANUAL-CHECKS.md (line 78) in current Firefox and Safari and check the file arrives with its
      full content.
        SEC-13  advisory  src/ui/views/customer-detail.js:115  R-29  Same path as COR-14: an export
      that silently does not arrive.
      evidence: downloadExport revokes the URL right after click() with no wait.
      why unproven: Not shown to fail in any current browser; no browser ran here.        how to
      settle: The R-29 manual check in Chromium, Firefox and Safari.
        SEC-8  advisory  src/storage/storage.js:50  R-20  SE-02  save() trusts its caller: a
      malformed value or a stray version key would overwrite good data or change the version.
      evidence: storage.js:50 spreads data after version, so save({ version: 2, ... }) writes
      version 2 and save({}) writes a document the next load calls corrupt. Every caller passes
      result.data from a domain command and parseDocument :22 strips version, so no path reaches it
      today.
      why unproven: No reachable caller; a hardening question, not an observed defect.        how to
      settle: A storage test calling save after a good load with a value lacking customers and one
      with a version key pins the contract; the human says whether save must re-check the shape
      (ADR-004 lists no such check).
        SEC-12  advisory  src/storage/storage.js:15  R-20  EO-01  A non-SyntaxError from JSON.parse
      would escape load() before the error listeners exist, leaving a blank page; writing stays
      locked.
      evidence: storage.js:15 rethrows anything but SyntaxError; createStorage.load :42 has no try
      around parseDocument; main.js:189 calls load() before the listeners at :197-198.
      why unproven: Real localStorage returns a string or null, so only an engine error (out of
      memory on a huge text) could trigger it; none was produced.        how to settle: A storage
      test whose backing returns a value that makes JSON.parse throw a non-SyntaxError, asserting
      load() returns a result instead of throwing; or a manual check with a stored text near the
      quota in each target browser.
        LEG-2  advisory  src/domain/export.js:5  R-29  LD-06  The export's purpose and retention
      texts carry project ids (R-04, R-08, A-10) and backticked field names the person receiving the
      file cannot look up.
      evidence: export.js:3-5 hold the texts; ADR-007 line 49 fixes them as frozen texts from A-13
      and A-14; R-29 asks that the user can answer an access request with the file. LD-06 asks for
      purpose and retention, which the file does state.
      why unproven: Whether the internal references make the statement unfit for the person is a
      reading between two documents the human approved; not a legal judgement I make.        how to
      settle: The human answers under docs/decisions whether the frozen texts stay or get a
      plain-language version; a change needs a new accepted ADR text.
        LEG-3  advisory  src/ui/views/order-view.js:147  none  LD-03  A-13 names notes and line
      description as fields that should hold no details about other people, but only the notes field
      carries the warning helper.
      evidence: order-form.js:8 NOTES_HELPER carries the warning; order-view.js:147 gives
      Description no helper; UI-SPEC line 432 (approved) sets the Description helper to none, so the
      build matches the spec. REQUIREMENTS.md:168 lists OrderLine description as personal data when
      it names a person.
      why unproven: LD-03 is about storing only needed data by default; a missing hint is not a
      stored field, and the approved spec chose none. Whether the spec row stands is the human's
      call.        how to settle: The human says whether UI-SPEC line 432 stands or Description gets
      the same helper as Notes.
        LEG-4  advisory  src/ui/views/order-form.js:73  R-07  LD-04  An order's customerId, listed
      as personal data, is corrected only by deleting the order and rebuilding it, which retypes
      every line and uses up a number.
      evidence: A-06 (REQUIREMENTS.md:143, confirmed by the human) makes delete and re-create the
      path; validation.js:92 and order-form.js:73 implement it. LD-04 asks that correction is
      possible and reaches every place it is shown; it is possible at that cost.
      why unproven: Whether the cost fails 'without undue delay' is a legal reading of a decision
      the human already took; I give no legal advice.        how to settle: The human confirms A-06
      under LD-04 in docs/decisions, or asks for an order move command in a new slice.
        LEG-5  advisory  docs/RUNBOOK.md  R-19  LD-09  The accepted answer to threat T-02 rests on a
      runbook that does not exist, and the app's own note says nothing about the shared github.io
      origin.
      evidence: ADR-008 line 46 answers T-02 with 'The runbook says so'; docs/ holds no RUNBOOK.md;
      PLAN.md names neither RUNBOOK nor Pages; .github/workflows holds only gate.yml;
      customer-list.js:5 says only 'Your data lives only in this browser'.
      why unproven: Nothing is published, so no user meets T-02 today; the missing file belongs to
      the devops role's future work, not to a built slice.        how to settle: Before the first
      publish, the devops role adds docs/RUNBOOK.md with the localhost-or-own-origin rule, and the
      human says whether the published app itself shows the demo-only note.
        LEG-7  advisory  .github/workflows/gate.yml:15  none  LL-01  Two GitHub actions used in CI
      are named in no decision with an SPDX identifier, while ADR-001 says the project has no
      development dependencies.
      evidence: gate.yml:15, :20 use actions/checkout@v7 and :27 actions/setup-node@v7; no docs/
      file names them. LL-01 covers what the app ships and depends on; the actions run only in CI
      and are not redistributed.
      why unproven: Whether CI actions count as components under LL-01 is a scope decision, not a
      fact a test settles.        how to settle: The human says whether CI actions fall under LL-01;
      if yes, a decision names both with their SPDX id read from each repository (MIT).

## Refuted (0)

## Trade-offs (0)

## Checklists
correctness: items 1-8 ran; fired: 1, 2, 3, 4, 5, 6, 7, 8; not run: none
security: not reported
contract: items 1-11 ran; fired: 2, 6, 8, 10, 11; not run: none
legal: not reported

## Verdict: FIX FIRST
Why: 4 blocking findings confirmed; 3 planted defects survived.
Routes: reopen S15, S16 (F-01, F-05, F-06, F-08, F-17, F-18, F-19, F-20, F-35); reopen S7 (F-02,
      F-09, F-10, F-11, F-12, F-30); reopen S2 (F-03); reopen S5 (F-04, F-31); question to the
      human: Q-04 in docs/REQUIREMENTS.md (F-07); question to the human: Q-05 in
      docs/REQUIREMENTS.md (F-13); question to the human: Q-06 in docs/REQUIREMENTS.md (F-14);
      reopen S11 (F-15); reopen S9, S10, S11, S12, S13, S14, S15 (F-16, F-21, F-33, F-36); reopen
      S10 (F-22); reopen S9, S10, S11, S12, S13, S14, S15, S16 (F-23, F-24, F-25, F-26, F-27);
      reopen S8 (F-28, F-38, F-39, F-40); reopen S1 (F-29); reopen S3 (F-32, F-41); reopen S12
      (F-34, F-43); reopen S9 (F-37); reopen: no slice in docs/PLAN.md owns docs/MANUAL-CHECKS.md;
      re-plan (F-42); re-plan: /sdlc:plan-slices with the finding (F-44); reopen: no slice in
      docs/PLAN.md owns .github/workflows/gate.yml; re-plan (F-45).
Next: say accept or reject for each F-id, then: node review.mjs decide --cycle 1 --accept <F-ids>
      --reject <F-ids> --note "<your words>"
      /sdlc:implement-slice S1 F-29
      /sdlc:implement-slice S2 F-03
      /sdlc:implement-slice S3 F-32 F-41
      /sdlc:implement-slice S5 F-04 F-31
      /sdlc:implement-slice S7 F-02 F-09 F-10 F-11 F-12 F-30
      /sdlc:implement-slice S8 F-28 F-38 F-39 F-40
      /sdlc:implement-slice S9 F-16 F-21 F-33 F-36 F-23 F-24 F-25 F-26 F-27 F-37
      /sdlc:implement-slice S10 F-16 F-21 F-33 F-36 F-22 F-23 F-24 F-25 F-26 F-27
      /sdlc:implement-slice S11 F-15 F-16 F-21 F-33 F-36 F-23 F-24 F-25 F-26 F-27
      /sdlc:implement-slice S12 F-16 F-21 F-33 F-36 F-23 F-24 F-25 F-26 F-27 F-34 F-43
      /sdlc:implement-slice S13 F-16 F-21 F-33 F-36 F-23 F-24 F-25 F-26 F-27
      /sdlc:implement-slice S14 F-16 F-21 F-33 F-36 F-23 F-24 F-25 F-26 F-27
      /sdlc:implement-slice S15 F-01 F-05 F-06 F-08 F-17 F-18 F-19 F-20 F-35 F-16 F-21 F-33 F-36
      F-23 F-24 F-25 F-26 F-27
      /sdlc:implement-slice S16 F-01 F-05 F-06 F-08 F-17 F-18 F-19 F-20 F-35 F-23 F-24 F-25 F-26
      F-27
      then /sdlc:review-change --cycle 2.
Not checked: UI in a real browser (manual checks in docs/MANUAL-CHECKS.md).
