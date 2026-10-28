# Plan: invoice app

Input: `docs/REQUIREMENTS.md` (Status: approved), `AGENTS.md`, ADR-001, ADR-002.
Order: domain (S1 to S4), storage (S5), UI (S6, S7). Each slice ends in something that can be tested.

Shared design, so every slice builds against the same shapes:
- State is the stored object from the data model sketch: `{ version: 1, nextOrderNumber, customers, orders }`.
- Domain functions are pure and never mutate their input. A change returns `{ ok: true, state }` or `{ ok: false, errors }`, where `errors` maps a field name to a message (`{ name: 'Name is required' }`). Lookups return plain values.
- New IDs come in as an argument (`newId`) so tests are deterministic; the UI passes `crypto.randomUUID()`.
- Money is integer cents everywhere. Text becomes cents only in `src/domain/money.js`.
- The store in `src/storage/` gets the storage object injected (`createStore(storage)`), so tests use a small in-memory fake with the same `getItem`/`setItem` methods. No config file and no test library are needed: `node --test` finds `tests/*.test.js`, and Node 22.12+ loads them as ES modules without a `package.json`.

## S1 Money and totals (domain)
**Goal:** parse euro input to cents, compute line and order totals, and format cents as EUR. **Covers:** R-12, R-15, R-16.
**Files:** `src/domain/money.js`, `tests/money.test.js`

**Tests first:**
- `R-12 parses "12.5" as 1250 cents`
- `R-12 parses "0", "0.00" and "1000000.00" at the bounds`
- `R-12 refuses "12.345" (three decimals)`
- `R-12 refuses negative, above 1,000,000.00, empty and non-numeric input`
- `R-15 line total is quantity times unit price in cents`
- `R-15 line total stays exact for 9999 × 100000000 cents`
- `R-16 order total sums its line totals`
- `R-16 order with no lines totals 0`
- `R-16 formats 123450 cents as "€1,234.50"`
- `R-16 formats 0 as "€0.00" and 5 as "€0.05"`

**Steps:**
1. `parseEuros(text)` returns `{ ok: true, cents }` or `{ ok: false, error }`. It trims and matches `^\d+(\.\d{1,2})?$`, then builds cents from the integer and fraction strings, never with float multiplication.
2. `lineTotalCents(line)` returns `quantity * unitPriceCents`.
3. `orderTotalCents(order)` sums `lineTotalCents` over `order.lines`.
4. `formatEuros(cents)` builds `€` + thousands-grouped euros + `.` + two-digit cents, using integer division only.

**Verify:** `node --test tests/money.test.js`
**Risks:** whether "12,50" (comma as decimal separator) should be accepted is open, see D1. Until then it is refused with a message. The largest line total (9999 × 100,000,000) is about 1e12, well inside safe integers.

## S2 Customer rules (domain)
**Goal:** create, validate, edit, delete-check, search and sort customers. **Covers:** R-01, R-02, R-03, R-05, R-06.
**Files:** `src/domain/customers.js`, `tests/customers.test.js`

**Tests first:**
- `R-01 adds a customer with a trimmed name and empty optional email and phone`
- `R-01 customer list is sorted by name, case-insensitive`
- `R-02 refuses an empty or whitespace-only name and saves nothing`
- `R-02 refuses an email without exactly one @, without text on both sides, or without a dot after @`
- `R-02 accepts an empty email`
- `R-02 refuses a name over 100, an email over 254 and a phone over 30 characters`
- `R-03 edit keeps the customer id and their orders`
- `R-03 edit applies the same validation as create`
- `R-05 delete refuses a customer with orders and reports how many`
- `R-05 delete removes a customer without orders`
- `R-06 search matches name or email, case-insensitive, trimmed`
- `R-06 empty search returns all customers`

**Steps:**
1. `validateCustomer(input)` returns an `errors` object (empty when valid); it trims all three fields first.
2. `addCustomer(state, input, newId)` and `updateCustomer(state, id, input)` validate and return the result shape.
3. `deleteCustomer(state, id)` refuses with `{ ok: false, errors: { orders: '<n> orders ...' }, orderCount }` when the customer has orders.
4. `searchCustomers(customers, text)` and `sortCustomers(customers)` (A-07).

**Verify:** `node --test tests/customers.test.js`
**Risks:** the email rule is exactly the one in R-02 and nothing stricter. Lengths are checked after trimming.

## S3 Order rules (domain)
**Goal:** create, re-date, delete and filter orders and list a customer's orders with totals. **Covers:** R-04, R-07, R-08, R-09, R-10.
**Files:** `src/domain/orders.js`, `tests/orders.test.js`

**Tests first:**
- `R-04 lists a customer's orders with each order's total`
- `R-07 creates an order with no lines for an existing customer`
- `R-07 refuses an order for a customer that does not exist`
- `R-07 order numbers count up from nextOrderNumber and are not reused after a delete`
- `R-07 refuses a date that is not a real YYYY-MM-DD calendar date`
- `R-08 changes the order date and keeps the customer`
- `R-09 deleting an order removes it with its lines`
- `R-10 filters by customer`
- `R-10 filters by text on order number or customer name, case-insensitive`
- `R-10 empty filter shows all orders, newest date first`

