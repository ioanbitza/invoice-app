# Plan: customers, orders and order lines

Status: approved

Reads: `docs/REQUIREMENTS.md` (approved), `docs/decisions/ADR-001` to `ADR-008` (accepted), `docs/UI-SPEC.md` (approved), `AGENTS.md`.

Order: pure domain rules (S1 to S6), storage (S7), UI helpers without a screen (S8), then the screens in the order of `docs/UI-SPEC.md` section 7 (S9 to S16). Each slice ends in something a test or a manual check can prove. The acceptance specs `tests/<area>.spec.mjs` belong to the tester and are on no `**Files:**` line.

The commands of every slice's Verify: `npm test` (ADR-001) and `node sdlc/tools/gate.mjs`, which must print `GATE PASS`. The manual checks of a slice go into `docs/MANUAL-CHECKS.md` under a heading `## S<n>`, unticked. The screens are seeded for a manual check by pasting a version 1 document into `localStorage` under `invoice-app` from the browser's devtools, where the screen that would create the records does not exist yet.

## S1 Money and dates (domain)
**Goal:** exact integer money and real calendar dates, as pure functions every later slice uses. **Covers:** R-06, R-11, R-14, R-15.
**Files:** `src/domain/money.js`, `src/domain/dates.js`, `tests/money.test.js`, `tests/dates.test.js`

**Tests first:**
- `R-11 parsePriceToCents accepts 5, 5.5, 5,50, 0, 0.00 and 1000000.00 and returns 500, 550, 550, 0, 0 and 100000000`
- `R-11 parsePriceToCents refuses empty text, 1,234.50, 1.234,50, 12,345, 1 234, .5, 5., -1, 1e3, €5 and 1000000.01`
- `R-11 priceInputText(1999) gives 19.99 and priceInputText(500) gives 5.00`
- `R-11 priceInputText output parses back to the same cents for 0, 1, 1999 and 100000000`
- `R-14 lineTotalCents(3, 10) is 30 and lineTotalCents(3, 1999) is 5997`
- `R-14 lineTotalCents throws when the product is not a safe integer`
- `R-15 orderTotalCents sums 5997 and 30 to 6027`
- `R-15 orderTotalCents of an order with no lines is 0`
- `R-15 orderTotalCents throws when the sum is not a safe integer`
- `R-06 isRealDate accepts 2026-02-28 and 2024-02-29`
- `R-06 isRealDate refuses 2026-02-30, 2026-13-01, 26-02-01 and empty text`
- `R-06 todayIso uses the local calendar date of the injected clock, also 30 minutes before local midnight`

**Steps:**
1. Write the tests above, run them, see them fail.
2. Add `CURRENCY`, `MAX_UNIT_PRICE_CENTS`, `MAX_QUANTITY`, `parsePriceToCents`, `priceInputText`, `lineTotalCents` and `orderTotalCents` to `src/domain/money.js` as ADR-006 says, with no `parseFloat` and no `toFixed`.
3. Add the real-date check and today as `YYYY-MM-DD` to `src/domain/dates.js` as ADR-007 says.

**Verify:** `npm test`; the gate.

**Risks:** the midnight test depends on the time zone of the machine, so it builds its clock from local date parts and never from an ISO string (TS-09).

## S2 Input validation (domain)
**Goal:** all input rules in one module, returning the cleaned value or every field error at once. **Covers:** R-01, R-02, R-06, R-07, R-11, R-12, R-17, R-31.
**Files:** `src/domain/validation.js`, `tests/validation.test.js`

**Tests first:**
- `R-01 a name of 1 and of 100 characters after trimming is valid, stored trimmed`
- `R-01 an empty name and a name of 101 characters give customer.name.length`
- `R-01 email a@b.c is valid and empty email is stored as an empty string`
- `R-01 emails ab.c, a@b, @b.c, a@bc and a@b@c.d each give an email error`
- `R-01 email a@.c is valid because R-01 asks only for a dot after the @`
- `R-01 email, phone and address of 200 characters are valid and of 201 characters give a length error`
- `R-02 the customer check gives the same errors for an edit as for a new customer`
- `R-06 an order date of 2026-02-30 gives Date must be a real calendar date.`
- `R-06 notes of 500 characters after trimming are valid and of 501 give a length error`
- `R-07 the order edit check refuses the same date and notes as the create check`
- `R-11 a description of 1 and of 200 characters is valid and empty or 201 characters gives a length error`
- `R-11 quantities 1 and 9999 are valid; 0, 10000, 2.0, 1e3, -1 and empty each give a quantity error`
- `R-11 a unit price of 1,234.50 gives the unit price error next to unitPrice`
- `R-12 the line check gives the same errors for an edit as for a new line`
- `R-17 three invalid fields give three errors in form order`
- `R-31 no error message contains the text the user typed`

**Steps:**
1. Write the tests above, run them, see them fail.
2. Write the customer check with the messages of UI-SPEC 7.2.
3. Write the order check with the messages of UI-SPEC 7.5.
4. Write the line check with the messages of UI-SPEC 7.6, using `parsePriceToCents` from S1.

**Verify:** `npm test`; the gate.

**Risks:** customers, orders and lines share this slice because ADR-003 gives them one module; it stays one slice so the file is not reopened three times. The R-01 email rule is exactly the three conditions of the requirement (ADR-007): a stricter check would refuse what R-01 allows, and two `@` count as a failure of "one `@`".

