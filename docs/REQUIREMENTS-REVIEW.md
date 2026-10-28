# Requirements review, run 1
Reviewed: 2f04277 (docs/REQUIREMENTS.md, Status: approved)   Date: 2026-10-28
Roles: product-owner, domain-expert (opus)   Domain skills: .claude/skills/domain-invoicing/SKILL.md

## Items (24: 2 blocking, 22 advisory)
- [ ] PO-1  blocking  missing  none  No requirement for the order screen where lines are shown and
      edited
      why: The brief promises "add, edit, and remove order lines" and "calculate order totals". R-11
      only says a line "is saved on its order". R-15 and R-16 define how totals are calculated, but
      only R-14 says a total is visible. R-04 is the only view requirement, and it covers customers.
      No requirement says the user can open an order and see its number, customer, date, its lines
      with their line totals, and the order total. That screen is where the add, edit and remove
      line flows start, so a build that follows the requirements can leave it out.
      suggested: ### R-26 [MUST] View an order
      - Opening an order from the order list or from the customer view shows its number, its
      customer's name, its date, and its lines in the order they were added (A-06).
      - Each line shows description, quantity, unit price and line total. The order total is shown
      below the lines.
      - From this screen the user can add a line (R-11), edit a line (R-13), remove a line (R-14),
      change the date (R-08) and delete the order (R-09).
      - A "Back" link returns to the list the user came from (ADR-004).
- [ ] DOM-1  blocking  missing  none  D-12  The data model records no currency
      why: The data model sketch stores `{ version: 1, nextOrderNumber: integer, customers:
      Customer[], orders: Order[] }` with no currency field, and A-03 only says "All amounts are
      EUR". D-12 says: "A single-currency app still records the currency (ISO 4217 code) on the
      document or at the data root, so that a second currency later cannot be mistaken for the
      first." Right now the currency exists only as an assumption and in the display format of R-16.
      suggested: Data model sketch: `{ version: 1, currency: "EUR", nextOrderNumber: integer,
      customers: Customer[], orders: Order[] }`
      
      ### R-17 [MUST] Persist across reloads
      - Every change is written to `localStorage` at once; after a reload all customers, orders and
      lines are as they were.
      - The stored data names its currency as an ISO 4217 code at the root (`currency: "EUR"`);
      stored data with no currency or another currency is treated as unreadable (R-18).
- [ ] PO-2  advisory  unclear  R-10  Order list content and how an order is opened are not stated
      why: R-10 says "The order list can be filtered by customer and by text" and is sorted "newest
      date first", but never says what each row shows. R-04 lists "each order's total" in the
      customer view but not the order number or date. It also does not say whether a row opens the
      order. A user who cannot tell orders apart in a list cannot pick the one to work on.
      suggested: - Each row in the order list shows the order number, date, customer name and order
      total. Clicking a row opens the order (R-26).
      - In the customer view (R-04), each order shows its number, date and total, and clicking it
      opens the order.
- [ ] PO-3  advisory  unclear  R-11  Total updating after adding or editing a line is only required
      for removal
      why: R-14 says "the order total updates at once", but R-11 (add) and R-13 (edit) say nothing
      about the total the user sees. A screen that refreshes the total only on removal would meet
      the text.
      suggested: R-11 and R-13, add: - After saving, the line total and the order total shown on the
      order update at once, without a reload.
- [ ] PO-4  advisory  risk  R-18  Unreadable stored data leaves the user stuck with no way out
      why: R-18 says the app "shows an error and does not write over it, so the user can recover
      it". Export is R-25 [LATER], so there is no way to recover the data from inside the app, and
      nothing lets the user start again. The user is stuck on the error until they clear
      localStorage by hand in the browser tools.
      suggested: - The error shows the stored text in a read-only box the user can select and copy.
      - A "Start with empty data" button asks for confirmation, warns that the stored data will be
      replaced, and only then writes an empty data set.
- [ ] PO-5  advisory  unclear  R-19  What the user sees after a failed save is not observable
      why: "the change is not shown as saved" can mean either of two things: the form closes and the
      list stays unchanged, or the form stays open. If the form closes, the user loses what they
      typed. AGENTS.md rule 6 says "never lose user data silently".
      suggested: - If saving fails, an error says the change was not saved. The form stays open with
      the values the user entered, and the lists still show the data as it was before.
- [ ] PO-6  advisory  unclear  R-05  Confirmation is asked before the app checks for orders
      why: R-05 says "Deleting asks for confirmation first" and then "A customer that still has
      orders cannot be deleted". As written, the user confirms a delete and is then told it cannot
      happen.
      suggested: - If the customer has orders, the app says right away how many orders they have and
      that those must be deleted first. No confirmation is asked and nothing is removed.
      - If the customer has no orders, the app asks for confirmation and deletes only after the user
      confirms.
- [ ] PO-7  advisory  missing  R-08  No validation for the order date
      why: R-07 gives a default date and R-08 says "The order date can be changed". No criterion
      covers a cleared or invalid date, even though the brief asks for "basic validation". An order
      without a date cannot be sorted in R-10's "newest date first" list.
      suggested: - An empty or invalid date is refused with a message next to the field; nothing is
      saved.
