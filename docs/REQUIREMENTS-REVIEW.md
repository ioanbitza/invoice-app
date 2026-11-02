# Requirements review, run 1
Reviewed: 54e12a1 (docs/REQUIREMENTS.md, Status: draft)   Date: 2026-10-30
Roles: product-owner, legal (opus)   Domain skills: none   Legal skills: sdlc/skills/legal-data-protection/SKILL.md, sdlc/skills/legal-e-invoicing/SKILL.md, sdlc/skills/legal-licenses/SKILL.md

## Items (30: 3 blocking, 27 advisory)
- [x] PO-1  blocking  missing  none  No requirement gives the user a view of one order and its lines
      why: Brief: 'add, edit, and remove order lines' and 'order lines belonging to each order'.
      R-09 stops at a list ('shows number, customer name, date and total') and R-03 shows only 'the
      customer's orders with their totals'. R-11, R-12 and R-13 act on lines, but nothing says where
      the lines are shown, how an order is opened, or that a line total or the notes are ever
      displayed. R-14 computes a line total that no criterion shows. Walking the flow customer &gt;
      create order &gt; add lines &gt; see total, the step after R-06 has no requirement, so the
      tester has nothing to test it against. R-07 notes can be edited but never read.
      suggested: ### R-28 [MUST] View an order
      - Creating an order opens it; the order list and the customer detail each open an order when
      the user selects it.
      - The order view shows the number, customer name, date, notes, every line with description,
      quantity, unit price and line total in the order they were added (A-08), and the order total.
      - From the order view the user can edit the order (R-07), add, edit and remove lines (R-11 to
      R-13) and delete the order (R-08).
      - The user can reach the customer list and the order list from every screen.
- [x] PO-2  blocking  missing  R-20  Unreadable stored data leaves the user in a state with no way
      out
      why: R-20: 'the app shows an error and does not write over it'. No criterion says what the
      user can do next. Export is LATER (R-25), so the data cannot be taken out, and starting again
      would need the browser's developer tools. Every main flow stays closed for good, or, if the
      lists render empty, the first save writes over the data R-20 protects. Brief: 'useful empty or
      error states'. This is a dead end under checklist item 2.
      suggested: ### R-20 [MUST] Unreadable stored data is not overwritten
      - If the saved data cannot be read, or was saved by a newer version of the app, the app shows
      an error instead of the lists; nothing can be added or changed, so nothing is written over the
      data.
      - The error says what happened and offers two ways out: copy the stored text, or start with
      empty data.
      - Starting with empty data needs a confirmation that says the old data will be lost; only then
      is the stored data replaced.
- [x] LEG-1  blocking  priority  R-25  LD-08  Export of personal data is deferred to LATER, so the
      app cannot export a person's data
      why: R-25 reads '[LATER] Export and import of the data as JSON', and no MUST produces a file.
      R-03 only shows fields on screen. LD-08 requires 'An export for the person is structured,
      commonly used and machine-readable' and says 'a PDF, a screenshot or a printed table is not
      machine-readable, a JSON or CSV file is'. Article 20(1) is the source. R-25 also describes the
      whole data set, which would hand one person the data of every other customer, so moving it to
      MUST is not enough. The app as specified holds personal data it cannot export.
      suggested: ### R-28 [MUST] Export one customer's data
      - From the customer detail, the user can download a JSON file holding that customer's fields
      and all their orders with their lines.
      - The file holds no data of any other customer.
      
      ### R-25 [LATER] Import of the data, and export of the whole data set, as JSON
- [x] PO-3  advisory  missing  R-17  No way to leave a form without saving
      why: R-17: 'nothing is saved until all fields are valid'. No requirement offers Cancel, so a
      user who opened a form by mistake, or cannot satisfy a rule, has no stated way out. R-02 says
      of an invalid edit that 'the old values stay', but R-07 and R-12 say nothing of the kind.
      suggested: Add to R-17:
      - Every form has a Cancel action that closes it and discards what was typed; the saved values
      stay as they were.
      - An invalid edit of an order or a line is not saved and the old values stay, as in R-02.
- [x] PO-4  advisory  unclear  R-04  Delete customer: confirm first or refuse first, and no pointer
      to the way out
      why: R-04 has 'The user must confirm before a customer is deleted' and 'A customer who has
      orders cannot be deleted; the app says why and how many orders block it'. It reads two ways:
      confirm and then be refused, or be refused at once. The message also does not say how to
      proceed, though R-18 holds empty states to saying 'what to do next'. The rule itself was
      decided (Q-01) and is not reopened here.
      suggested: Replace the R-04 criteria with:
      - If the customer has no orders, the user must confirm before the customer is deleted.
      - If the customer has orders, the app asks for no confirmation; it says the customer cannot be
      deleted, how many orders block it, and that those orders must be deleted first. No data
      changes.