## S3 Customer commands (domain)
**Goal:** create, edit, delete, list and search customers as pure commands. **Covers:** R-01, R-02, R-03, R-04, R-05, R-06.
**Files:** `src/domain/customers.js`, `tests/customers.test.js`

**Tests first:**
- `R-01 createCustomer adds a customer with the id from deps.newId and leaves the input data unchanged`
- `R-01 createCustomer with an invalid email returns the errors and no data`
- `R-02 updateCustomer changes the fields of that customer only`
- `R-02 updateCustomer with an invalid name returns the errors and no data`
- `R-02 updateCustomer with an unknown id returns reason not-found`
- `R-03 listCustomers orders customers by the compare function it is given`
- `R-03 listCustomers breaks a tie of that compare function by id`
- `R-05 searchCustomers returns its matches in the order of the compare function it is given`
- `R-04 deleteCustomer with no orders removes the customer`
- `R-04 deleteCustomer with 3 orders returns reason customer-has-orders, orderCount 3, and no data`
- `R-04 deleteCustomer with an unknown id returns reason not-found`
- `R-05 searchCustomers with  ANA  finds Ana by name and bob@ana.ro by email`
- `R-05 searchCustomers with empty or spaces-only text returns all customers`
- `R-06 customerLabel gives Ana Pop (ana@example.com), and Ana Pop (no email) with no email`

**Steps:**
1. Write the tests above, run them, see them fail.
2. Write the commands in the shape `command(data, input, deps)` of ADR-003, calling the customer check of S2.
3. Write `listCustomers(data, compareNames)` and `searchCustomers(data, text, compareNames)`; the compare function is a parameter and the domain imports no `Intl` (ADR-003, `## Answered`).
4. Write `customerLabel` for every place a customer is picked or shown read-only (A-12).

**Verify:** `npm test`; the gate.

**Risks:** ADR-007 still says the list uses `Intl.Collator` with the locale as an argument; this plan follows the later answer in ADR-003, where `src/ui/format.js` builds the collator and the domain receives only its compare function. The real sort order, case and Romanian letters included, is therefore tested in S8, and these tests pass their own compare function.

## S4 Order commands (domain)
**Goal:** create, edit, delete, list and search orders, with numbers that are never reused. **Covers:** R-02, R-03, R-06, R-07, R-08, R-09, R-10.
**Files:** `src/domain/orders.js`, `tests/orders.test.js`

**Tests first:**
- `R-06 createOrder gives ORD-0001 first and ORD-0002 next and raises nextOrderNumber by one`
- `R-06 createOrder gives ORD-10000 when nextOrderNumber is 10000`
- `R-06 createOrder with an unknown customer returns reason not-found`
- `R-06 createOrder with an empty date gives the date error and does not substitute deps.today`
- `R-06 the number of a deleted order is not given again`
- `R-07 updateOrder changes date and notes and keeps number and customerId even when the input carries them`
- `R-07 updateOrder with an invalid date returns the errors and no data`
- `R-08 deleteOrder removes the order and its lines and keeps the customer and nextOrderNumber`
- `R-08 deleteOrder with an unknown id returns reason not-found`
- `R-09 listOrders sorts 2026-10-30 before 2026-10-12`
- `R-09 listOrders on the same date puts ORD-10000 before ORD-9999`
- `R-09 listOrders rows hold number, customer name, date and total cents`
- `R-02 listOrders shows the new customer name after updateCustomer`
- `R-03 ordersForCustomer returns that customer's rows with totals, in the R-09 order`
- `R-10 searchOrders with  ord-0002  finds the order by number and with ANA by customer name`
- `R-10 searchOrders with empty or spaces-only text returns all orders`

**Steps:**
1. Write the tests above, run them, see them fail.
2. Write `createOrder`, `updateOrder` and `deleteOrder` in the shape of ADR-003, calling the order check of S2.
3. Write the order number from `nextOrderNumber` as ADR-004 says.
4. Write `listOrders`, `ordersForCustomer` and `searchOrders`, with totals from S1 and the sort of ADR-007.

**Verify:** `npm test`; the gate.

**Risks:** `ordersForCustomer` serves the customer detail of R-03, not R-30, which is a filter on the order list and stays LATER.

## S5 Order line commands (domain)
**Goal:** add, edit and remove the lines of an order, and refuse a total too large to be exact. **Covers:** R-11, R-12, R-13, R-15.
**Files:** `src/domain/lines.js`, `tests/lines.test.js`

**Tests first:**
- `R-11 addLine appends a line with description, quantity and unitPriceCents and the id from deps.newId`
- `R-11 addLine keeps the lines in the order they were added`
- `R-11 addLine with an invalid quantity returns the errors and leaves the order out of the result`
- `R-12 updateLine changes that line only and keeps its position`
- `R-12 updateLine with an invalid price returns the errors and no data`
- `R-12 updateLine with an unknown line id returns reason not-found`
- `R-13 removeLine takes the line out and orderTotalCents falls by its line total`
- `R-13 removeLine of the only line leaves an order that totals 0`
- `R-15 addLine returns line.total.too-large on unitPrice when the new order total is not a safe integer`
- `R-15 updateLine returns line.total.too-large on unitPrice when the new order total is not a safe integer`

**Steps:**
1. Write the tests above, run them, see them fail.
2. Write `addLine`, `updateLine` and `removeLine` in the shape of ADR-003, calling the line check of S2.
3. Check the new order total before returning, as ADR-006 says, with the message of UI-SPEC 7.6.