- [ ] PO-8  advisory  risk  R-07  "Default today" may show yesterday's date
      why: R-07 says "order date (default today)" and A-05 says it is a calendar date. If today is
      taken from UTC, a user east of Greenwich who creates an order shortly after midnight sees
      yesterday's date. Settled by stating which clock is used.
      suggested: - The default date is today's date in the user's local time zone.
- [ ] PO-9  advisory  unclear  R-10  Order number matching and the sort of filtered results can be
      read two ways
      why: R-10 says the text "matches the order number". It could be an exact match, or contains,
      so that "1" also finds 10 and 11. "newest date first" is stated only for "An empty filter",
      and orders that share a date have no defined order.
      suggested: - The text matches when the order number written as digits contains it, or the
      customer name contains it, case-insensitive, ignoring leading and trailing spaces.
      - Filtered and unfiltered lists are sorted by date, newest first, then by order number,
      highest first.
- [ ] PO-10  advisory  risk  R-07  Customers with the same name cannot be told apart when picking
      one
      why: R-01 only needs a non-empty name, so two customers can share a name. R-07 (pick the
      customer for an order) and R-10 ("filtered by customer") give the user a choice by customer,
      but nothing says how to tell two customers with the same name apart.
      suggested: - Wherever a customer is picked from a list, the name is shown together with the
      email or phone when they are set.
- [ ] PO-11  advisory  missing  none  No way to cancel a create or edit form, and nothing said about
      unsaved input
      why: The brief asks for "create, edit" of customers and lines. ADR-004 gives a "Back" link on
      detail screens. No requirement says a form can be cancelled, or what happens to typed input
      when the user switches tab or presses Back. Settled by the human choosing between discarding
      the input or asking first.
      suggested: - Every create or edit form has a Cancel button that closes it without saving and
      leaves the data unchanged.
      - Leaving a form with changed fields (tab, Back) asks for confirmation before the changes are
      discarded.
- [ ] PO-12  advisory  unclear  R-12  The comma rule from ADR-003 is missing from the price
      criterion
      why: R-12 says the unit price is "entered in euros with at most two decimals". ADR-003 decided
      that "A comma anywhere in the price is refused with the message 'Use a dot for decimals, e.g.
      12.50'". The message the user sees is not part of the acceptance criteria, so it is not
      checked against R-12.
      suggested: - A price containing a comma is refused with the message "Use a dot for decimals,
      e.g. 12.50"; nothing is saved (ADR-003).
- [ ] PO-13  advisory  unclear  R-17  Persistence criterion uses implementation words
      why: "Every change is written to localStorage at once" describes the code, not something the
      user sees. The observable part is the second half, "after a reload all customers, orders and
      lines are as they were".
      suggested: - After any change is saved and the page is reloaded or the browser reopened, all
      customers, orders and lines are as they were.
- [ ] DOM-2  advisory  missing  R-12  D-15  Nothing says the unit price excludes VAT
      why: R-12 says "Unit price is entered in euros with at most two decimals ... and stored as
      whole cents" but does not say whether VAT is in it. D-15 says "lines keep unit price exclusive
      of VAT (a rate and a VAT amount can be added per line)", and the Terms table defines Unit
      price as "Price of one unit, exclusive of VAT". If users type gross prices now, R-23 cannot
      add VAT later without guessing what each stored price means.
      suggested: ### R-12 [MUST] Validate order lines
      - Unit price is the price of one unit excluding VAT, entered in euros with at most two
      decimals, from 0.00 to 1,000,000.00, and stored as whole cents; `12.5` becomes 1250 cents,
      `12.345` is refused. The line form labels the field "Unit price (excl. VAT)".
- [ ] DOM-3  advisory  unclear  R-24  D-06  R-24 'Export or print an invoice' when the app has no
      invoices
      why: R-24 reads "Export or print an invoice", but the app has no invoice entity, only orders.
      D-06 says "An order is not an invoice" and "The app must never present an order as an
      invoice." As written, R-24 can be read as printing an order with the title invoice. No current
      requirement says the UI never calls an order an invoice. Not proven: what R-24 should produce
      is not stated. It is settled once the owner says whether R-24 means issuing a real invoice
      from an order or printing the order.
      suggested: ### R-24 [LATER] Issue an invoice from an order
      - An invoice is a separate document created from an order and refers to it; printing or
      exporting an order prints an order, titled "Order", never "Invoice".
      
      ### R-20a [MUST] Orders are not invoices
      - No screen, label or export calls an order an invoice.
- [ ] DOM-4  advisory  risk  R-24  D-09  The data model cannot hold the content Article 226 requires
      on an invoice
      why: D-09 says: "Anything the app calls an invoice must be able to show all of these": issue
      date, sequential number, supplier VAT number, customer VAT number where relevant, full name
      and address of supplier and customer, VAT rate and amount. The data model has `Customer { id,
      name, email, phone }`, A-02 says "No address (confirmed)", and there is no supplier record at
      all. R-24 has no place in the data model for these fields.
      suggested: ### R-24 [LATER] Issue an invoice from an order
      - Needs, before it can be built: a supplier record (legal name, address, VAT number), customer
      address and VAT number (added fields, existing ones kept), an issue date, a supply date when
      it differs, an invoice number from a series, and the VAT rate and amount per rate (R-23).
