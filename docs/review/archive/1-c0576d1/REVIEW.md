# Review, cycle 2
Reviewed: c0576d1 (main..HEAD, 47 commits)   Date: 2026-11-01
Finders: correctness, security, contract, legal (opus)   Verifier: fable (reported)   Author: sonnet
Gate: GATE PASS, tests 457 passed, 0 failed   Mutations: 296 planted, 282 caught, 14 survived
  survived (equivalent): src/domain/customers.js:4 "<" -> "<=" (compareById only breaks a tie
      between two distinct customers whose ids are unique (shape.js:81 refuses duplicates,
      deps.newId is a UUID), so a.id === b.id never occurs and <= answers as <; sort reads only the
      sign.)
  survived (equivalent): src/domain/customers.js:4 "1" -> "2" (-1 became -2: Array.prototype.sort
      reads only the sign of the comparator, so every order is unchanged.)
  survived (equivalent): src/domain/customers.js:4 ">" -> ">=" (Same as the < mutant: with unique
      ids the operands are never equal, so > and >= answer the same for every pair the sort passes.)
  survived (equivalent): src/domain/customers.js:4 "1" -> "2" (-1 became -2: Array.prototype.sort
      reads only the sign of the comparator, so every order is unchanged.)
  survived (equivalent): src/domain/customers.js:4 "0" -> "1" (The 0 branch is reached only when
      a.id === b.id, which unique ids rule out for two distinct customers, so the value is never
      returned.)
  survived (equivalent): src/domain/lines.js:20 "+" -> "-" (sumIsExact only tests
      Number.isSafeInteger(sum); subtracting every line total from 0 gives the exact negation of the
      sum, and isSafeInteger is symmetric in sign, so the answer is identical for every input.)
  survived (equivalent): src/domain/orders.js:15 "<" -> "<=" (The line runs only inside if (a.date
      !== b.date), so the two date strings are never equal and < and <= give the same answer.)
  survived: src/storage/shape.js:4 "-" -> "+"
  survived: src/storage/shape.js:14 ">=" -> ">"
  survived: src/storage/shape.js:14 "0" -> "1"
  survived (equivalent): src/storage/shape.js:39 "+" -> "-" (hasSafeTotal only tests
      Number.isSafeInteger(sum); subtracting every line total from 0 gives the exact negation and
      isSafeInteger is symmetric in sign, so the answer is identical for every input.)
  survived: src/storage/shape.js:39 "0" -> "1"
  survived (equivalent): src/storage/shape.js:44 "0" -> "1" (The fallback is returned only when
      ORDER_NUMBER does not match; hasCanonicalNumber then compares order.number with 'ORD-' plus
      the padded value, which a non-matching string can never equal whatever the value, and
      hasValidLinks (:86) runs only after every order passed isOrder, so the fallback never decides
      the result.)
  survived: src/storage/shape.js:91 "1" -> "2"

## Confirmed (26)
F-48  VER-5  blocking  code  tests/shape.test.js:70  R-11, R-20  No test pins that a stored line
      with unitPriceCents 0 is accepted. Two planted defects at shape.js:14 (value >= 0 to value >
      0, and 0 to 1) survive; under either, an order holding a free line, which R-11 allows (price
      0.00) and validateLine stores as 0 cents, is refused on the next load and the user's own data
      shows as corrupt.
      evidence: shape.js:14 isCount = isSafeInteger(value) && value >= 0 is used for quantity and
      unitPriceCents (:32, :33). validation.test.js:131 proves validateLine stores unitPrice '0' as
      0 cents, so the app writes unitPriceCents 0. The mutant value > 0 (or value >= 1) refuses it:
      isLine false, hasValidShape false, storage.js:23 returns corrupt. The shape tests use prices
      500 and MAX_SAFE_INTEGER only (shape.test.js:15, :78, :84), never 0, so both mutants survived:
      src/storage/shape.js:14 '>=' -> '>' and src/storage/shape.js:14 '0' -> '1'.
      route: reopen S7
F-49  VER-6  blocking  code  tests/shape.test.js:75  R-15, R-20  No test pins that the shape accepts
      an order whose total is exactly Number.MAX_SAFE_INTEGER, the boundary F-04 fixed in
      lines.test.js. A planted defect starting the sum at 1 instead of 0 survives: an order addLine
      accepts (total 9007199254740991) would be refused on reload as corrupt.
      evidence: shape.js:39 reduce((total, line) => total + quantity * unitPriceCents, 0); the
      mutant starts at 1, so for lines summing to 9007199254740991 isSafeInteger(9007199254740992)
      is false and hasSafeTotal is false. lines.test.js:58-63 proves addLine saves exactly that
      total. shape.test.js:75-88 refuses one cent above only (two MAX_SAFE lines, and MAX_SAFE times
      2); nothing asserts the accepted boundary, so src/storage/shape.js:39 '0' -> '1' survived.
      route: reopen S7