- [x] PO-5  advisory  risk  R-25  With export LATER, the only copy of the data is one browser
      profile
      why: Implied line: 'data must survive a reload and must never be lost silently'. A-01: 'Data
      stays on the device'. A-09: 'Deleting is permanent'. R-25 is LATER, so clearing site data or
      changing browser removes everything with no warning and no backup. It does not block first
      use, so LATER can stand, but the user should be told. What settles it: the human either keeps
      R-25 LATER with the assumption below or moves R-25 to MUST.
      suggested: - **A-11** The data lives only in this browser on this device. Clearing the
      browser's site data removes it and there is no backup until R-25 exists. The customer list
      shows a one-line note saying so.
- [x] PO-6  advisory  priority  R-10  R-10 asks for both filter and search where the brief says one
      or the other
      why: Brief: 'Keep the scope light' and 'search or filter customers and orders'. R-10 requires
      both: 'filtered by one customer and searched by order number or customer name'. Customer
      orders are already visible in the customer detail (R-03), so the filter is not needed for
      first use. What settles it: the human says whether both mechanisms are wanted in the first
      version.
      suggested: ### R-10 [MUST] Search orders
      - Typing in the search box shows only orders whose number or customer name contains the text,
      case-insensitive, ignoring leading and trailing spaces.
      - An empty search shows all orders.
      
      ### R-29 [LATER] Filter orders by one customer
- [x] PO-7  advisory  unclear  R-14  R-14 is worded around how the amount is computed
      why: R-14: 'computed in whole cents with no rounding error'. Whole cents is an implementation
      choice already in A-04. The user can only observe the amount, so the example is the real
      criterion.
      suggested: - A line total is quantity × unit price and is exact to the cent (for example 3 ×
      0.10 shows 0.30, and 3 × 19.99 shows 59.97).
- [x] PO-8  advisory  unclear  R-16  R-16 names an API instead of what the user sees
      why: R-16: 'formatted with `Intl.NumberFormat`'. A user cannot observe that, while they can
      observe the separators and the euro sign. A-04 already says the format follows the browser's
      locale.
      suggested: - Every amount is shown with two decimals and the euro sign, with separators that
      follow the browser's language (for example 1,234.50 in English and 1.234,50 in Romanian).
- [x] PO-9  advisory  unclear  R-19  Second criterion of R-19 is a storage design, not something a
      user sees
      why: R-19: 'All data is stored under one `localStorage` key as JSON with a schema version'. No
      user can observe this, and the data model sketch already states it. The first criterion alone
      is the user-visible requirement.
      suggested: Delete the second criterion of R-19; the one-key format stays in the Data model
      sketch.
- [x] PO-10  advisory  unclear  R-22  R-22 leaves phone, address and the search text out of its list
      why: R-22 names 'Any name, email, description or note'. A-02 makes phone and address 'free
      text' too, and search text may be echoed back in a no-results message (R-18). ADR-002 states
      the rule without exceptions: 'user text is never rendered as HTML'. A tester working from the
      list would miss two fields.
      suggested: - Any text the user typed, in any field or search box, containing HTML such as
      `&lt;b&gt;x&lt;/b&gt;` is displayed literally, never interpreted.
- [x] PO-11  advisory  missing  R-18  Empty states miss the customer with no orders and order
      creation with no customers
      why: R-18 lists 'No customers, no orders, an order with no lines and a search with no
      results'. Three states fall outside it. A customer detail with no orders (R-03) is one.
      Creating an order when no customer exists is another: R-06 says only 'An order can only be
      created for an existing customer', and on an empty order list the next step is to add a
      customer, not an order. The third is a customer filter with no match (R-10), which is not a
      search. Brief: 'useful empty or error states'.
      suggested: Add to R-18:
      - A customer with no orders shows a message offering to create the first order for that
      customer.
      - With no customers yet, the order list says a customer must be added first and links to the
      customer form; an order cannot be started.
      - A filter or search on orders with no match says so and offers to clear it.
- [x] PO-12  advisory  missing  R-06  No rule for the order date or the notes
      why: R-06: 'the date of today, which the user can change'. R-07 lets the user change date and
      notes. R-17 needs a message 'naming the rule it broke', but neither field has a rule: a
      cleared date, an impossible date or very long notes are all undefined, and R-09 sorts by that
      date. R-06 also does not say whether notes can be entered at creation, though the data model
      has them. Brief: 'basic validation'.
      suggested: Add to R-06:
      - The date is required and must be a real calendar date; past and future dates are allowed.
      - The form also accepts optional notes, up to 500 characters after trimming; the same rules
      apply in R-07.