- [ ] DOM-5  advisory  missing  R-24  D-07  Nothing says an issued invoice is immutable
      why: D-07 says: "An issued invoice is immutable. Corrections are credit notes or new documents
      that refer to it." R-24 carries no such constraint, and the order flows it would build on are
      freely editable and deletable (R-08 "The order date can be changed", R-09 "removes the order
      together with its lines", R-13, R-14).
      suggested: ### R-24 [LATER] Issue an invoice from an order
      - An issued invoice cannot be edited or deleted; a correction is a credit note that refers to
      it.
      - An order that has an invoice can no longer be edited or deleted.
- [ ] DOM-6  advisory  missing  R-24  D-08  Invoice numbering is not stated and must not reuse the
      order counter
      why: D-08 says invoice numbers are "sequential, drawn from one or more series, and unique",
      that "The number is assigned at issue, not at draft", and that "Order numbers in this app
      (A-04) are a separate counter and are not invoice numbers." The data model has one counter
      only, `nextOrderNumber`. R-24 does not say where an invoice number comes from.
      suggested: ### R-24 [LATER] Issue an invoice from an order
      - An invoice gets its number at issue, from its own sequential series stored apart from
      `nextOrderNumber`; numbers are unique and never reused.
- [ ] DOM-7  advisory  unclear  R-22  D-06  'paid' is used as an order status
      why: R-22 reads "Order status (draft, sent, paid)". The domain skill says "A payment settles
      an invoice in full or in part", and D-06 says "No tax obligation and no claim exist until an
      invoice is issued." An order creates no claim, so it cannot be paid. 'paid' belongs to an
      invoice.
      suggested: ### R-22 [LATER] Order status (draft, confirmed, fulfilled); payment status
      (unpaid, partly paid, paid) belongs to the invoice (R-24)
- [ ] DOM-8  advisory  unclear  R-07  D-13  The order date is stored under the generic name `date`
      why: The data model stores `Order { ..., date: "YYYY-MM-DD", ... }`. D-13 says "The order date
      in this app is none of these; it must not be reused as an issue date." D-10 says fields should
      be added later "without migrating or renaming the existing ones". A field called `date`
      invites reuse as the issue date or supply date once invoices exist. Not proven: the rule does
      not name the field. It is settled by the owner choosing the field name before the model is
      final.
      suggested: Data model sketch: `Order { id: string (uuid), number: integer, customerId:
      Customer.id, orderDate: "YYYY-MM-DD", lines: OrderLine[] }`
- [ ] DOM-9  advisory  missing  R-06  D-14  No criterion says search, filter and sort never write
      why: R-06 trims the search text ("ignoring leading and trailing spaces") and R-10 sorts
      ("newest date first"), but no criterion says they leave stored data unchanged. D-14 says:
      "Search, filter and sort never change data" and "A filter that writes (for example re-sorting
      and saving lines, or trimming a name while matching) corrupts the stored state silently."
      suggested: ### R-06 [MUST] Search customers
      - Searching, filtering (R-10) and sorting (A-07) never change or save stored data; after
      clearing the search, the stored customers and orders are unchanged.
- [ ] DOM-10  advisory  missing  R-01  D-10  The customer name is not stated to be the legal name
      why: R-01 says only "A customer with a non-empty name (after trimming) is saved". D-10 says
      "the name must be the legal name, not a nickname", because Article 226(5) requires the
      customer's full name on an invoice.
      suggested: ### R-01 [MUST] Create a customer
      - A customer with a non-empty name (after trimming) is saved and appears in the customer list;
      the field is labelled "Legal name" and holds the customer's full legal name.
- [ ] DOM-11  advisory  missing  R-05  D-11  Deleting a customer is not ready for documents that
      must be kept
      why: R-05 says the app tells the user that the orders "must be deleted first", and then the
      customer can be removed. D-11 says "the same rule, without exception, must hold for invoices.
      A customer may be deactivated, never removed." No requirement covers deactivating a customer,
      and once R-24 exists, the 'delete the orders first' path would orphan invoices that must be
      kept.
      suggested: ### R-05 [MUST] Delete a customer
      - A customer that still has orders cannot be deleted; the app says how many orders they have
      and that those must be deleted first. Nothing is removed.
      - Once invoices exist (R-24), a customer with any invoice can never be deleted, only
      deactivated.

## Checklists
product-owner: not reported
domain-expert: items 1-4 ran; fired: 1, 2, 3, 4; not run: none

## Next
Tick the items you accept (- [x]), then tell the session: "Fold the ticked items of
      docs/REQUIREMENTS-REVIEW.md into docs/REQUIREMENTS.md". An untouched item is rejected.
docs/REQUIREMENTS.md is approved, so the fold-in is your own edit: the file is human-only for
      agents, the session may only show you the text to paste. Then /sdlc-kit:plan-slices.