**Verify:** `npm test`; the gate.

**Risks:** reaching `Number.MAX_SAFE_INTEGER` takes about 9 008 largest lines, so the test builds that order directly as data.

## S6 Customer export (domain)
**Goal:** one customer's data as one object that answers an access request. **Covers:** R-29, R-31.
**Files:** `src/domain/export.js`, `tests/export.test.js`

**Tests first:**
- `R-29 buildCustomerExport holds the customer's fields and all their orders with their lines`
- `R-29 buildCustomerExport holds no data of another customer`
- `R-29 buildCustomerExport states the purpose of A-13, the retention of A-14 and the currency EUR`
- `R-29 buildCustomerExport with an unknown id returns reason not-found`
- `R-31 exportFileName gives customer-<id>.json and holds no name`

**Steps:**
1. Write the tests above, run them, see them fail.
2. Write `buildCustomerExport(data, customerId)` with the shape of ADR-007 and the frozen texts from A-13 and A-14.
3. Write `exportFileName(customerId)`.

**Verify:** `npm test`; the gate.

**Risks:** the two texts are copied from the approved assumptions word for word; a later change of A-13 or A-14 must change them here too.

## S7 Storage
**Goal:** the only code that touches `localStorage`: safe load, whole-document save, write lock and erase. **Covers:** R-06, R-19, R-20, R-21, R-32.
**Files:** `src/storage/storage.js`, `src/storage/shape.js`, `tests/storage.test.js`, `tests/shape.test.js`

**Tests first:**
- `R-19 data saved through one storage is loaded equal through a new storage on the same backing`
- `R-19 save writes one key, invoice-app, with version 1`
- `R-19 load removes version, so the domain value has only nextOrderNumber, customers and orders`
- `R-19 load with no stored value returns empty data and writes nothing`
- `R-20 load of text that does not parse returns corrupt with the stored text`
- `R-20 load of version 2 returns newer and of version 0 or "1" returns corrupt`
- `R-20 shape refuses a missing field, a wrong type and a quantity that is not a safe integer`
- `R-20 shape refuses a duplicate id, a duplicate order number and a customerId with no customer`
- `R-20 shape refuses a nextOrderNumber not above every order's number`
- `R-20 shape accepts a name of 500 characters, because form rules are not checked`
- `R-20 save after a corrupt or newer load answers blocked and leaves the stored text unchanged`
- `R-21 a setItem that throws QuotaExceededError answers quota and leaves the old text`
- `R-21 any other setItem error answers unavailable and leaves the old text`
- `R-21 openBrowserStorage answers unavailable on every call when the access to localStorage throws`
- `R-32 erase removes only invoice-app, leaves other keys and returns empty data`
- `R-32 erase works after a corrupt load and then save succeeds`
- `R-32 a removeItem that throws answers unavailable`
- `R-06 after erase the next order starts again at number 1`

**Steps:**
1. Write the tests above with an in-memory `Storage` fake (JS-17), run them, see them fail.
2. Write `src/storage/shape.js` with the checks of ADR-004, section Reading.
3. Write `createStorage(backing)` with `load`, `save` and `erase` and the results of ADR-004.
4. Write `openBrowserStorage()`, the one place that touches `window.localStorage`.

**Verify:** `npm test`; the gate.

**Risks:** `storage.js` has no browser `QuotaExceededError` under Node, so the fake throws a `DOMException` with that name, which is available in Node 22. The first check of the real quota is the manual R-21 check of S11.

## S8 Router and formatters (pure UI helpers)
**Goal:** addresses, page titles, money, dates and the name order as pure functions tested under Node, before any screen. **Covers:** R-03, R-16, R-28, R-31.
**Files:** `src/ui/router.js`, `src/ui/format.js`, `tests/router.test.js`, `tests/format.test.js`

**Tests first:**
- `R-03 createNameCompare(en) sorts ana, Bogdan, Zoe whatever the case`
- `R-03 createNameCompare(ro) sorts Șerban after Radu and before Tudor`
- `R-16 formatMoney(123450, en) gives €1,234.50`
- `R-16 formatMoney(123450, ro) gives 1.234,50 € with the locale's spaces`
- `R-16 formatMoney(0, en) gives €0.00`
- `R-28 parseRoute reads each of the nine routes of ADR-005 and routeToHash gives the same hash back`
- `R-28 parseRoute of #/nothing and #/orders/1/2/3 gives not-found`
- `R-31 parseRoute keeps no text of an unknown hash in its result`
- `R-31 the title of every route comes from the frozen table and holds no id`
- `R-28 formatDate(2026-10-30, en-GB) gives 30 Oct 2026 in any time zone of the process`

**Steps:**
1. Write the tests above, run them, see them fail.
2. Write `parseRoute`, `routeToHash` and the frozen table of page titles of UI-SPEC section 7 in `src/ui/router.js`.
3. Write `formatMoney(cents, locale)` and `formatDate(isoDate, locale)` in `src/ui/format.js`, with the options of UI-SPEC section 4 and ADR-006.
4. Write `createNameCompare(locale)` in `src/ui/format.js`: it builds one `Intl.Collator(locale, { sensitivity: 'accent' })` and returns its compare function (ADR-003, `## Answered`).