- [x] PO-13  advisory  unclear  R-11  What the user may type as a price is not defined
      why: R-11: 'a unit price from 0.00 to 1 000 000.00 with at most two decimals'. A-04: 'display
      formatting uses the browser's locale'. A user on a comma locale sees 12,50 € and may type
      12,50, or type 1,000.50 in English. The requirement reads two ways: rejected, or accepted as a
      different amount. A wrongly read amount would change totals with no warning. R-12 also does
      not say how the current price appears in the edit field.
      suggested: Add to R-11:
      - The unit price accepts a dot or a comma as the decimal separator and no thousands
      separators; anything else shows an error next to the field.
      - When a line is edited, the unit price field shows the saved price with two decimals.
- [ ] PO-14  advisory  risk  R-13  Removing a line has no confirmation while deleting anything else
      does
      why: R-04 and R-08 require confirmation. R-13 says only 'Removing a line takes it out of the
      order', and A-09 says 'Deleting is permanent; there is no undo or trash'. One misclick loses a
      line for good. It may be a deliberate choice for speed, but nothing says so. What settles it:
      the human chooses to confirm, or records that no confirmation is intended.
      suggested: ### R-13 [MUST] Remove an order line
      - After confirmation the line is taken out of the order and the order total updates at once.
- [x] PO-15  advisory  unclear  R-21  After a failed save, what happens to what the user typed is
      not stated
      why: R-21: 'the app shows an error and the change is not shown as saved'. This can be met by
      closing the form and dropping the input, while AGENTS.md rule 6 says 'never lose user data
      silently'. With a full quota the user also has no stated next step.
      suggested: Add to R-21:
      - The form stays open with what the user typed, so the save can be retried; the error says the
      browser's storage is full or unavailable and that deleting data frees space.
- [x] PO-16  advisory  risk  none  Two tabs of the app may lose changes or repeat an order number
      why: A-01 says 'One user, one browser' but says nothing about two tabs, which one user can
      easily open. If each tab holds its own copy, the later save overwrites the earlier one.
      Implied line: 'must never be lost silently'. R-06: 'Order numbers are unique and never
      reused'. What settles it: the human says whether two tabs are in scope; the outcome also
      depends on the design, which does not exist yet.
      suggested: Add to R-19:
      - With the app open in two tabs, a change saved in one tab is not lost when the other tab
      saves, and order numbers stay unique.
      Or, if out of scope, extend A-01: Only one tab is open at a time; two tabs are not supported.
- [x] PO-17  advisory  risk  none  Nothing says whether two customers can have the same name
      why: R-01 sets only a length for the name. Two customers called the same would look identical
      in the R-10 customer filter and could be confused when creating an order (R-06), which A-06
      makes costly because 'An order's customer cannot be changed'. What settles it: the human says
      whether duplicates are allowed.
      suggested: - **A-12** Two customers may have the same name or email; wherever a customer is
      picked, the email is shown next to the name.
- [x] PO-18  advisory  unclear  R-01  R-01 omits phone and address, and the 200-character limit is
      in no criterion
      why: R-01: 'saves a name (1 to 100 characters after trimming) and an optional email'. A-02
      lists 'email, phone, address (all optional, free text up to 200 characters)', and R-02 edits
      phone and address 'The same rules as R-01'. R-01 has no rule for them, so the create form may
      lack two fields the edit form has, and a 300-character address has no defined result.
      suggested: Replace the first criterion of R-01 with:
      - Given the customer form, when the user saves a name (1 to 100 characters after trimming) and
      optionally an email, phone and address (each up to 200 characters), then the customer appears
      in the list.
- [ ] PO-19  advisory  unclear  R-10  R-10 lacks the search details R-05 spells out
      why: R-05 says 'ignoring leading and trailing spaces' and 'An empty search shows all
      customers'. R-10 says only 'case-insensitive; both apply together'. The two searches may
      behave differently, and neither an empty search nor clearing the filter is defined. If PO-6 is
      accepted, its text covers this and only the search part applies.
      suggested: Add to R-10:
      - Search ignores leading and trailing spaces; an empty search and no chosen customer show all
      orders.