**Steps:**
1. `isCalendarDate(text)` checks the format and that the date exists (no 2026-02-30).
2. `addOrder(state, customerId, date, newId)` uses `state.nextOrderNumber` and increments it.
3. `updateOrderDate(state, orderId, date)` and `deleteOrder(state, orderId)`.
4. `filterOrders(state, { customerId, text })` sorts by date descending, then by number descending.
5. `ordersOfCustomer(state, customerId)` returns the orders with `totalCents` from `money.js`.

**Verify:** `node --test tests/orders.test.js`
**Risks:** "today" for the default date (R-07) is computed in the UI from the local date and passed in, so the domain stays pure. Ties on the same date are sorted by the higher order number first; the requirements do not say this.

## S4 Order line rules (domain)
**Goal:** add, validate, edit and remove lines on an order. **Covers:** R-11, R-12, R-13, R-14.
**Files:** `src/domain/lines.js`, `tests/lines.test.js`

**Tests first:**
- `R-11 adds a line with description, quantity and unit price in cents to its order`
- `R-11 lines keep the order in which they were added`
- `R-12 refuses an empty description and one over 200 characters`
- `R-12 refuses quantity 0, 10000, "1.5" and non-numbers`
- `R-12 refuses a unit price with three decimals`
- `R-12 stores unit price "12.5" as 1250 cents`
- `R-13 edit keeps the line id and position and applies the same validation`
- `R-14 removing a line drops it and the order total goes down by its line total`

**Steps:**
1. `validateLine(input)` takes the form's text values and returns `{ errors, line }`. It uses `parseEuros` from `money.js` and accepts only a quantity matching `^\d+$` within 1..9999.
2. `addLine(state, orderId, input, newId)` and `updateLine(state, orderId, lineId, input)`.
3. `removeLine(state, orderId, lineId)`.

**Verify:** `node --test tests/lines.test.js`
**Risks:** none known beyond D1.

## S5 Store (storage)
**Goal:** load and save the whole state under one key, never overwrite unreadable data, and report failed writes. **Covers:** R-17, R-18, R-19.
**Files:** `src/storage/store.js`, `tests/store.test.js`

**Tests first:**
- `R-17 a missing key loads the empty state with version 1 and nextOrderNumber 1`
- `R-17 a saved state loads back equal after a new store is created on the same storage`
- `R-18 unparsable JSON loads as an error and the stored text is left unchanged`
- `R-18 wrong shape or a version other than 1 loads as an error`
- `R-18 after a failed load every save is refused and the stored text is unchanged`
- `R-19 a throwing setItem returns an error and the store keeps the previous state`

**Steps:**
1. `createStore(storage)` returns `{ load, save, current }`.
2. `load()` returns `{ ok: true, state }` or `{ ok: false, error }`. It checks the shape: version 1, integer nextOrderNumber, arrays of customers and orders with the field types of the data model sketch.
3. `save(nextState)` writes `JSON.stringify` under `invoice-app`. It updates `current` only when the write succeeded, and refuses when the load failed.
4. Every `catch` returns the error with a readable message; none is empty.

**Verify:** `node --test tests/store.test.js`
**Risks:** the shape check must be strict enough to reject damaged data, but not so strict that it rejects valid data the app wrote itself. A round-trip test (save then load) guards this.

## S6 App shell and customer screens (UI)
**Goal:** page layout, error banner, and the customer list, search, form, view and delete wired to the domain and the store. **Covers on screen:** R-01..R-06, R-17, R-18, R-19, R-20, R-21.
**Files:** `index.html`, `styles.css`, `src/ui/app.js`, `src/ui/customers-view.js`

**Tests first:** UI is checked by hand (below). The rules it calls are already tested in S2, S3 and S5.

**Steps:**
1. `index.html` has two tabs (Customers, Orders), a main area, and an error banner region with `role="alert"`. It loads `src/ui/app.js` as a module.
2. `app.js` creates the store and loads it. On a load error it shows the banner and disables all forms. It has one `commit(result)` that saves, re-renders on success, and shows the error on failure.
3. `customers-view.js` renders the list with search, the empty and no-results messages, the add/edit form with messages next to the fields, the customer view with orders and totals, and delete through `confirm()` with the refusal message.
4. All text goes in through `textContent` and `createElement`; no HTML strings.