**Verify:** `npm test`; the gate. This slice has no screen, so its lines below are ticked once S9 is on screen. Into `docs/MANUAL-CHECKS.md`:
- [ ] R-16: in a browser set to Romanian, open a screen with an amount (from S12), it shows 1.234,50 € rather than €1,234.50
- [ ] R-31: open a route with a made-up id, the URL shows the id only and the page title holds no record data
- [ ] UX: keyboard only, from the first field to the outcome, focus visible at every step
- [ ] UX: 200% browser zoom, nothing cut off, no horizontal scroll
- [ ] UX: contrast 4.5:1 on text, 3:1 on large text and borders (browser devtools)
- [ ] UX: empty states: an empty list and an empty form say what to do
- [ ] UX: a validation error appears next to its field and says how to fix it
- [ ] UX: 320 px wide, every screen of the slice, no horizontal scroll
- [ ] UX: design tokens only: no raw color, size or spacing outside :root in styles.css (grep for "#", "rgb(", "px" outside the token block)
- [ ] UX: every button, link, input and tab shows hover, focus-visible, active and disabled as docs/UI-SPEC.md describes
- [ ] UX: type and spacing scales respected: every font-size and every margin, padding and gap is a token
- [ ] UX: each screen of the slice matches its sketch in docs/UI-SPEC.md at 320 px and at desktop width

**Risks:** the exact spaces in `ro` currency text come from the runtime's `Intl` data, so the test compares against `Intl.NumberFormat` output for the digits and the symbol, not against a typed space.

## S9 App frame, not found and blocked screen
**Goal:** the page, its tokens, one write path and the two screens with no record behind them. **Covers on screen:** R-20, R-21, R-22, R-28, R-31, R-32.
**Files:** `index.html`, `styles.css`, `src/ui/main.js`, `src/ui/views/components.js`, `src/ui/views/not-found.js`, `src/ui/views/blocked.js`

`src/ui/views/components.js` joins the module map by the answer in ADR-003: pure rendering helpers, no state, no business rules.

**Tests first:** none under Node; ADR-003 covers views by manual checks, and the storage and router rules this slice uses are tested in S7 and S8.

**Steps:**
1. Write `index.html`: the CSP meta tag of ADR-008 before any script or stylesheet, `lang="en"`, the one `<dialog>`, the four icon templates of UI-SPEC section 6, relative URLs, one module script.
2. Write the `:root` tokens of `styles.css` from UI-SPEC sections 3, 4, 5 and 9, and the styles of the components of section 6.
3. Write `src/ui/main.js`: composition root, UI state, `commit`, the name compare built once from `createNameCompare`, the frozen code table, the `error` and `unhandledrejection` listeners, the one `hashchange` listener with the leave-a-form rule of UI-SPEC section 8. A route whose screen is not built yet renders screen 7.7.
4. Write `src/ui/views/components.js`, pure rendering helpers: banner, dialog content, field with label, helper and error, empty state. Opening the dialog and returning focus stay in `src/ui/main.js`, because the helpers hold no state.
5. Build screen 7.7 Not found and screen 7.8 Blocked screen from UI-SPEC.md, and the focus rules of section 8 for them.

**Verify:** `npm test`; the gate. Serve with `python3 -m http.server 8000`. Into `docs/MANUAL-CHECKS.md`:
- [ ] R-20: put invalid JSON under the invoice-app key and reload, the blocked screen shows, no list and no nav, the stored text is unchanged
- [ ] R-20: put a document with version 2 under the key and reload, the newer-version text shows with STO-04
- [ ] R-20: choose Start with empty data, a dialog says the old data will be lost; Cancel keeps the text, confirming replaces it
- [ ] R-20: with storage access denied in the browser, reload, the unavailable text shows with STO-02 and no stored text is offered
- [ ] R-21: on the blocked screen, run Storage.prototype.removeItem = () => { throw new Error('test'); } in the devtools console, confirm Start with empty data, the banner shows STO-02 and the screen stays
- [ ] R-22: put a customer name of <b>x</b> in the stored document, nothing on the blocked or not-found screen interprets it
- [ ] R-28: on the not-found screen, both links reach their lists' routes and the nav shows no current item
- [ ] R-31: open #/some-private-text, the screen and the title show none of it
- [ ] R-32: on the blocked screen, Start with empty data after its confirmation removes the invoice-app key
- [ ] UX: keyboard only, from the first field to the outcome, focus visible at every step
- [ ] UX: 200% browser zoom, nothing cut off, no horizontal scroll
- [ ] UX: contrast 4.5:1 on text, 3:1 on large text and borders (browser devtools)
- [ ] UX: empty states: an empty list and an empty form say what to do
- [ ] UX: a validation error appears next to its field and says how to fix it
- [ ] UX: 320 px wide, every screen of the slice, no horizontal scroll
- [ ] UX: design tokens only: no raw color, size or spacing outside :root in styles.css (grep for "#", "rgb(", "px" outside the token block)
- [ ] UX: every button, link, input and tab shows hover, focus-visible, active and disabled as docs/UI-SPEC.md describes
- [ ] UX: type and spacing scales respected: every font-size and every margin, padding and gap is a token
- [ ] UX: each screen of the slice matches its sketch in docs/UI-SPEC.md at 320 px and at desktop width
- [ ] UX: leaving a form: S9 writes the guard and S11 completes this check with the first real form: type in a form, click Orders, then Keep editing: the text is still there; repeat with the browser's Back
- [ ] UX: not found: an invented hash shows the screen and no part of the hash
- [ ] UX: blocked screen: with invalid JSON under the invoice-app key, no list and no nav show; copy works; Start with empty data asks first
- [ ] UX: all colors: the contrast ratios of section 3 match the browser devtools

