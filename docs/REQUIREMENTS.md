# Requirements: customers, orders and order lines

Status: approved

- **Said:** a local JavaScript app to create, edit, view and delete customers; create orders for customers; add, edit and remove order lines; calculate order totals; search or filter customers and orders; basic validation and useful empty and error states; data kept in `localStorage`.
- **Implied:** one user on one browser, no login, no server; every order belongs to exactly one customer and every line to exactly one order; totals must be exact (money, not floats); data must survive a reload and must never be lost silently.
- **Open:** nothing; the three open questions were answered by the human and folded in below (R-04, A-03, A-05). Everything else is decided as an assumption.

## Customers

### R-01 [MUST] Create a customer
- Given the customer form, when the user saves a name (1 to 100 characters after trimming) and optionally an email, phone and address (each up to 200 characters), then the customer appears in the list.
- An email, when given, must contain one `@` with text on both sides and a dot in the part after it; otherwise the form shows an error and nothing is saved.

### R-02 [MUST] Edit a customer
- Given an existing customer, when the user changes the name, email, phone or address and saves, then the list and the customer's orders show the new values.
- The same rules as R-01 apply; an invalid edit is not saved and the old values stay.

### R-03 [MUST] View a customer
- The customer list shows name and email, sorted by name (case-insensitive).
- The customer detail shows all fields and the customer's orders with their totals.

### R-04 [MUST] Delete a customer
- If the customer has no orders, the user must confirm before the customer is deleted.
- If the customer has orders, the app asks for no confirmation and the customer is not deleted while those orders exist; the app says how many orders block it, that no legal retention applies, and that deleting those orders (R-08) and then the customer erases all of this customer's data. No data changes at this step.

### R-05 [MUST] Search customers
- Typing in the search box shows only customers whose name or email contains the text, case-insensitive, ignoring leading and trailing spaces.
- An empty search shows all customers.

### R-29 [MUST] Export one customer's data
- From the customer detail, the user can download a JSON file holding that customer's fields and all their orders with their lines.
- The file holds no data of any other customer.
- The file also states the purpose of the data (A-13) and how long it is kept (A-14), so the user can answer a person's access request with this one file.

## Orders

### R-06 [MUST] Create an order for a customer
- Wherever a customer is picked, the email is shown next to the name, so two customers with the same name can be told apart (A-12).
- An order can only be created for an existing customer; it gets the next number `ORD-0001`, `ORD-0002`, ... and the date of today, which the user can change.
- Order numbers are unique and never reused, also after an order is deleted. Only erasing all data (R-32) starts the numbering again at `ORD-0001`.
- The date is required and must be a real calendar date; past and future dates are allowed.
- The form also accepts optional notes, up to 500 characters after trimming; the same rules apply in R-07.

### R-07 [MUST] Edit an order
- The user can change the order date and notes; the customer and the number do not change after creation.

### R-08 [MUST] Delete an order
- After confirmation the order and all its lines are deleted; the customer stays.

### R-09 [MUST] List orders
- The order list shows number, customer name, date and total, newest date first, then highest number first.

### R-10 [MUST] Search orders
- Typing in the search box shows only orders whose number or customer name contains the text, case-insensitive, ignoring leading and trailing spaces.
- An empty search shows all orders.

### R-28 [MUST] View an order
- Creating an order opens it; the order list and the customer detail each open an order when the user selects it.
- The order view shows the number, customer name, date, notes, every line with description, quantity, unit price and line total in the order they were added (A-08), and the order total.
- From the order view the user can edit the order (R-07), add, edit and remove lines (R-11 to R-13) and delete the order (R-08).
- The user can reach the customer list and the order list from every screen.

## Order lines

### R-11 [MUST] Add an order line
- A line needs a description (1 to 200 characters after trimming), a quantity that is a whole number from 1 to 9 999, and a unit price from 0.00 to 1 000 000.00 with at most two decimals.
- An invalid line shows an error next to the field and is not added.
- The unit price accepts a dot or a comma as the decimal separator and no thousands separators; anything else shows an error next to the field.
- When a line is edited, the unit price field shows the saved price with two decimals.

### R-12 [MUST] Edit an order line
- The user can change a line's description, quantity and unit price with the rules of R-11; the order total updates at once.

### R-13 [MUST] Remove an order line
- Removing a line takes it out of the order and the order total updates at once.

## Totals

### R-14 [MUST] Line total
- A line total is quantity × unit price and is exact to the cent (for example 3 × 0.10 shows 0.30, and 3 × 19.99 shows 59.97).

### R-15 [MUST] Order total
- An order total is the sum of its line totals; an order with no lines totals 0.00.

### R-16 [MUST] Money display
- Every amount is shown with two decimals and the euro sign, with separators that follow the browser's language (for example 1,234.50 in English and 1.234,50 in Romanian).

## Validation and states

### R-17 [MUST] Validation messages
- Each invalid field shows a message next to it naming the rule it broke; the first invalid field gets the focus; nothing is saved until all fields are valid.
- Every form has a Cancel action that closes it and discards what was typed; the saved values stay as they were.
- An invalid edit of an order or a line is not saved and the old values stay, as in R-02.