**Verify:** `node --test`; `python3 -m http.server 8000`, open http://localhost:8000. Manual checks for `docs/MANUAL-CHECKS.md`:
- [ ] R-01: add a customer "Ana Pop" with no email and no phone; she appears in the list.
- [ ] R-02: save with name "   "; a message appears next to Name and nothing is added. Email "a@b"; refused with a message.
- [ ] R-03: edit Ana's email and save; the list shows the new email and her orders are still there.
- [ ] R-04: open a customer with two orders; you see their fields and both orders with totals as `€x.xx`.
- [ ] R-05: delete a customer with 2 orders; after confirming, the app says they have 2 orders to delete first, and the customer stays. Delete one without orders and cancel the dialog; nothing changes.
- [ ] R-06: type "  ANA " in search; only matching customers show. Clear it; all show.
- [ ] R-17: add a customer, reload the page; the customer is still there.
- [ ] R-18: in DevTools set `localStorage['invoice-app']` to `{bad`, reload; an error banner shows, forms are disabled, and the key still holds `{bad`.
- [ ] R-19: in DevTools fill storage until it is full (or override `Storage.prototype.setItem` to throw), then add a customer; an error shows and the customer is not in the list.
- [ ] R-20: with no data, the customer list says there are no customers and offers "Add customer"; a search with no match says no customers match.
- [ ] R-21: add a customer named `<img src=x onerror=alert(1)>`; the name shows literally and no alert appears.

**Risks:** R-19 is hard to trigger by hand; the setItem override is the reliable way. `confirm()` is the plainest confirmation dialog, with no custom modal (A-08).

## S7 Order and line screens (UI)
**Goal:** order list with filter, order form, and the order detail with its lines and live total. **Covers on screen:** R-07..R-16, R-20, R-21.
**Files:** `index.html`, `styles.css`, `src/ui/app.js`, `src/ui/orders-view.js`, `src/ui/lines-view.js`

**Tests first:** UI is checked by hand (below). The rules it calls are already tested in S1, S3 and S4.

**Steps:**
1. `orders-view.js` renders the order list with a customer select and a text filter, newest first. It has a "New order" action for a chosen customer with the date defaulting to today's local date, and a no-orders message.
2. The order detail shows number, customer (read-only), an editable date, delete through `confirm()`, and the total.
3. `lines-view.js` shows the lines table with line totals, the add/edit form with messages next to the fields, remove, and a no-lines message.
4. `app.js` wires the Orders tab and opening an order from the customer view.

**Verify:** `node --test`; manual checks for `docs/MANUAL-CHECKS.md`:
- [ ] R-07: create an order for Ana; it gets the next number, today's date and no lines.
- [ ] R-08: change the order date and save; the new date shows. The customer has no edit control.
- [ ] R-09: delete an order and confirm; it and its lines are gone. Create another; its number is not the deleted one.
- [ ] R-10: filter by customer, then type part of an order number or a customer name in any case; only matches show. Clear both; all orders show, newest date first.
- [ ] R-11: add a line "Design", 2, 12.5; it shows with unit price €12.50 and line total €25.00.
- [ ] R-12: try quantity 1.5, price 12.345 and an empty description; each is refused with a message next to its field.
- [ ] R-13: edit the line's quantity to 3; it updates in place and the total becomes €37.50.
- [ ] R-14: remove the line; the order total drops at once.
- [ ] R-15: a line of 3 × 0.10 shows €0.30 exactly.
- [ ] R-16: an order with lines €1,000.00 and €234.50 shows total €1,234.50; an order with no lines shows €0.00.
- [ ] R-20: with no orders the list says so and offers "New order"; an order with no lines says so and offers to add one.
- [ ] R-21: add a line described `<b>bold</b>`; it shows the tags literally.

**Risks:** `index.html`, `styles.css` and `app.js` are touched again here. That is planned, but a mistake in S7 can break the S6 screens, so re-run the S6 manual checks once at the end.

## Coverage check
Every MUST requirement is in a slice's Covers line: R-01 S2, S6 · R-02 S2, S6 · R-03 S2, S6 · R-04 S3, S6 · R-05 S2, S6 · R-06 S2, S6 · R-07 S3, S7 · R-08 S3, S7 · R-09 S3, S7 · R-10 S3, S7 · R-11 S4, S7 · R-12 S1, S4, S7 · R-13 S4, S7 · R-14 S4, S7 · R-15 S1, S7 · R-16 S1, S7 · R-17 S5, S6 · R-18 S5, S6 · R-19 S5, S6 · R-20 S6, S7 · R-21 S6, S7. LATER items R-22..R-25 are not planned.

## Decisions needed from the human

D1. When someone types a price with a comma, like "12,50", what should happen?
    Recommended: refuse it with the message "Use a dot for decimals, e.g. 12.50". Prices always mean the same thing, and the rule stays simple.
    Alternative: read the comma as a decimal point. Friendlier for European typing, but "1,000" would become 1.00 instead of one thousand, so the thousands comma has to be refused instead.
    Answer in: docs/decisions/ADR-003-price-input.md under "## Answered".

D2. How do people move around the app?
    Recommended: one page with two tabs, Customers and Orders. Opening a customer or an order shows its detail in the same page, with a "Back" link.
    Alternative: a web address per screen (#/customers/…) so the browser Back button and bookmarks work. About one more small file and half a slice more of work.
    Answer in: docs/decisions/ADR-004-navigation.md under "## Answered".