**Risks:** `main.js` is the file most slices reopen; each adds only its routes. Copying to the clipboard needs a secure context, which `localhost` is. `form-action 'none'` in the CSP blocks a real form submission, so every submit handler must call `preventDefault`; S11 proves it.

## S10 Customer list screen
**Goal:** find a customer by typing, with the data note and the erase action. **Covers on screen:** R-03, R-05, R-18, R-19, R-22, R-28, R-32.
**Files:** `styles.css`, `src/ui/main.js`, `src/ui/views/customer-list.js`

Reopens `styles.css` to add this screen's layout and `src/ui/main.js` to add its route; S9 built only the frame.

**Tests first:** none under Node; the list, sort and search rules are tested in S3.

**Steps:**
1. Build screen 7.1 Customer list and its empty state from UI-SPEC.md, as a table with stacked rows below 64rem.
2. Wire search on the `input` event so only the results region re-renders, with the `Showing 3 of 12` line and the name compare `src/ui/main.js` passes in.
3. Add the R-19 note, always shown, and `Erase all data` with its dialog.
4. Add the route to `src/ui/main.js` and the focus rules of UI-SPEC section 8.

**Verify:** `npm test`; the gate. Seed customers through devtools. Into `docs/MANUAL-CHECKS.md`:
- [ ] R-03: with seeded customers, the list shows name and email, sorted by name whatever the case
- [ ] R-05: type part of a name, then part of an email, with spaces around it, only matching rows show; empty the box, all show
- [ ] R-18: with no customers, No customers yet. Add the first one. shows; with a search that matches nothing, Clear search returns all and focus to the box
- [ ] R-19: the note about this browser shows, also with no customers
- [ ] R-22: seed a customer named <b>x</b> and search for <b>x</b>, the text shows literally in the row
- [ ] R-28: Customers and Orders are reachable from this screen, the Customers link is marked current
- [ ] R-32: press Erase all data, the dialog says all customers and orders will be gone for good; Cancel changes nothing, confirming empties the list and the invoice-app key is gone
- [ ] UX: keyboard only, from the first field to the outcome, focus visible at every step
- [ ] UX: 200% browser zoom, nothing cut off, no horizontal scroll
- [ ] UX: contrast 4.5:1 on text, 3:1 on large text and borders (browser devtools)
- [ ] UX: empty states: an empty list and an empty form say what to do
- [ ] UX: a validation error appears next to its field and says how to fix it
- [ ] UX: 320 px wide, every screen of the slice, no horizontal scroll
- [ ] UX: design tokens only: no raw color, size or spacing outside :root in styles.css (grep for "#", "rgb(", "px" outside the token block)
- [ ] UX: every button, link, input and tab shows hover, focus-visible, active and disabled as docs/UI-SPEC.md describes
- [ ] UX: type and spacing scales respected: every font-size and every margin, padding and gap is a token
- [ ] UX: each screen of the slice matches its sketch in docs/UI-SPEC.md at 320 px and at desktop width
- [ ] UX: customer list: type in search, the caret stays and the list narrows; a 100-character name wraps at 320 px and truncates with a title on desktop

**Risks:** the row links to the customer detail, and `New customer` to the form, reach screen 7.7 until S11 and S12 build them. A link over a whole row relies on `position: relative` on a `<tr>`, to be checked in Safari.

## S11 Customer form screen
**Goal:** create and edit a customer with visible errors and no lost typing. **Covers on screen:** R-01, R-02, R-17, R-21, R-22.
**Files:** `styles.css`, `src/ui/main.js`, `src/ui/views/customer-form.js`

Reopens `styles.css` to add the form layout and `src/ui/main.js` to add the two routes; S10 did not need either.

**Tests first:** none under Node; the rules are tested in S2 and S3.

**Steps:**
1. Build screen 7.2 Customer form and its empty state from UI-SPEC.md, for new and for edit.
2. On Save, read the raw strings, call the command of S3 and pass the result to `commit`; show field errors and focus the first.
3. Make Cancel land as ADR-005 says, and take a snapshot of the fields for the leave-a-form rule of UI-SPEC section 8.
4. Add the routes to `src/ui/main.js`; an unknown `id` on edit shows screen 7.7.

**Verify:** `npm test`; the gate. Into `docs/MANUAL-CHECKS.md`:
- [ ] R-01: save a name only, the customer appears in the list; save with email ab.c, the error shows and nothing is saved
- [ ] R-02: edit a customer with an invalid email, the old values stay; edit with valid values, the list shows them
- [ ] R-17: leave the name empty and give a bad email, both messages show next to their fields, focus is on Name; Cancel discards and the saved values stay
- [ ] R-21: fill localStorage from devtools until a save fails, the form stays filled and shows STO-01; free space and press Save again, it saves
- [ ] R-22: save a customer named <b>x</b>, the form and the list show it literally
- [ ] UX: keyboard only, from the first field to the outcome, focus visible at every step
- [ ] UX: 200% browser zoom, nothing cut off, no horizontal scroll
- [ ] UX: contrast 4.5:1 on text, 3:1 on large text and borders (browser devtools)
- [ ] UX: empty states: an empty list and an empty form say what to do
- [ ] UX: a validation error appears next to its field and says how to fix it
- [ ] UX: 320 px wide, every screen of the slice, no horizontal scroll
- [ ] UX: design tokens only: no raw color, size or spacing outside :root in styles.css (grep for "#", "rgb(", "px" outside the token block)
- [ ] UX: every button, link, input and tab shows hover, focus-visible, active and disabled as docs/UI-SPEC.md describes
- [ ] UX: type and spacing scales respected: every font-size and every margin, padding and gap is a token
- [ ] UX: each screen of the slice matches its sketch in docs/UI-SPEC.md at 320 px and at desktop width
- [ ] UX: customer form: Save with a bad email and an empty name, both errors show, focus lands on Name, nothing is saved
- [ ] UX: leaving a form: type in a form, click Orders, then Keep editing: the text is still there; repeat with the browser's Back