F-50  VER-7  blocking  code  tests/shape.test.js:90  R-06, R-20  No test pins the top of the
      nextOrderNumber range: a planted defect that moves the bound one lower (isSafeInteger(value +
      2)) survives, so the boundary the F-10 fix chose is held by no test; whichever bound the F-10
      answer settles on, this is the test that must fail when it moves.
      evidence: shape.js:91 hasValidCounter: isSafeInteger(value) && value >= 1 &&
      isSafeInteger(value + 1). The original accepts 9007199254740990 (value + 1 = MAX_SAFE_INTEGER,
      safe); the mutant computes value + 2 = 9007199254740992, not safe, and refuses it.
      shape.test.js:90-94 asserts -5, 0 and MAX_SAFE_INTEGER refused and nothing accepted near the
      top, so src/storage/shape.js:91 '1' -> '2' survived. A test asserting the accepted top value
      (or the refused one, once F-10 is answered) catches it.
      route: reopen S7
F-51  VER-4  blocking  code  tests/shape.test.js:108  R-20  No test uses a stored id with an
      uppercase letter, so a planted defect that turns the A-Z range of ID_PATTERN into the
      characters A, Z and a plus sign survives: a hand-edited document with an id such as Bob1 would
      be refused as corrupt while a+b would be accepted.
      evidence: shape.js:4 ID_PATTERN = /^[A-Za-z0-9_-]+$/. The mutator's '- -> +' pattern matches
      the hyphens of A-Z, a-z and 0-9 (not the one before the closing bracket); the a-z and 0-9
      mutants are caught by the complete document's ids c1, o1, l1 (shape.test.js:5-18), the A-Z
      mutant is not: every id in shape.test.js is lowercase (c1, nobody, the UUID at :118, 'a b',
      'a/b'). Under the mutant isId('Bob1') is false (B is outside the class) and isId('a+b') is
      true. Run result: src/storage/shape.js:4 '-' -> '+' survived.
      route: reopen S7
F-15  F-15  advisory  code  src/ui/views/order-form.js:201  R-21  Still present on the order form.
      After a storage failure on the new order or edit order form, focus moves to the banner and
      stays there, so Save is not ready for a retry as UI-SPEC says. The customer form got the fix,
      the order form did not.
      evidence: order-form.js:199 commit(result.data) fails, :201 showBanner(saved.code), :202
      return; main.js:121 setBanner(region, ...).focus() leaves focus on the banner.
      customer-form.js:112-113 adds form.querySelector('[type=submit]').focus(); order-form.js has
      no such line. UI-SPEC.md:502: 'Failed Save, storage | stays on Save, ready to retry'. The S14
      commit f19ef9e changed only the customer label.
      merged: COR-17, CON-33
      route: reopen S14
F-13  F-13  advisory  code  src/domain/validation.js:7  R-17, R-01, R-11  SE-02  Still present for
      zero-width characters outside the Cf category: a customer name or line description made only
      of U+FE0F (variation selector) or U+034F (combining grapheme joiner) passes the required-field
      check, so a customer or a line is saved with no visible text and the list shows a row link
      with nothing to click.
      evidence: validation.js:7 INVISIBLE_ONLY matches only categories Cf and Z and whitespace.
      U+FE0F and U+034F are zero-width with category Mn, so for name = U+FE0F: textOf (:34) keeps it
      (String.trim removes only whitespace), :43 the regex test is false, :44 length 1 is within 1
      to 100, validateCustomer returns ok with that name; the same path at :111 for a description.
      R-17 (REQUIREMENTS.md:95): 'zero-width or other format characters' count as empty.
      validation.test.js:186-197 feed only Cf and Z characters, so the gap is untested. Advisory as
      in cycle 1: a lone combining mark pasted as the whole name is an unusual input and no data is
      lost. U+3164, U+2800 and U+0001 (blank but not zero-width) are not named by R-17; whether they
      count is a separate question for the human.
      merged: COR-19, SEC-14
      route: reopen S2
F-43  F-43  advisory  code  src/ui/main.js:100  R-04  LD-07  Half closed: deleting a customer clears
      the customer search but not the order search. R-04 tells the user to delete the orders first,
      and the order search matches customer names (R-10), so the name typed there to find them stays
      in the Search orders box after the banner promised all of this customer's data erased; memory
      only, gone on reload.
      evidence: Path: type Jane in Search orders (order-list.js:127 sets state.searchOrders =
      'Jane'), open and delete her only order, open her detail and delete her. main.js:100
      customerWasDeleted(nextData) is true and resets only state.searchCustomers; state.searchOrders
      keeps 'Jane'. With another customer's order left, renderOrderList takes buildList and
      order-list.js:96 sets input.value = state.searchOrders, so the box shows Jane with 'No orders
      match this search.'. eraseAll at main.js:181-182 resets both texts, so the delete path is the
      odd one out. Cycle 1 LEG-1 named both texts.
      merged: COR-18, CON-36, LEG-8
      route: reopen S9, S10, S11, S12, S13, S14, S15
F-52  SEC-15  advisory  requirement  src/domain/validation.js:51  R-01, R-17  SE-02  An optional
      email whose local part is only invisible characters is stored and shows as @b.c, although R-01
      asks for text on both sides of the @. The invisible-text rule runs only in lengthError for
      required fields.
      evidence: Input email = U+200B followed by @b.c. textOf (:34) trims nothing (U+200B is not
      whitespace), emailError (:47-52): length 7 is under 200, split('@') gives [U+200B, 'b.c'],
      parts[0].length is 1 > 0, parts[1].includes('.') is true, so null is returned and the value is
      stored. 'a@' + U+200B + '.' passes the same way. INVISIBLE_ONLY (:7) is applied only at :43
      when min > 0. No test feeds this input. Level requirement: R-17's invisible rule names
      required fields only, so the human says whether it also defines 'text' in R-01's email rule.
      route: question to the human: Q-04 in docs/REQUIREMENTS.md