- [x] LEG-2  advisory  missing  R-03  LD-06  Access needs more than the data: purpose and retention
      are not part of what the person gets
      why: R-03 reads 'The customer detail shows all fields and the customer's orders with their
      totals', which is a screen, not a copy. LD-06 says the right of access needs a path in the
      app: 'which data is held, for what purpose, how long', with 'the copy ... provided in a
      commonly used electronic form, within one month of the request'. The file itself is LEG-1.
      This item adds the purpose and the retention to it.
      suggested: Add to R-28:
      - The file also states the purpose of the data (A-11) and how long it is kept (A-12), so the
      user can answer a person's access request with this one file.
- [x] LEG-3  advisory  wrong  R-04  LD-07  The refusal to delete a customer rests on no listed
      exception and does not say how to erase
      why: R-04 reads 'A customer who has orders cannot be deleted; the app says why and how many
      orders block it, and no data changes.' LD-07 reads 'a refusal rests on a listed exception and
      the app says which'. Having orders is neither of the exceptions the rule names: 17(3)(b) legal
      obligation or 17(3)(e) legal claim. A-10 rules out issued invoices, so no stored invoice
      blocks erasure either. It is advisory because a route exists: R-08 deletes the orders, then
      R-04 deletes the customer. Nothing in the app tells the user that route. The human chose this
      rule for R-04, so the suggestion keeps it and only adds the way out.
      suggested: Replace the second criterion of R-04:
      - A customer who has orders is not deleted while those orders exist; the app says how many
      orders block it, that no legal retention applies, and that deleting those orders (R-08) and
      then the customer erases all of this customer's data. No data changes at this step.
- [x] LEG-4  advisory  missing  none  LD-02  No personal data field has a stated purpose
      why: The data model lists Customer 'name string, email string, phone string, address string'
      and Order 'notes string', and A-02 defines them. No requirement or assumption says what each
      is for. LD-02 reads 'Every personal data field has a stated purpose and is used only for it'
      and 'a field with no purpose has no legal ground to exist'. Under LD-01 these fields are
      personal data, as is 'a customer number joined to a name', which covers Customer.id and
      Order.customerId. Order.notes and OrderLine.description are free text and can also hold
      personal data.
      suggested: - **A-11** Purpose of personal data: `name`, `email`, `phone` and `address`
      identify and contact the customer an order belongs to; `id` and `customerId` link orders to
      that customer; `notes` and line `description` record what the order is about and should not
      hold details about other people. The data is used for nothing else.
- [x] LEG-5  advisory  wrong  none  LD-03  Fields that no requirement needs: createdAt, and phone
      and address as far as the flows go
      why: The data model has 'createdAt ISO string' on Customer and on Order. No requirement reads
      either: R-03 does not show it and R-09 sorts by 'newest date first, then highest number
      first'. On Customer it is a fact about an identifiable person. Phone and address appear only
      as edit and display fields (R-02, R-03), and R-01 names only 'a name ... and an optional
      email'. No flow uses them. LD-03 reads 'The app stores only the personal data its purpose
      needs, by default' and warns against 'a field "because it may be useful later"'.
      suggested: In the data model sketch, remove `createdAt` from Customer and Order unless a
      requirement uses it.
      Change A-02: **A-02** Customer fields: name (required), email, phone, address (all optional,
      free text up to 200 characters, empty by default). Keep phone and address only if the human
      confirms the purpose in A-11; otherwise remove them.
- [x] LEG-6  advisory  missing  none  LD-05  No retention rule for Customer or Order
      why: A-09 reads 'Deleting is permanent; there is no undo or trash', and that is the only thing
      said about how data ends. The Customer and Order entities have no end date. LD-05 reads 'every
      entity with personal data has a retention rule' and 'a customer record with no end date is
      kept forever by default'. No domain skill exists in the project to carry it, and the period is
      a human decision.
      suggested: - **A-12** Retention: a customer and their orders are kept until the user deletes
      them, and no later than NEEDS HUMAN: the period after the customer's last order. The app
      deletes nothing by itself; the user applies this rule with R-04 and R-08. No legal retention
      applies while the app issues no invoices (A-10).
- [x] LEG-7  advisory  missing  none  LD-10  The data model does not name its personal data
      categories, purposes and retention
      why: The 'Data model sketch' lists fields only. LD-10 reads 'The categories of personal data,
      their purposes and their retention are written down' and 'the requirements and the data model
      are that somewhere, and a reviewer can check them'. Purposes and retention are LEG-4 and
      LEG-6. This item puts the record where a reviewer looks for it.
      suggested: Add under the data model sketch:
      Personal data: Customer `id`, `name`, `email`, `phone`, `address`; Order `customerId`,
      `notes`; OrderLine `description` when it names a person. Purpose: A-11. Retention: A-12.