**Risks:** `Keep editing` sets the hash back and skips one render; this is the first real test of the guard written in S9.

## S12 Customer detail screen
**Goal:** one customer's fields and orders, with delete and export. **Covers on screen:** R-03, R-04, R-16, R-18, R-22, R-28, R-29.
**Files:** `styles.css`, `src/ui/main.js`, `src/ui/views/customer-detail.js`

Reopens `styles.css` to add the detail list and the orders table and `src/ui/main.js` to add the route; this screen did not exist in S10 or S11.

**Tests first:** none under Node; the rules are tested in S3, S4 and S6.

**Steps:**
1. Build screen 7.3 Customer detail and its empty state from UI-SPEC.md.
2. Show the customer's orders from `ordersForCustomer` with `formatMoney` and `formatDate`.
3. Wire `Delete customer`: the dialog with no orders, the warning banner with orders, as R-04 says.
4. Wire `Export data` through a `Blob` and `<a download>` with the name from `exportFileName`.
5. Add the route to `src/ui/main.js`.

**Verify:** `npm test`; the gate. Seed orders through devtools. Into `docs/MANUAL-CHECKS.md`:
- [ ] R-03: the detail shows all fields and the customer's orders with their totals
- [ ] R-04: on a customer with 3 orders, Delete customer shows no dialog, the banner names 3 orders, that no legal retention applies, and that deleting those orders and then the customer erases all of this customer's data; nothing changes; with 1 order the banner says 1 order
- [ ] R-04: on a customer with no orders, a dialog asks first; Cancel keeps the customer, confirming deletes it and lands on the list
- [ ] R-16: amounts show two decimals and the euro sign, in the browser's language
- [ ] R-18: a customer with no orders shows No orders for this customer yet. Create the first one. with New order
- [ ] R-22: seed a customer address of <b>x</b>, the detail shows it literally
- [ ] R-28: selecting an order row leaves for that order's address; Customers and Orders are reachable
- [ ] R-29: Export data downloads customer-<id>.json under the CSP, with the purpose, the retention, all this customer's orders and lines, and no other customer's data
- [ ] UX: keyboard only, from the first field to the outcome, focus visible at every step
- [ ] UX: 200% browser zoom, nothing cut off, no horizontal scroll
- [ ] UX: contrast 4.5:1 on text, 3:1 on large text and borders (browser devtools)
- [ ] UX: empty states: an empty list and an empty form say what to do
- [ ] UX: a validation error appears next to its field and says how to fix it
- [ ] UX: 320 px wide, every screen of the slice, no horizontal scroll
- [ ] UX: design tokens only: no raw color, size or spacing outside :root in styles.css (grep for "#", "rgb(", "px" outside the token block)
- [ ] UX: every button, link, input and tab shows hover, focus-visible, active and disabled as docs/UI-SPEC.md describes
- [ ] UX: type and spacing scales respected: every font-size and every margin, padding and gap is a token
- [ ] UX: each screen of the slice matches its sketch in docs/UI-SPEC.md at 320 px and at desktop width
- [ ] UX: customer detail: Delete with orders shows the warning with the count and no dialog; Export data downloads customer-<id>.json under the CSP

**Risks:** the download under `default-src 'none'` is checked once here, as ADR-008 requires. `New order` and the order rows reach screen 7.7 until S14 and S15 build them.

## S13 Order list screen
**Goal:** find an order by typing, newest first, with its total. **Covers on screen:** R-09, R-10, R-16, R-18, R-22, R-28.
**Files:** `styles.css`, `src/ui/main.js`, `src/ui/views/order-list.js`

Reopens `styles.css` to add the columns of this table and `src/ui/main.js` to add the route; this screen did not exist before.

**Tests first:** none under Node; the rules are tested in S4 and S8.

**Steps:**
1. Build screen 7.4 Order list and its three empty states from UI-SPEC.md.
2. Wire search on the `input` event as in S10, keeping the text in the UI state.
3. Add the route to `src/ui/main.js`.