F-10  F-10  advisory  requirement  src/storage/shape.js:91  R-06, R-20  SE-02  One value remains:
      with nextOrderNumber at the largest value the shape accepts, creating one order writes a
      document the same check refuses on the next load, so readable data becomes blocked as corrupt.
      Hand-edited data only.
      evidence: hasValidCounter(9007199254740990): isSafeInteger true, >= 1 true,
      isSafeInteger(9007199254740991) true, so load is ok. createOrder (orders.js:43-44) writes
      number ORD-9007199254740990 and nextOrderNumber 9007199254740991, which storage.js:50 saves.
      On reload hasValidCounter(9007199254740991): value + 1 = 9007199254740992 = 2^53, not safe, so
      hasValidShape is false and storage.js:23 returns corrupt. Moving the bound does not close
      this: for any accepted top value T the write produces T + 1. Level requirement: closing it
      needs createOrder to refuse at the top with a message no document names, or the human's
      acceptance of the limit.
      merged: COR-20, SEC-16
      route: question to the human: Q-05 in docs/REQUIREMENTS.md
F-53  COR-21  advisory  requirement  src/ui/views/order-form.js:88  R-07  On the edit order form the
      read-only order number is labelled 'Number (optional)', the wording the human rejected in UAT
      for a fixed value; the F-47 fix covered the Customer field only.
      evidence: order-form.js:85-91 field({ id: 'order-number', label: 'Number', required: false,
      control: readOnlyInput(...) }); components.js:76 builds label + ' (required)' or '
      (optional)', giving 'Number (optional)'. customerField at order-form.js:75 overrides the label
      to 'Customer'; no override exists for Number. The approved UI-SPEC.md:354 gives Number
      Required 'no' and :83 puts the suffix in the label text, while the human's UAT-2 decision
      (F-47) says a fixed value is not called optional. Level requirement: the later human decision
      and the approved spec row contradict for read-only fields; the human confirms the UAT rule
      covers Number and the spec row is amended, then the Customer override is repeated for Number.
      merged: CON-43
      route: question to the human: Q-06 in docs/REQUIREMENTS.md
F-54  CON-48  advisory  code  styles.css:265  R-21  At 320 px a banner's action (Reload on STO-05
      and APP-01, Show stored text on a failed copy) stays on the text's row and squeezes the text;
      the spec puts it below the text.
      evidence: UI-SPEC.md:89: 'at most one action as a link button at the end (below the text at
      320 px)'. styles.css:255 flex-wrap: wrap, :265 .banner-text { flex: 1; min-width: 0 }: a flex
      basis of 0 and min-width 0 let the text shrink to nothing, so icon, text and action always fit
      one flex line and nothing wraps; no media rule for .banner exists. The text keeps 320 px minus
      padding, icon, gaps and the action's width, about a third of the row.
      route: reopen S9, S10, S11, S12, S13, S14, S15, S16
F-55  CON-49  advisory  code  styles.css:92  R-03  A 100-character customer name with no spaces
      overflows the h1 of the customer detail at 320 px and gives horizontal scroll; the spec says
      every text from the user wraps.
      evidence: UI-SPEC.md:65: 'every text from the user wraps with overflow-wrap: anywhere, except
      the desktop table cells'; :249 'h1: the customer's name'. customer-detail.js:138
      heading(customer.name). styles.css:91-92 set weight, line height, margin and size on h1 and no
      overflow-wrap; grep finds overflow-wrap only on .banner-text, .stored-text, .cell-number,
      dialog p, .row-open, .note-text, the td rules, .detail-value and .text-link, none an ancestor
      of h1. The CSS default overflow-wrap: normal keeps an unbreakable word on one line, wider than
      .title-row's column at 320 px.
      route: reopen S9, S10, S11, S12, S13, S14, S15, S16
F-56  CON-47  advisory  code  styles.css:631  R-12  On desktop a line row grows to about 60 px
      instead of --row-height (44 px): the action cell keeps the vertical padding the spec sets to
      0.
      evidence: UI-SPEC.md:422: 'its vertical padding is 0, so the row stays at --row-height'.
      styles.css:629-633 at 64rem give every .table-lines td padding: var(--space-2) var(--space-3)
      (8px 12px) with no .col-actions override; .button is height var(--control-height) (2.75rem =
      44px, :175) and .row-actions .button (:596) changes only the side padding, so the cell is 44 +
      16 = 60 px tall and tr height var(--row-height) (:628) cannot hold it.
      route: reopen S9, S10, S11, S12, S13, S14, S15, S16
F-57  CON-46  advisory  code  styles.css:607  R-15  On desktop the Order total label sits at the far
      left of the row, away from its amount; the spec places the line at the end of the row.
      evidence: UI-SPEC.md:424: 'Order total: one line under the table ... at the end of the row';
      the desktop sketch at :417 shows both at the right edge, the 320 px sketch at :401 spreads
      them. styles.css:605-611 .order-total { display: flex; justify-content: space-between } with
      no rule inside the 64rem block (:615-643), so the desktop keeps the 320 px spread.
      route: reopen S9, S10, S11, S12, S13, S14, S15, S16
