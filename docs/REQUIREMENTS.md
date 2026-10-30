# Requirements: customers, orders and order lines

Status: draft

- **Said:** a local JavaScript app to create, edit, view and delete customers; create orders for customers; add, edit and remove order lines; calculate order totals; search or filter customers and orders; basic validation and useful empty and error states; data kept in `localStorage`.
- **Implied:** one user on one browser, no login, no server; every order belongs to exactly one customer and every line to exactly one order; totals must be exact (money, not floats); data must survive a reload and must never be lost silently.
- **Open:** nothing; the three open questions were answered by the human and folded in below (R-04, A-03, A-05). Everything else is decided as an assumption.

## Customers

### R-01 [MUST] Create a customer
- Given the customer form, when the user saves a name (1 to 100 characters after trimming) and an optional email, then the customer appears in the list.
- An email, when given, must contain one `@` with text on both sides and a dot in the part after it; otherwise the form shows an error and nothing is saved.

### R-02 [MUST] Edit a customer
- Given an existing customer, when the user changes the name, email, phone or address and saves, then the list and the customer's orders show the new values.
- The same rules as R-01 apply; an invalid edit is not saved and the old values stay.

### R-03 [MUST] View a customer
- The customer list shows name and email, sorted by name (case-insensitive).
- The customer detail shows all fields and the customer's orders with their totals.

### R-04 [MUST] Delete a customer
- The user must confirm before a customer is deleted.
- A customer who has orders cannot be deleted; the app says why and how many orders block it, and no data changes.

### R-05 [MUST] Search customers
- Typing in the search box shows only customers whose name or email contains the text, case-insensitive, ignoring leading and trailing spaces.
- An empty search shows all customers.

## Orders

### R-06 [MUST] Create an order for a customer
- An order can only be created for an existing customer; it gets the next number `ORD-0001`, `ORD-0002`, ... and the date of today, which the user can change.
- Order numbers are unique and never reused, also after an order is deleted.

### R-07 [MUST] Edit an order
- The user can change the order date and notes; the customer and the number do not change after creation.

### R-08 [MUST] Delete an order
- After confirmation the order and all its lines are deleted; the customer stays.

### R-09 [MUST] List orders
- The order list shows number, customer name, date and total, newest date first, then highest number first.

### R-10 [MUST] Search and filter orders
- The list can be filtered by one customer and searched by order number or customer name, case-insensitive; both apply together.

## Order lines

### R-11 [MUST] Add an order line
- A line needs a description (1 to 200 characters after trimming), a quantity that is a whole number from 1 to 9 999, and a unit price from 0.00 to 1 000 000.00 with at most two decimals.
- An invalid line shows an error next to the field and is not added.

### R-12 [MUST] Edit an order line
- The user can change a line's description, quantity and unit price with the rules of R-11; the order total updates at once.

### R-13 [MUST] Remove an order line
- Removing a line takes it out of the order and the order total updates at once.

## Totals

### R-14 [MUST] Line total
- A line total is quantity × unit price, computed in whole cents with no rounding error (for example 3 × 0.10 = 0.30 exactly).

### R-15 [MUST] Order total
- An order total is the sum of its line totals; an order with no lines totals 0.00.

### R-16 [MUST] Money display
- Every amount is shown with two decimals and the currency (A-03), formatted with `Intl.NumberFormat`.

## Validation and states

### R-17 [MUST] Validation messages
- Each invalid field shows a message next to it naming the rule it broke; the first invalid field gets the focus; nothing is saved until all fields are valid.

### R-18 [MUST] Empty states
- No customers, no orders, an order with no lines and a search with no results each show a message that says what to do next (for example "No customers yet. Add the first one.").

## Storage and safety

### R-19 [MUST] Data survives a reload
- Customers, orders and lines saved in the app are all there after the page is reloaded.
- All data is stored under one `localStorage` key as JSON with a schema version.

### R-20 [MUST] Unreadable stored data is not overwritten
- If the stored data cannot be parsed or has an unknown version, the app shows an error and does not write over it.

### R-21 [MUST] A failed save is visible
- If writing to `localStorage` fails (for example the quota is full), the app shows an error and the change is not shown as saved.

### R-22 [MUST] User text is shown as text
- Any name, email, description or note containing HTML such as `<b>x</b>` is displayed literally, never interpreted.

## Out of scope now

### R-23 [LATER] Issue invoices (numbered, immutable, printable or PDF)
### R-24 [LATER] Tax or VAT per line
### R-25 [LATER] Export and import of the data as JSON
### R-26 [LATER] Order status (draft, confirmed, paid)
### R-27 [LATER] More than one currency

## Assumptions
- **A-01** One user, one browser, no accounts. Data stays on the device; nothing is sent anywhere.
- **A-02** Customer fields: name (required), email, phone, address (all optional, free text up to 200 characters).
- **A-03** One fixed currency for the whole app, EUR, no tax (confirmed by the human).
- **A-04** Money is stored as whole cents (integer); display formatting uses the browser's locale.
- **A-05** Quantity is a whole number, no decimals (confirmed by the human).
- **A-06** An order's customer cannot be changed; to move it, delete it and create a new one (confirmed by the human).
- **A-07** Order dates are calendar dates (`YYYY-MM-DD`), no time of day.
- **A-08** Lines are kept in the order they were added.
- **A-09** Deleting is permanent; there is no undo or trash.
- **A-10** "Invoice" in the project name refers to the order totals; issuing legal invoices is R-23, out of scope (confirmed by the human).

## Open questions
None. Q-01 became R-04, Q-02 became A-03, Q-03 became A-05.

## Data model sketch
One `localStorage` key, `invoice-app`, holding `{ version: 1, nextOrderNumber: number, customers: Customer[], orders: Order[] }`.

| Entity | Fields | Notes |
|---|---|---|
| Customer | `id` string, `name` string, `email` string, `phone` string, `address` string, `createdAt` ISO string | `id` from `crypto.randomUUID()` |
| Order | `id` string, `number` string `ORD-0001`, `customerId` string, `date` `YYYY-MM-DD`, `notes` string, `lines` OrderLine[], `createdAt` ISO string | belongs to one Customer; number from `nextOrderNumber`, never reused |
| OrderLine | `id` string, `description` string, `quantity` integer, `unitPriceCents` integer | lives inside its Order; total is computed, never stored |

Totals are always computed from the lines (R-14, R-15), so stored data cannot disagree with them.