**Verify:** `npm test`; the gate. Seed orders through devtools. Into `docs/MANUAL-CHECKS.md`:
- [ ] R-09: the list shows number, customer, date and total, newest date first, then highest number first
- [ ] R-10: type part of a number, then part of a customer name in another case, only matching rows show; empty the box, all show
- [ ] R-16: totals show two decimals and the euro sign, in the browser's language
- [ ] R-18: with no customers the list says a customer must be added first and links to the customer form, and no order can be started; with no orders it offers the first one; a search with no match says so and offers to clear it
- [ ] R-22: search for <b>x</b>, the search text and any customer named so show literally
- [ ] R-28: selecting a row leaves for that order's address; Customers and Orders are reachable, the Orders link is marked current
- [ ] UX: keyboard only, from the first field to the outcome, focus visible at every step
- [ ] UX: 200% browser zoom, nothing cut off, no horizontal scroll
- [ ] UX: contrast 4.5:1 on text, 3:1 on large text and borders (browser devtools)
- [ ] UX: empty states: an empty list and an empty form say what to do
- [ ] UX: a validation error appears next to its field and says how to fix it
- [ ] UX: 320 px wide, every screen of the slice, no horizontal scroll
- [ ] UX: design tokens only: no raw color, size or spacing outside :root in styles.css (grep for "#", "rgb(", "px" outside the token block)
- [ ] UX: every button, link, input and tab shows hover, focus-visible, active and disabled as docs/UI-SPEC.md describes
- [ ] UX: type and spacing scales respected: every font-size and every margin, padding and gap is a token
- [ ] UX: each screen of the slice matches its sketch in docs/UI-SPEC.md at 320 px and at desktop width
- [ ] UX: order list: with no customers only the "Add a customer first" message shows; with customers, Back from an order keeps the search

**Risks:** the last check needs an order to open, so it is ticked after S15.

## S14 Order form screen
**Goal:** start an order for the right customer and change its date and notes. **Covers on screen:** R-06, R-07, R-17, R-18, R-21, R-22.
**Files:** `styles.css`, `src/ui/main.js`, `src/ui/views/order-form.js`

Reopens `styles.css` to add the read-only fields and `src/ui/main.js` to add the three routes; this screen did not exist before.

**Tests first:** none under Node; the rules are tested in S1, S2, S3 and S4.

**Steps:**
1. Build screen 7.5 Order form and its empty state from UI-SPEC.md, in its three forms.
2. Fill the picker from `listCustomers`, with the name compare `src/ui/main.js` passes in, and `customerLabel`, and the date with today from the injected clock.
3. On Save call the command of S4 and pass the result to `commit`; show field errors and focus the first.
4. Add the routes to `src/ui/main.js`, with the landings of ADR-005 and the leave-a-form snapshot.

**Verify:** `npm test`; the gate. Into `docs/MANUAL-CHECKS.md`:
- [ ] R-06: with two customers of the same name, the picker tells them apart by email; a saved order gets the next number and today's date unless changed, and opens
- [ ] R-06: delete the newest order and create another, the number is not reused
- [ ] R-07: edit an order, date and notes change; number and customer are read-only
- [ ] R-17: save with no customer and a cleared date, both messages show and focus is on Customer; Cancel lands as ADR-005 says
- [ ] R-18: on #/orders/new with no customers, no form shows and the message links to the customer form
- [ ] R-21: fill localStorage until a save fails, the form stays filled and shows STO-01, and no order number is used up
- [ ] R-22: save notes of <b>x</b>, the form shows them literally
- [ ] UX: keyboard only, from the first field to the outcome, focus visible at every step
- [ ] UX: 200% browser zoom, nothing cut off, no horizontal scroll
- [ ] UX: contrast 4.5:1 on text, 3:1 on large text and borders (browser devtools)
- [ ] UX: empty states: an empty list and an empty form say what to do
- [ ] UX: a validation error appears next to its field and says how to fix it
- [ ] UX: 320 px wide, every screen of the slice, no horizontal scroll
- [ ] UX: design tokens only: no raw color, size or spacing outside :root in styles.css (grep for "#", "rgb(", "px" outside the token block)
- [ ] UX: every button, link, input and tab shows hover, focus-visible, active and disabled as docs/UI-SPEC.md describes
- [ ] UX: type and spacing scales respected: every font-size and every margin, padding and gap is a token
- [ ] UX: each screen of the slice matches its sketch in docs/UI-SPEC.md at 320 px and at desktop width
- [ ] UX: order form: the picker shows name and email for two customers of the same name; the date field opens with today

**Risks:** Save lands on the order view, which is screen 7.7 until S15, so the "opens" part of the first check is ticked after S15. A `type="date"` field returns an empty value for an impossible date, so it shows the date message rather than a browser one.

## S15 Order view screen
**Goal:** read an order with its lines and total, and delete it. **Covers on screen:** R-08, R-14, R-15, R-16, R-18, R-22, R-28.
**Files:** `styles.css`, `src/ui/main.js`, `src/ui/views/order-view.js`

Reopens `styles.css` to add the order details and the lines table and `src/ui/main.js` to add the route; this screen did not exist before.

**Tests first:** none under Node; the rules are tested in S1, S4 and S8.

**Steps:**
1. Build screen 7.6 Order view from UI-SPEC.md up to the `Order total` line: details, lines table and stacked rows, and the no-lines message.
2. Show line totals and the order total from S1 through `formatMoney`; nothing is added up in the view.
3. Wire `Delete order` with its dialog, landing on `#/orders`.
4. Add the route to `src/ui/main.js`.