- [x] LEG-8  advisory  missing  none  LD-09  No requirement keeps personal data out of error text,
      URLs and the page title
      why: LD-09 reads 'Personal data does not leak into logs, error messages, URLs or the storage
      of a shared machine'. AGENTS.md rule 6 bans `console.log` under `src/`, which covers logs.
      Nothing covers the rest. R-10 adds a search by customer name and R-03 a customer detail, and
      neither says what the address or the title carries. R-17, R-20 and R-21 add error text. No
      requirement line breaks the rule today. What settles it is this criterion, or the URL scheme
      in docs/UI-SPEC.md, which does not exist yet.
      suggested: ### R-29 [MUST] Personal data stays out of errors, URLs and titles
      - Error messages, the page title and the URL never contain a customer's name, email, phone or
      address, or the text typed into a search; a page is addressed by `id` only.
- [x] LEG-9  advisory  unclear  R-19  LD-09  Personal data sits in plain localStorage, and the
      requirements do not say the machine is private
      why: R-19 reads 'All data is stored under one localStorage key as JSON', and the brief
      mandates localStorage, so the storage itself is a given. LD-09 names 'data left in
      localStorage on a shared computer' as a disclosure. A-01 reads 'One user, one browser, no
      accounts', which says one user but not that the machine is theirs. There is no lock and no way
      to clear everything. R-20 keeps unreadable data and refuses to write over it, so in that state
      the app offers no way to erase it. ADR-002 sends delivery to GitHub Pages, where a project
      site shares its origin, and so its localStorage, with the owner's other sites under the same
      github.io name. To settle it: the human states whether the app may run on a shared machine,
      and the devops decision names the origin.
      suggested: Change A-01: **A-01** One user, one browser, no accounts, on a device only that
      user can open. Data stays on the device; nothing is sent anywhere.
      
      ### R-30 [MUST] Erase all data on this device
      - After a confirmation that says all customers and orders will be gone for good, the user can
      remove the app's stored data, also when the stored data is unreadable (R-20).
- [x] LEG-10  advisory  missing  none  LL-11  The project has no LICENSE file and no decision on its
      licence
      why: The repository root holds no LICENSE file, and AGENTS.md does not list one in its
      structure. LL-11 reads 'The project has a LICENSE file' and 'without a LICENSE file the
      project itself is all rights reserved (LL-02), so nobody, not even a colleague, may legally
      use it'. AGENTS.md cites docs/decisions/ADR-001-stack.md, but that file does not exist yet, so
      the skill's question whether ADR-001 says what the licence is has no answer. No third-party
      library, font or icon set is named: AGENTS.md says 'no dependencies'. So LL-01 to LL-10 have
      nothing to bite on until docs/UI-SPEC.md exists.
      suggested: - **A-13** The project ships a `LICENSE` file at the root, and its licence is named
      by SPDX identifier in ADR-001 (NEEDS HUMAN: the licence). Any library, font, icon set or
      adapted design added later is named with its SPDX identifier in a decision first.
- [x] LEG-11  advisory  risk  R-23  LE-01  The LATER invoice line carries obligations the current
      model and flows would not meet
      why: A-10 puts legal invoices out of scope, so LE-01 to LE-08 break nothing today. R-23 is a
      heading with no criteria, though, and the choices made now would collide with it later. The
      data model has no supplier, VAT number, tax or supply date, while LE-01 says 'A data model
      that cannot hold one of them cannot issue a lawful invoice'. R-07, R-12 and R-08 edit and
      delete orders, while the LE-03 review asks whether lines can be 'changed through the order'.
      R-04 and A-09 delete freely, while LE-07 reads 'Retention beats erasure'. To settle it: the
      human confirms that the app's output is never used as an invoice, or adds these criteria when
      R-23 is taken up.
      suggested: ### R-23 [LATER] Issue invoices (numbered, immutable, printable or PDF)
      - Before this is built: the data model holds every Article 226 detail, the numbering is
      sequential and unique, an issued invoice is read-only and independent of later order edits, a
      correction is a new document, the retention period is named in a decision, erasure respects
      it, and the customer's acceptance of electronic invoices is recorded.

## Checklists
product-owner: items 1-6 ran; fired: 2, 3, 4, 5, 6; not run: none
legal: not reported

## Next
Tick the items you accept (- [x]), then tell the session: "Fold the ticked items of
      docs/REQUIREMENTS-REVIEW.md into docs/REQUIREMENTS.md". An untouched item is rejected.
The session folds them in (an item becomes a requirement, a criterion or a changed line, in the
      file's own format). Then set Status: approved on the third line of docs/REQUIREMENTS.md,
      commit it, and run /sdlc:plan-slices.