### R-18 [MUST] Empty states
- No customers, no orders, an order with no lines and a search with no results each show a message that says what to do next (for example "No customers yet. Add the first one.").
- A customer with no orders shows a message offering to create the first order for that customer.
- With no customers yet, the order list says a customer must be added first and links to the customer form; an order cannot be started.
- A search on orders with no match says so and offers to clear it.

## Storage and safety

### R-19 [MUST] Data survives a reload
- Customers, orders and lines saved in the app are all there after the page is reloaded.
- The customer list shows a one-line note that the data lives only in this browser and is lost when the browser's site data is cleared (A-11).

### R-20 [MUST] Unreadable stored data is not overwritten
- If the saved data cannot be read, or was saved by a newer version of the app, the app shows an error instead of the lists; nothing can be added or changed, so nothing is written over the data.
- The error says what happened and offers two ways out: copy the stored text, or start with empty data (R-32).
- Starting with empty data needs a confirmation that says the old data will be lost; only then is the stored data replaced.

### R-21 [MUST] A failed save is visible
- If writing to `localStorage` fails (for example the quota is full), the app shows an error and the change is not shown as saved.
- The form stays open with what the user typed, so the save can be retried; the error says the browser's storage is full or unavailable and that deleting data frees space.

### R-22 [MUST] User text is shown as text
- Any text the user typed, in any field or search box, containing HTML such as `<b>x</b>` is displayed literally, never interpreted.

### R-31 [MUST] Personal data stays out of errors, URLs and titles
- Error messages, the page title and the URL never contain a customer's name, email, phone or address, or the text typed into a search; a page is addressed by `id` only.

### R-32 [MUST] Erase all data on this device
- After a confirmation that says all customers and orders will be gone for good, the user can remove the app's stored data, also when the stored data is unreadable (R-20).

## Out of scope now

### R-23 [LATER] Issue invoices (numbered, immutable, printable or PDF)
- Before this is built: the data model holds every Article 226 detail, the numbering is sequential and unique, an issued invoice is read-only and independent of later order edits, a correction is a new document, the retention period is named in a decision, erasure respects it, and the customer's acceptance of electronic invoices is recorded.

### R-24 [LATER] Tax or VAT per line
### R-25 [LATER] Import of the data, and export of the whole data set, as JSON
### R-26 [LATER] Order status (draft, confirmed, paid)
### R-27 [LATER] More than one currency
### R-30 [LATER] Filter orders by one customer

## Assumptions
- **A-01** One user, one browser, no accounts, on a device only that user can open. Only one tab is open at a time; two tabs are not supported. Data stays on the device; nothing is sent anywhere.
- **A-02** Customer fields: name (required), email, phone, address (all optional, free text up to 200 characters, empty by default).
- **A-03** One fixed currency for the whole app, EUR, no tax (confirmed by the human).
- **A-04** Money is stored as whole cents (integer); display formatting uses the browser's locale.
- **A-05** Quantity is a whole number, no decimals (confirmed by the human).
- **A-06** An order's customer cannot be changed; to move it, delete it and create a new one (confirmed by the human).
- **A-07** Order dates are calendar dates (`YYYY-MM-DD`), no time of day.
- **A-08** Lines are kept in the order they were added.
- **A-09** Deleting is permanent; there is no undo or trash.
- **A-10** "Invoice" in the project name refers to the order totals; issuing legal invoices is R-23, out of scope (confirmed by the human).
- **A-11** The data lives only in this browser on this device. Clearing the browser's site data removes it and there is no backup until R-25 exists. The customer list shows a one-line note saying so.
- **A-12** Two customers may have the same name or email; wherever a customer is picked, the email is shown next to the name.
- **A-13** Purpose of personal data: `name`, `email`, `phone` and `address` identify and contact the customer an order belongs to; `id` and `customerId` link orders to that customer; `notes` and line `description` record what the order is about and should not hold details about other people. The data is used for nothing else.
- **A-14** Retention: a customer and their orders are kept until the user deletes them; there is no fixed period. The app deletes nothing by itself; the user applies this rule with R-04 and R-08. No legal retention applies while the app issues no invoices (A-10).
- **A-15** The project ships a `LICENSE` file at the root; its licence is SPDX `MIT`. Any library, font, icon set or adapted design added later is named with its SPDX identifier in a decision first.

## Open questions
None. Q-01 became R-04, Q-02 became A-03, Q-03 became A-05.

## Data model sketch
One `localStorage` key, `invoice-app`, holding `{ version: 1, nextOrderNumber: number, customers: Customer[], orders: Order[] }`.

| Entity | Fields | Notes |
|---|---|---|
| Customer | `id` string, `name` string, `email` string, `phone` string, `address` string | `id` from `crypto.randomUUID()` |
| Order | `id` string, `number` string `ORD-0001`, `customerId` string, `date` `YYYY-MM-DD`, `notes` string, `lines` OrderLine[] | belongs to one Customer; number from `nextOrderNumber`, never reused |
| OrderLine | `id` string, `description` string, `quantity` integer, `unitPriceCents` integer | lives inside its Order; total is computed, never stored |

Totals are always computed from the lines (R-14, R-15), so stored data cannot disagree with them.

Personal data: Customer `id`, `name`, `email`, `phone`, `address`; Order `customerId`, `notes`; OrderLine `description` when it names a person. Purpose: A-13. Retention: A-14.