**Verify:** `npm test`; the gate. Seed lines through devtools. Into `docs/MANUAL-CHECKS.md`:
- [ ] R-08: Delete order asks first; Cancel changes nothing, confirming removes the order and its lines, and the customer stays
- [ ] R-14: lines of 3 × 0.10 and 3 × 19.99 show line totals of 0.30 and 59.97
- [ ] R-15: the order total is the sum of the line totals; an order with no lines shows 0.00
- [ ] R-16: every amount shows two decimals and the euro sign, in the browser's language
- [ ] R-18: an order with no lines shows No lines yet. Add the first one.
- [ ] R-22: seed notes and a description of <b>x</b>, the view shows them literally
- [ ] R-28: the view shows number, customer, date, notes, each line in the order added, and the total; the Customer link and both lists are reachable; from the order list and the customer detail, selecting an order opens this view
- [ ] UX: keyboard only, from the first field to the outcome, focus visible at every step
- [ ] UX: 200% browser zoom, nothing cut off, no horizontal scroll
- [ ] UX: contrast 4.5:1 on text, 3:1 on large text and borders (browser devtools)
- [ ] UX: empty states: an empty list and an empty form say what to do
- [ ] UX: a validation error appears next to its field and says how to fix it
- [ ] UX: 320 px wide, every screen of the slice, no horizontal scroll
- [ ] UX: design tokens only: no raw color, size or spacing outside :root in styles.css (grep for "#", "rgb(", "px" outside the token block)
- [ ] UX: every button, link, input and tab shows hover, focus-visible, active and disabled as docs/UI-SPEC.md describes
- [ ] UX: type and spacing scales respected: every font-size and every margin, padding and gap is a token
- [ ] UX: each screen of the slice matches its sketch in docs/UI-SPEC.md at 320 px and at desktop width

**Risks:** the screen is split across S15 and S16 because it serves eleven requirements. Until S16 the screen has no `Add line`, `Edit` or `Remove`, so S15's sketch check covers the read-only part only.

## S16 Order lines on screen
**Goal:** add, edit and remove lines in the order view, with the total updating at once. **Covers on screen:** R-11, R-12, R-13, R-17, R-18, R-21, R-22, R-28.
**Files:** `styles.css`, `src/ui/views/order-view.js`

Reopens `styles.css` to add the line form and `src/ui/views/order-view.js` because ADR-005 places the line form inside the order view, which S15 built without it.

**Tests first:** none under Node; the rules are tested in S1, S2 and S5.

**Steps:**
1. Add `Add line`, and each row's `Edit` and `Remove` with the `aria-label` of UI-SPEC 7.6, to screen 7.6 Order view.
2. Build the line form of screen 7.6, with the unit price from `priceInputText` on edit, one form at a time, and the row in its editing state.
3. On Save and Remove call the commands of S5 and pass the result to `commit`; show field errors and focus the first.
4. Add the focus rules of UI-SPEC section 8 and the leave-a-form snapshot for the line form.

**Verify:** `npm test`; the gate. Into `docs/MANUAL-CHECKS.md`:
- [ ] R-11: add a line with price 19,99, it is saved; quantity 0 or price 1,234.50 shows an error next to the field and adds nothing; Edit shows the price as 19.99
- [ ] R-12: change a line's quantity and price, the order total updates at once; an invalid edit leaves the old values
- [ ] R-13: Remove takes the line out at once and the total falls
- [ ] R-17: Cancel closes the line form, discards what was typed, and the saved line stays
- [ ] R-18: from the no-lines message, Add line opens the form
- [ ] R-21: fill localStorage until saving a line fails, the form stays open with what was typed and shows STO-01; a failed Remove keeps the line and shows the banner
- [ ] R-22: add a line described <b>x</b>, it shows literally
- [ ] R-28: from the order view the user can edit the order, add, edit and remove lines, and delete the order
- [ ] UX: keyboard only, from the first field to the outcome, focus visible at every step
- [ ] UX: 200% browser zoom, nothing cut off, no horizontal scroll
- [ ] UX: contrast 4.5:1 on text, 3:1 on large text and borders (browser devtools)
- [ ] UX: empty states: an empty list and an empty form say what to do
- [ ] UX: a validation error appears next to its field and says how to fix it
- [ ] UX: 320 px wide, every screen of the slice, no horizontal scroll
- [ ] UX: design tokens only: no raw color, size or spacing outside :root in styles.css (grep for "#", "rgb(", "px" outside the token block)
- [ ] UX: every button, link, input and tab shows hover, focus-visible, active and disabled as docs/UI-SPEC.md describes
- [ ] UX: type and spacing scales respected: every font-size and every margin, padding and gap is a token
- [ ] UX: each screen of the slice matches its sketch in docs/UI-SPEC.md at 320 px and at desktop width
- [ ] UX: order view: add, edit and remove a line by keyboard, the total updates each time; while the line form is open the row buttons are disabled

**Risks:** a disabled button loses focus when the form opens, so the focus moves to Description first, as UI-SPEC section 8 says. The largest amounts must still fit the columns at 64rem.

## Decisions needed from the human
None.

Critic CRI-2 (advisory): the formatDate test title carried R-31, which is not about dates; retagged to R-28 (done in this draft).
Critic CRI-7 (advisory): an S4 test title named two behaviours and one a command cannot show; replaced with `R-06 createOrder with an empty date gives the date error and does not substitute deps.today` (done in this draft).
Critic CRI-9 (advisory): every Verify needs `package.json`, committed by the human before S1; add that precondition to the plan header. It is already committed, so nothing blocks S1.
Critic CRI-10 (advisory): the S7 Risks line named `shape.js` where the quota path is in `storage.js`; corrected (done in this draft).