F-58  CON-44  advisory  code  src/ui/views/blocked.js:68  R-20  The blocked screen puts its h1 above
      the panel while the approved sketch has the heading inside it.
      evidence: UI-SPEC.md:458: 'only the text Invoice app as in the header, then a panel of width
      --width-form'; the sketch at :468-478 draws 'The saved data cannot be read' inside the box
      above 'Nothing has been changed.' and the buttons. blocked.js:54 box.append(region, text,
      actions) and :68 container.replaceChildren(element('p', 'app-name', 'Invoice app'), h1, box):
      the h1 is a sibling of the box, not its first child.
      route: reopen S9
F-59  CON-45  advisory  code  src/ui/views/not-found.js:9  R-28  The two not-found links are drawn
      as bordered secondary buttons; the spec names link buttons, the variant Edit and Remove use.
      evidence: UI-SPEC.md:442: 'then link buttons Go to customers and Go to orders'; the sketch at
      :450-451 shows them without the [ ] every filled or bordered button carries; :422 uses the
      same words for Edit and Remove, built at order-view.js:68-69 as actionButton('Edit', 'link',
      ...). not-found.js:9 linkButton('Go to customers', '#/customers', 'secondary'), linkButton('Go
      to orders', '#/orders', 'secondary'); components.js:19-23 gives the class button-secondary,
      styled with a border at styles.css:193.
      route: reopen S9
F-36  F-36  advisory  code  src/ui/views/order-form.js:199  R-21  Half closed: commit now navigates
      when given a hash, and the customer form, the customer delete and the order delete use it, but
      the order form still calls commit without a hash and then navigates itself, so the one write
      path of ADR-003 is split for that screen.
      evidence: main.js:96-103 commit(nextData, hash, { replace }) saves, swaps state and calls
      goTo(hash). customer-form.js:110 commit(result.data, where.saved), customer-detail.js:150 and
      order-view.js:324 pass a hash. order-form.js:199 const saved = commit(result.data); then
      :204-205 state.form = null; location.hash = savedHash(route, result.data). ADR-003:32: 'only
      when that succeeds does it replace the state, navigate and render'. The target is computable
      before the call, as savedHash(route, result.data) shows. Commit f19ef9e lists F-36 as already
      closed.
      merged: CON-32
      route: reopen S14
F-33  F-33  advisory  code  src/ui/views/order-form.js:160  R-06  Half closed: deps now carries
      today, but nothing reads it; the order form still reads the clock through deps.now, a key
      ADR-003 does not name, so the key the tests fake is live in no code path.
      evidence: ADR-003:31: 'deps carries what the outside supplies, newId and today'. main.js:75-81
      deps = { newId, now: () => Date.now(), get today() { return todayIso(() => Date.now()); } }
      with the comment 'now stays for views that still read the clock'. order-form.js:160
      setupFor(route, state.data, context.compareNames, todayIso(deps.now)). A grep for deps.today
      under src/ finds nothing; customers.test.js:5, orders.test.js:5 and lines.test.js:6 fake
      today: '2026-10-30'. Commit f19ef9e lists F-33 as already closed.
      merged: CON-31
      route: reopen S14
F-34  F-34  advisory  code  src/ui/views/order-list.js:105  R-16  LY-10  Fixed in one of the three
      views: order-list.js and order-view.js still read navigator.language themselves and ignore the
      locale the composition root passes.
      evidence: ADR-006:24: 'The locale is navigator.language, read once in src/ui/main.js and
      passed as an argument'. main.js:60 LOCALE = navigator.language and :212 passes locale: LOCALE
      to every screen; customer-detail.js:132 takes it. order-list.js:105 const locale =
      navigator.language; order-view.js:199 const locale = navigator.language. Commit 6e0f818
      changed order-view.js and left that line.
      merged: CON-34
      route: reopen S13
F-35  F-35  advisory  code  src/ui/views/order-view.js:194  none  JS-11  Still present: views take
      one context object holding the whole mutable state and write state.form directly, and four
      views keep per-control listeners; only order-view.js moved to delegated listeners.
      evidence: ADR-003:35: 'A view has the shape render(container, viewModel, actions) and one
      delegated listener per container'. order-view.js:194 renderOrderView(container, context), :195
      destructures state, :251 state.form = {...}; customer-form.js:119 and order-form.js:210 do the
      same. Per-control listeners: customer-list.js:65, :73, :125; customer-detail.js:145, :154;
      customer-form.js:45, :91-92; order-form.js:102, :180-181. Commits 6e0f818 and eba225d list
      F-35 as fixed or closed.
      merged: CON-35
      route: reopen S15, S16
F-39  F-39  advisory  code  src/ui/format.js:17  R-28  The ISO-string parse is gone, but formatDate
      still does not build the date with Date.UTC as ADR-007 says; it uses setUTCFullYear on new
      Date(0). The shown day is the same for every real date.
      evidence: ADR-007:45: 'built with Date.UTC and formatted with timeZone: UTC'. format.js:16-18
      split('-').map(Number), new Date(0), date.setUTCFullYear(year, month - 1, day). dates.js:8-9
      shows the form that meets the letter and keeps years below 100: new Date(Date.UTC(year, month
      - 1, day)) then setUTCFullYear(year). The rewrite also added a year 0099 case the human ruled
      out in F-29 (format.test.js:33); CON-38 covers that test.
      merged: CON-37
      route: reopen S8
F-32  F-32  advisory  code  tests/export.test.js:17  R-29  TS-02  Half closed: the S3 half was fixed
      (the R-05 search test now tells sort order from insertion order), but the S6 half is
      unchanged: the builder's export test checks fragments of A-13 and A-14, and only the tester's
      spec holds the full texts.
      evidence: customers.test.js:78-82 uses a descending compare and expects ['c2', 'c1'] (fixed).
      export.test.js:19 assert.ok(result.purpose.endsWith('The data is used for nothing else.')),
      :20 assert.ok(result.retention.includes('there is no fixed period')); PLAN.md:164 names
      'states the purpose of A-13, the retention of A-14 and the currency EUR'. The fix commit
      646d156 is S3 only; tests/export.test.js is in no commit after cycle 1.
      merged: CON-39
      route: reopen S6
F-60  CON-40  advisory  code  tests/storage.test.js:16  R-19, R-06  TS-05  Two builder tests assert
      the value the empty default already gives: the R-19 round trip would pass if save wrote
      nothing, and the R-06 erase test never raises the counter, so it proves no restart. Other
      tests catch both defects, so nothing is unprotected.
      evidence: storage.test.js:14 data = { nextOrderNumber: 1, customers: [], orders: [] }, which
      equals emptyData() at storage.js:6; :21 createStorage(backing).load() returns { ok: true,
      data: emptyData() } for a missing key (storage.js:38-40) whether or not :20 wrote anything.
      :46-49 load an empty backing and assert erase().data.nextOrderNumber is 1, which erase returns
      unconditionally (storage.js:65). Cover elsewhere: storage.test.js:68 checks the written text,
      :112-122 saves nextOrderNumber 2, and every storage.js mutant was caught in this run.
      route: reopen S7
F-61  CON-38  advisory  code  tests/format.test.js:34  R-28  TS-05  The first assertion cannot catch
      the defect its title names: with Date.UTC, year 99 becomes 1999 and '1 Jan 1999' still
      includes '99'. The test can still fail on its second line, so it is not a cannot-fail test,
      and the input is one the human ruled out in F-29.
      evidence: format.test.js:34 assert.equal(formatDate('0099-01-01', 'en-GB').includes('99'),
      true). Date.UTC(99, 0, 1) names 1999-01-01 (years 0 to 99 map to 1900 to 1999), formatted
      en-GB medium as '1 Jan 1999', which includes '99'; the current code gives '1 Jan 99', which
      also includes '99'. Both paths pass, so the assertion separates nothing. Cycle 1 decision on
      F-29: 'years 0000 to 0099 are not a real input'.
      route: reopen S8
F-62  CON-42  advisory  code  tests/validation.test.js:186  R-17  TS-02  The invisible-text rule
      lives in R-17, but its two tests carry R-01 and R-11, so a trace of R-17 misses the clause;
      the plan's S2 Tests first list was not extended for it.
      evidence: REQUIREMENTS.md:95 puts the rule under R-17. validation.test.js:186 'R-01 a customer
      name made only of invisible characters gives the name length error', :193 'R-11 a line
      description made only of invisible characters ...'. AGENTS.md rule 4: 'Every requirement you
      implement is named in a test title'. The gate's trace passes only because R-17 is named at
      :149 for another clause. PLAN.md:42-58 (S2 Tests first) has no title for the clause. The
      commit-message part of the finder's text is not raised: F-41 closed commit messages as
      history.
      route: reopen S2
F-63  COR-22  advisory  plan  docs/MANUAL-CHECKS.md:63  R-01, R-04  TS-11  Both search-clearing
      rules in commit have no test and no manual check: removing the condition at main.js:100 would
      break the R-01 clause (F-07) and the F-43 fix, and nothing listed would notice. The same gap
      F-44 closed for R-31.
      evidence: main.js:100 is the only code for 'a customer search kept from before is cleared'
      (REQUIREMENTS.md:12) and for the R-04 clearing (main.js:105-109). main.js cannot run under
      Node (it calls start() against the DOM at load), so a manual line is the only cover.
      MANUAL-CHECKS.md:63 (R-01) says 'save a name only, the customer appears in the list' with no
      prior search; :83-84 (R-04) end at 'lands on the list'. The lines that mention a search (:44,
      :45, :60, :164, :166, :169, :180) cover neither saving a new customer nor deleting one.
      PLAN.md:342 and :379-380 carry the same wording, so the plan is the file to change first, as
      bd3d07b did for F-44.
      merged: CON-41, LEG-9
      route: re-plan: /sdlc:plan-slices with the finding

## Watch list (9)
        COR-23  advisory  src/ui/views/customer-form.js:12  R-03  A type=email control may return an
      internationalised domain as punycode in .value, so the stored email would differ from what was
      typed and a search for the typed domain would not match.
      evidence: customer-form.js:12 sets type 'email' as UI-SPEC.md:210 asks; :31 reads
      form.elements.email.value, and emailError accepts xn-- labels (text on both sides, a dot after
      the @). No browser ran in this review.
      why unproven: Whether the browser rewrites the value is browser behaviour that neither the
      code nor a Node test shows.        how to settle: In Chrome and Safari save a customer with
      email ion@exämple.ro, open the detail and the list, then search for exämple; if the stored
      value shows xn--, decide whether to keep type=email (spec) or read type=text with
      inputmode=email.
        CON-50  advisory  src/ui/main.js:58  R-31  The blocked screen's title 'Data problem -
      Invoice app' lives in main.js, outside the frozen title table in router.js, and no test checks
      it.
      evidence: PLAN.md:229: 'the frozen table of page titles of UI-SPEC section 7 in
      src/ui/router.js'; UI-SPEC.md:458 is in section 7. ADR-005:45 says the table holds route names
      and :44 says the blocked screen is not a route. main.js:58 BLOCKED_TITLE; router.js:1-12
      ROUTE_TITLES has no such entry; the title is a constant with no record data.
      why unproven: Two approved documents read differently and no user outcome separates them.
      how to settle: The human says which reading holds; if the plan's, BLOCKED_TITLE moves into
      ROUTE_TITLES under a non-route key and router.test.js asserts it.
        CON-51  advisory  docs/RUNBOOK.md  none  Two documents the decisions rely on do not exist:
      docs/RUNBOOK.md (a line per user-visible code, ADR-007) and docs/TRACE.md (ADR-002). No slice
      in the plan writes either.
      evidence: ADR-007:27 'each needs a line in docs/RUNBOOK.md (EO-13)'; ADR-002:36 'docs/TRACE.md
      links each requirement to its tests, commits and manual check'. ls reports both missing; no
      Files line in PLAN.md names them; AGENTS.md gives the runbook to the devops role, and the
      gate's trace step computes the trace itself.
      why unproven: Whether both are due before release or before this review is a process question
      the plan does not answer.        how to settle: The human confirms that the devops slice
      writes docs/RUNBOOK.md before the first publish and says whether docs/TRACE.md is a file to
      write or the gate's trace line; LEG-14 is settled by the same answer.
        LEG-10  advisory  src/ui/main.js:100  R-02  LD-04  After a customer's name or email is
      corrected, the old value stays in the customer or order search box if it was typed there to
      find them; only a new customer or a delete clears a search.
      evidence: main.js:100 clears searchCustomers only on route customer-new or on
      customerWasDeleted. Path: search 'Jane Smiht', open her, correct the name, save, return to
      Customers: customer-list.js:97 sets input.value = state.searchCustomers = 'Jane Smiht' and the
      list says 'No customers match this search.'. ADR-005:46 says search texts survive moving
      between screens.
      why unproven: Whether a search box is a copy of personal data (the F-43 reading) or the user's
      own typed text (ADR-005) is a reading the human made for deletes only.        how to settle:
      The human says whether the F-43 reading extends to a correction; if yes, commit clears both
      texts after a customer update as it does after a delete.
        LEG-11  advisory  src/domain/export.js:5  R-29  LD-06  Carried from cycle 1 LEG-2,
      unchanged: the export's purpose and retention texts carry project ids (R-04, R-08, A-10) and
      backticked field names the person receiving the file cannot look up.
      evidence: export.js:3-5 hold the frozen A-13 and A-14 texts word for word, as ADR-007:49
      requires; R-29 says the file answers a person's access request.
      why unproven: The texts match the accepted decision; whether a plain-language version is owed
      is the human's call, not a fact.        how to settle: The human keeps the frozen texts or
      amends A-13 and A-14 with a plain-language version in an accepted ADR; S6 then updates
      export.js and its tests.
        LEG-12  advisory  src/ui/views/order-view.js:155  none  LD-03  Carried from cycle 1 LEG-3,
      unchanged: A-13 says notes and line description should hold no details about other people, but
      only the Notes field carries that warning.
      evidence: order-form.js:8 NOTES_HELPER carries the warning; order-view.js:155 gives
      Description no helper, as the approved UI-SPEC.md:432 (helper 'none') says.
      why unproven: The build matches the approved spec; whether the spec should change is the
      human's decision.        how to settle: The human says whether UI-SPEC.md:432 stands or the
      Description field gets the same helper; a spec amendment then routes to S16.
        LEG-13  advisory  src/ui/views/order-form.js:73  R-07  LD-04  Carried from cycle 1 LEG-4,
      unchanged: an order's customerId, listed as personal data, is corrected only by deleting and
      rebuilding the order, which retypes every line and uses up a number.
      evidence: validation.js:94-97 validateOrderEdit takes date and notes only; order-form.js:73
      helper 'To move an order, delete it and create a new one.'; A-06 is confirmed by the human.
      why unproven: A-06 is the human's accepted answer; whether it satisfies LD-04's 'without undue
      delay' is a judgement, not a fact.        how to settle: The human confirms A-06 under LD-04
      in a decision, or asks for a move command as a new requirement.
        LEG-14  advisory  docs/RUNBOOK.md  R-19  LD-09  Carried from cycle 1 LEG-5, unchanged: the
      accepted answer to threat T-02 rests on a runbook that does not exist, and the in-app note
      says nothing about a shared github.io origin.
      evidence: ADR-008:46 points to the runbook; docs/RUNBOOK.md is absent; .github/workflows holds
      only gate.yml; customer-list.js:5 says only 'Your data lives only in this browser'. Nothing is
      published yet.
      why unproven: No user can reach a published app today, so the leak path does not exist yet;
      the gap is a delivery precondition.        how to settle: The devops role adds docs/RUNBOOK.md
      before the first publish and the human says whether the published app shows a demo-only note;
      same answer as CON-51.
        LEG-15  advisory  .github/workflows/gate.yml:15  none  LL-01  Carried from cycle 1 LEG-7,
      unchanged: two GitHub actions used in CI are named in no decision with an SPDX identifier,
      while ADR-001 says the project has no development dependencies.
      evidence: gate.yml:15 and :20 'uses: actions/checkout@v7', :27 'uses: actions/setup-node@v7';
      no docs/ file names them. They run only in CI and are not shipped; A-15 names 'library, font,
      icon set or adapted design'.
      why unproven: Whether CI actions are components under LL-01 is a scope decision, not a fact a
      test settles.        how to settle: The human says whether CI actions fall under LL-01; if
      yes, a decision names both with the SPDX id read from each repository (MIT).

## Refuted (32)
      F-01  Fixed in 6e0f818 and eba225d: order-view.js:299 showBanner(saved.code, ui.region) puts
      the banner in the line form's own region (lineForm :159-160 places it above the form) and :300
      ui.save.focus() keeps focus on Save line, so the error sits next to the form the user is in.
      F-02  Fixed in 68d263b: storage.test.js:55-66 loads with a getItem that throws, then asserts
      save answers blocked and setItem was never called; the storage.js:31 mutant that survived in
      cycle 1 is caught in this run (no storage.js survivor).
      F-03  Fixed in 4791fde: validation.js:8 QUANTITY_PATTERN is digits only, then the range 1 to
      MAX_QUANTITY, as ADR-007:15 says; validation.test.js:178-184 stores 000005 as 5 and refuses
      100000, 0010000 and 00000; no validation.js mutant survived this run.
      F-04  Fixed in 23a9c9e: lines.test.js:58-63 asserts addLine accepts a total of exactly
      Number.MAX_SAFE_INTEGER and :65-69 refuses one cent above; the lines.js:20 start-value mutant
      of cycle 1 is caught (only the equivalent + to - mutant remains).
      F-05  Fixed in 6e0f818 and eba225d: order-view.js:217 deleteButton.disabled = ui.open disables
      Delete order while a line form is open, so the dialog cannot follow a delete; and commit with
      a hash (:324) clears state.form in goTo (main.js:112) before navigating.
      F-06  Fixed in 6e0f818: order-view.js:351-353 records every focused id inside the form (Save
      line is id line-save at :145, Cancel is line-cancel at :147) and :251 restoreFocus falls back
      to line-description, so Keep editing always finds an element and APP-01 cannot be thrown.
      F-07  Fixed in a2266d8 and REQUIREMENTS.md:12 (309ac7b): main.js:100 clears
      state.searchCustomers when a customer-new commit succeeds, so the new customer is visible on
      landing.
      F-08  Fixed in 6e0f818: a successful Save line runs closeForm (order-view.js:303), which
      empties pageBanner (:262) and removes the form panel with its region (:261); a successful
      Remove empties pageBanner at :318 before drawLines.
      F-09  Fixed in 68d263b: shape.js checks every field's type (:22-24, :26-36, :52-71), real
      dates (:60), safe line and order totals (:34, :38-40), canonical numbers (:47-50) and links
      (:77-88), so a document that passes cannot make an order screen throw; shape.test.js:65-99 and
      :130-138 pin it.
      F-11  Fixed in 68d263b: shape.js:17-20 hasExactKeys refuses any key outside the sketch at
      every level (:29, :55, :69, :98); shape.test.js:123-128 refuses doc.backup,
      customers[0].nationalId, orders[0].extra and lines[0].extra.
      F-12  Fixed in 68d263b: shape.js:4-5 and :15 isId requires /^[A-Za-z0-9_-]+$/ and refuses
      'new'; shape.test.js:108-121 refuses '', 'new', 'a b', 'a/b' and accepts a UUID.
      F-16  Fixed in 996617e: main.js:56-57 FORM_ROUTES and FIRST_FIELD, :224-227 focusStart puts
      focus on the first non-readonly, non-disabled field of a form route (Name, the Customer
      select, or Date when the customer is fixed), the h1 otherwise, as UI-SPEC.md:498-499 says.
      F-17  Fixed in 6e0f818: order-view.js:270-275 cancelForm keeps the edited line id, closes the
      form and focuses editButtonOf(lineId), the re-rendered Edit button of that row, falling back
      to the visible Add line only for an add.
      F-18  Fixed in 6e0f818: order-view.js:113-115 puts Add line (primary) inside the empty panel
      and :218 hides the h2 row's Add line while there are no lines; MANUAL-CHECKS.md:127 checks
      'from the no-lines message, Add line opens the form'.
      F-19  Fixed in 6e0f818: order-view.js:86 renders the text Editing in the action cell of the
      row being edited instead of its buttons.
      F-20  Fixed in 6e0f818: order-view.js:149-153 wraps Quantity and Unit price in .form-pair,
      which styles.css:309-312 lays out as a row from 64rem.
      F-21  Fixed in 996617e: main.js:213 and :218-222 showAsNotFound set state.route to not-found,
      clear the nav's aria-current (markNav :190) and set the title 'Not found - Invoice app' when a
      screen renders not-found for an unknown id.
      F-22  Fixed in a2266d8: styles.css:417 .table-customers .cell-email { color:
      var(--color-text-muted) } applies to the stacked rows below 64rem, as UI-SPEC.md:197 says;
      :444-445 restore the normal color on desktop with No email kept muted.
      F-23  Fixed in a2266d8: styles.css:398 .row-open { color: var(--color-primary);
      text-decoration: underline }, so row links read as links at every width.
      F-24  Fixed in a2266d8: styles.css:396 .panel-table uses overflow: clip, which is not a scroll
      container, so the sticky thead (:425-427, :618-620) sticks to the page's scrollport.
      F-25  Fixed in a2266d8: styles.css:315 limits the focus border change to
      input:focus:not([readonly]) and textarea:focus:not([readonly]); :317 keeps the read-only fill.
      F-26  Fixed in a2266d8: styles.css:186 .button transition on transform over --duration-fast,
      and :367 dialog::backdrop animation dialog-in over --duration-base (keyframes :378-381), as
      UI-SPEC.md:527-529 says.
      F-27  Fixed in a2266d8: a grep for px, rem and em outside :root finds only the nine '@media
      (min-width: 64rem)' lines, the one breakpoint UI-SPEC.md:74 names, which a custom property
      cannot express.
      F-28  Fixed in 024fb22: format.js:8-10 hands the formatter the exact decimal string
      whole.fraction built from integers, never cents / 100; format.test.js:28-31 asserts
      formatMoney(9007199254740987) is €90,071,992,547,409.87 and passes.
      F-30  Fixed in 68d263b: the eighteen S7 titles of PLAN.md:182-199 each have a builder test in
      tests/storage.test.js (:16, :24-50, :55-179) or tests/shape.test.js (:20-57, :140-144).
      F-31  Fixed in 23a9c9e: the ten S5 titles of PLAN.md:137-146 each have a builder test in
      tests/lines.test.js (:12-83), including the four that were missing (:39, :45, :52, :71-83).
      F-37  Fixed in 996617e: main.js:16-52 holds one frozen CODES table with the banner texts and
      the blocked-screen titles and texts for STO-02, STO-03 and STO-04; blocked.js receives
      screenFor and bannerFor (:50, :64) and keeps only the copy texts, which carry no code.
      F-40  Fixed in 024fb22: router.js:60-63 routeToHash throws 'No address for route not-found'
      instead of mapping it to the customer list; router.test.js:41 asserts the throw.
      F-42  Fixed in 996617e, a2266d8, 17add5d, 6e0f818 and eba225d: MANUAL-CHECKS.md S8 (:6-15)
      holds the UX lines, S11 (:78-79) the two screen checks including the leave-a-form check, S13
      (:180) its screen check, matching PLAN.md:236-245, :357-358 and :431.
      F-44  Fixed in bd3d07b (plan) and c0576d1 (S13): MANUAL-CHECKS.md:169 and PLAN.md:420 add
      'R-31: type a customer name into the order search, then into the customer search; the address
      bar and the page title never show the typed text (review F-44)'.
      F-46  Fixed in eba225d: styles.css:634 .table-lines td[data-label] { display: table-cell } and
      :635 ::before { content: none } from 64rem, so the desktop table keeps its cells in a row; the
      stacked flex layout (:591) applies below 64rem only.
      F-47  Fixed in f19ef9e: order-form.js:75 fixed.querySelector('label').textContent = 'Customer'
      removes the (optional) suffix from the read-only Customer field in both fixed-customer forms;
      the Number field is COR-21.

## Trade-offs (0)

## Rejected by the human (cycle 1)
      F-14, F-29, F-38, F-41, F-45  note: F-14: ADR-001 and A-01 name secure contexts only,
      assumption recorded. F-29: years 0000 to 0099 are not a real input. F-38: narrowSymbol is what
      R-16 asks for, recorded in ADR-006. F-41: a commit message is history, not rewritten. F-45:
      action majors are the kit template's choice, outside this app.

## Checklists
correctness: items 1-8 ran; fired: 1, 3, 4, 5, 8; not run: none
security: not reported
contract: items 1-11 ran; fired: 1, 2, 6, 7, 8, 11; not run: none
legal: not reported

## Verdict: BUDGET: human decision
Why: 4 blocking findings confirmed; 5 planted defects survived.
Routes: reopen S7 (F-48, F-49, F-50, F-51, F-60); reopen S14 (F-15, F-36, F-33); reopen S2 (F-13,
      F-62); reopen S9, S10, S11, S12, S13, S14, S15 (F-43); question to the human: Q-04 in
      docs/REQUIREMENTS.md (F-52); question to the human: Q-05 in docs/REQUIREMENTS.md (F-10);
      question to the human: Q-06 in docs/REQUIREMENTS.md (F-53); reopen S9, S10, S11, S12, S13,
      S14, S15, S16 (F-54, F-55, F-56, F-57); reopen S9 (F-58, F-59); reopen S13 (F-34); reopen S15,
      S16 (F-35); reopen S8 (F-39, F-61); reopen S6 (F-32); re-plan: /sdlc:plan-slices with the
      finding (F-63).
Next: both fix rounds are used; there is no cycle 3. You decide:
      ship as it is: /sdlc:ship (the gate prints the review line as a warning, visibly), or
      reopen as a new requirement: add it to docs/REQUIREMENTS.md as R-nn, re-plan with
      /sdlc:plan-slices, build it as a slice, then a fresh review from cycle 1.
Not checked: UI in a real browser (manual checks in docs/MANUAL-CHECKS.md).
