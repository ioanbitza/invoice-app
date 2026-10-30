# Requirements: invoice app

Status: approved

- **Says:** a local JavaScript app for customers, orders and order lines, persisted in `localStorage`; CRUD on customers, orders per customer, add/edit/remove lines, order totals, search or filter, validation, empty and error states.
- **Implies:** an order belongs to exactly one customer and a line to exactly one order; totals are derived, never typed in; data survives a page reload; bad input and storage failures are shown, not hidden.
- **Leaves open:** which fields each entity has, what happens to orders when their customer is deleted, tax, quantity type, what search matches. Stack, money in EUR cents and the single storage key are already decided in ADR-001.

## Customers

### R-01 [MUST] Create a customer
- A customer with a non-empty name (after trimming) is saved and appears in the customer list.
- Email and phone are optional.

### R-02 [MUST] Validate customer fields
- An empty or whitespace-only name is refused with a message next to the field; nothing is saved.
- An email, when given, must contain one `@` with text on both sides and a dot in the part after it; otherwise it is refused with a message.
- Name is at most 100 characters, email at most 254, phone at most 30.

### R-03 [MUST] Edit a customer
- Changing a customer's fields and saving updates the customer in place; its ID and its orders stay the same.
- The same validation as R-02 applies.

### R-04 [MUST] View a customer
- The customer view shows the customer's fields and the list of their orders with each order's total.

### R-05 [MUST] Delete a customer
- Deleting asks for confirmation first.
- A customer that still has orders cannot be deleted; the app says how many orders they have and that those must be deleted first. Nothing is removed.

### R-06 [MUST] Search customers
- Typing in the customer search shows only customers whose name or email contains the text, case-insensitive, ignoring leading and trailing spaces.
- An empty search shows all customers.

## Orders

### R-07 [MUST] Create an order for a customer
- An order is created for one existing customer, with an order date (default today) and no lines.
- It gets the next order number (see A-04).

### R-08 [MUST] Edit an order
- The order date can be changed; the customer of an order cannot be changed.

### R-09 [MUST] Delete an order
- Deleting asks for confirmation and removes the order together with its lines.

### R-10 [MUST] Filter orders
- The order list can be filtered by customer and by text that matches the order number or the customer name, case-insensitive.
- An empty filter shows all orders, newest date first.

## Order lines

### R-11 [MUST] Add an order line
- A line has a description, a quantity and a unit price; it is saved on its order.

### R-12 [MUST] Validate order lines
- Description is non-empty after trimming, at most 200 characters.
- Quantity is a whole number from 1 to 9,999; decimals such as `1.5` are refused with a message.
- Unit price is entered in euros with at most two decimals, from 0.00 to 1,000,000.00, and stored as whole cents; `12.5` becomes 1250 cents, `12.345` is refused.

### R-13 [MUST] Edit an order line
- Changing a line's fields and saving updates it in place, with the same validation as R-12.

### R-14 [MUST] Remove an order line
- Removing a line takes it off the order and the order total updates at once.

## Totals

### R-15 [MUST] Line total
- Line total in cents = quantity × unit price in cents, exact integer arithmetic.

### R-16 [MUST] Order total
- Order total = sum of its line totals; an order with no lines totals 0.
- Amounts are shown as EUR with two decimals, e.g. `€1,234.50`.

## Storage and states

### R-17 [MUST] Persist across reloads
- Every change is written to `localStorage` at once; after a reload all customers, orders and lines are as they were.

### R-18 [MUST] Unreadable stored data is not overwritten
- If the stored data cannot be parsed or has the wrong shape, the app shows an error and does not write over it, so the user can recover it.

### R-19 [MUST] Failed save is visible
- If writing to `localStorage` fails (quota, private mode), the app shows an error and the change is not shown as saved.

### R-20 [MUST] Empty states
- No customers, no orders, no lines on an order, and no search results each show a short message saying so, with the next action where there is one.

### R-21 [MUST] User text is shown as text
- Names, emails, phones and descriptions containing HTML (e.g. `<img src=x onerror=alert(1)>`) are displayed literally and never executed.

## Later

### R-22 [LATER] Order status (draft, sent, paid)
### R-23 [LATER] Tax / VAT on lines
### R-24 [LATER] Export or print an invoice
### R-25 [LATER] Import and export of the whole data set as JSON

## Assumptions

- **A-01** One user, one browser; no accounts, no sync, no concurrent tabs handling.
- **A-02** Customer fields: name (required), email, phone. No address (confirmed).
- **A-03** All amounts are EUR, no tax in this build; tax stays R-23 LATER (answered Q-02).
- **A-04** Order numbers are sequential integers starting at 1, never reused after a delete; the next number is stored with the data.
- **A-05** Order date is a calendar date (`YYYY-MM-DD`), no time.
- **A-06** Line order is the order in which lines were added.
- **A-07** Customer list is sorted by name, case-insensitive.
- **A-08** Deleting needs a confirmation; there is no undo.
- **A-09** Data written by a future version is not migrated: the stored object carries `version: 1`, and any other version is treated as unreadable (R-18).

## Answered

- **Q-01** Delete a customer who has orders: refuse and say why; the user deletes the orders first. Now in R-05.
- **Q-02** Tax on lines: none in this build; R-23 stays LATER. Now in A-03.
- **Q-03** Quantities: whole numbers only. Now in R-12.

## Data model sketch

Stored under one key, `invoice-app`, written whole on every change (ADR-001):

```
{ version: 1, nextOrderNumber: integer, customers: Customer[], orders: Order[] }

Customer  { id: string (crypto.randomUUID()), name: string, email: string, phone: string }
Order     { id: string (uuid), number: integer, customerId: Customer.id,
            date: "YYYY-MM-DD", lines: OrderLine[] }
OrderLine { id: string (uuid), description: string, quantity: integer,
            unitPriceCents: integer }
```

- Customer 1 — n Order (by `customerId`); Order 1 — n OrderLine (embedded, deleted with the order).
- Totals are computed, never stored. Empty optional fields are stored as `""`.
