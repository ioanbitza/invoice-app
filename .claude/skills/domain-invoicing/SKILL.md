---
name: domain-invoicing
description: "How invoicing and bookkeeping work, as rules with IDs, for the requirements and code reviews of this app. Read by the domain-expert and finder-domain roles."
---

# Domain: invoicing

## What this domain is
A business sells goods or services to customers. A customer is a legal or natural person with a name, an address and, when VAT-registered, a VAT identification number.
An order (quote, sales order) records what the customer wants and at what price. It is a commercial agreement, not a tax document. It can be edited until it is fulfilled.
An invoice is the document the supplier issues for a supply. In the EU it is governed by Directive 2006/112/EC (the VAT Directive), Title XI, Chapter 3, Articles 217 to 240. It creates a claim on the customer and it is the evidence for the VAT that became chargeable when the goods or services were supplied (Articles 62 and 63).
Both documents are made of lines: a description, a quantity, a unit price, a line total. Totals are derived from the lines. Tax is computed per rate on the taxable amount of the lines.
A payment settles an invoice in full or in part. An invoice that is wrong is not edited: it is corrected by a credit note or another document that refers to it.
This app today has customers, orders and lines, in EUR cents, in the browser. It has no invoices, no tax and no invoice numbering yet. The rules below say what must already be true so that those can be added without rewriting the data.

## Terms
| Term | Meaning | What this app calls it |
|---|---|---|
| Customer | The party that receives the supply and owes the money | `Customer` (name, email, phone) |
| Order | A commercial document listing what will be supplied; no tax effect | `Order` (number, customerId, date, lines) |
| Order line | One item: description, quantity, unit price | `OrderLine` (description, quantity, unitPriceCents) |
| Unit price | Price of one unit, exclusive of VAT | `unitPriceCents` |
| Line total | quantity × unit price, rounded to the minor unit | computed in `src/domain/` (R-15) |
| Order total | Sum of the line totals | computed, never stored (R-16) |
| Minor unit | The smallest unit of a currency: for EUR the cent, 1/100 | cents, integers |
| Invoice | The tax document issued for a supply; creates the claim and records the VAT | not built yet (R-24 LATER) |
| Invoice number | Sequential number in a series, unique per invoice | not built yet; `Order.number` is not it |
| Credit note | A document that amends an invoice and refers to it; treated as an invoice | not built yet |
| Taxable amount | Amount on which VAT is computed, per rate, before VAT | today equal to the line total (no tax) |
| VAT rate / VAT amount | Rate applied and the resulting tax, per rate | not built yet (R-23 LATER) |
| Issue date | Date the invoice is issued | not built yet; `Order.date` is an order date |
| Supply date | Date the goods or services were supplied, if it differs from the issue date | not built yet |
| Due date | Date by which payment is expected; a commercial term, not required by the Directive | not built yet |

## Rules
### D-01 Money is held as integers in the currency's minor unit (EUR cents). Never floats.
Why: ISO 4217 gives EUR two decimals (minor unit 2), so every EUR amount is a whole number of cents. Binary floats cannot hold most decimal fractions exactly, so sums drift.
Source: ISO 4217 list one (maintenance agency SIX), EUR, numeric 978, minor units 2: https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml ; Money pattern, Fowler, PoEAA: https://martinfowler.com/eaaCatalog/money.html
Applies to: both

### D-02 A line total is quantity × unit price, computed exactly in minor units.
Why: The invoice shows unit price and quantity (Article 226(6) and (8)); the line amount must follow from them, or the reader cannot check the document.
Source: Directive 2006/112/EC, Article 226(6), 226(8): https://eur-lex.europa.eu/eli/dir/2006/112/oj ; practice: EN 16931 / Peppol BIS Billing 3.0, BT-131 line net amount: https://docs.peppol.eu/poacc/billing/3.0/bis/
Applies to: both

### D-03 Each line total is rounded to the cent; the document total is the sum of the rounded line totals.
Why: This is the practice in European e-invoicing: amounts are rounded per line, and totals are sums of already rounded amounts, which are not rounded again. Rounding the unrounded sum instead gives a total that does not match the printed lines. Any other method (for example rounding the total, or rounding VAT per document rather than per line) must be an explicit, recorded decision.
Source: Peppol BIS Billing 3.0, section 9 "Rounding" ("Invoice line net amount shall be rounded to two decimals", "Results from calculations involving already rounded amounts are not subject to rounding") and rule BR-CO-10 (BT-106 = Σ BT-131): https://docs.peppol.eu/poacc/billing/3.0/bis/ . Accounting practice; the Directive does not prescribe a rounding method.
Applies to: both

### D-04 Quantity is positive and non-zero; unit price is never negative; zero price is allowed.
Why: A line with quantity 0 is not a supply. A negative price is not a price. Reductions are either a discount shown on the line (Article 226(8)) or a credit note (D-07). A free item is a legitimate line at price 0. With whole-number quantities today, this means quantity ≥ 1 and price ≥ 0.
Source: Directive 2006/112/EC, Article 226(8) (discounts shown separately); Peppol BIS Billing 3.0, rule BR-27 "The Item net price (BT-146) shall NOT be negative": https://docs.peppol.eu/poacc/billing/3.0/bis/
Applies to: both

### D-05 Totals are always recomputed from the lines. A stored or typed total is never the source of truth.
Why: A total that can diverge from its lines is a bookkeeping error waiting to happen. If a total is cached for display, it is derived and discarded on any change of a line.
Source: accounting practice; Peppol BIS Billing 3.0 rules BR-CO-10 and BR-CO-15 define totals as sums of their parts: https://docs.peppol.eu/poacc/billing/3.0/bis/
Applies to: both

### D-06 An order is not an invoice. No tax obligation and no claim exist until an invoice is issued.
Why: VAT becomes chargeable when the supply takes place (Articles 62 and 63) and the supplier must issue an invoice for it (Article 220(1)). An order can be changed or deleted freely; an issued invoice cannot (D-07). The app must never present an order as an invoice.
Source: Directive 2006/112/EC, Articles 62, 63, 220(1): https://eur-lex.europa.eu/eli/dir/2006/112/oj
Applies to: both

### D-07 An issued invoice is immutable. Corrections are credit notes or new documents that refer to it.
Why: The content of an invoice must stay unaltered from issue until the end of its storage period (Article 233(1), "integrity of the content"). A document that amends an invoice and refers to it unambiguously is itself an invoice (Article 219) and reduces the taxable amount under Article 90. Editing or deleting an issued invoice destroys the audit trail.
Source: Directive 2006/112/EC, Articles 219, 233(1), 90(1): https://eur-lex.europa.eu/eli/dir/2006/112/oj
Applies to: both

### D-08 Invoice numbers are sequential, drawn from one or more series, and unique. Numbers are never reused.
Why: Article 226(2) requires "a sequential number, based on one or more series, which uniquely identifies the invoice". Member states and auditors read this as gapless within a series: a missing number looks like a destroyed invoice. The number is assigned at issue, not at draft. Order numbers in this app (A-04) are a separate counter and are not invoice numbers.
Source: Directive 2006/112/EC, Article 226(2): https://eur-lex.europa.eu/eli/dir/2006/112/oj . "No gaps" is national practice, not the Directive's wording.
Applies to: both

### D-09 An invoice carries the content of Article 226.
Why: For VAT purposes an invoice needs: date of issue (1); sequential number (2); supplier VAT number (3); customer VAT number where the customer is liable or for intra-EU goods (4); full name and address of supplier and customer (5); quantity and nature of goods or extent and nature of services (6); supply date or payment-on-account date, when it differs from the issue date (7); taxable amount per rate or exemption, unit price exclusive of VAT, discounts if not in the unit price (8); VAT rate (9); VAT amount (10); exemption reference or "Reverse charge" where applicable (11, 11a). Anything the app calls an invoice must be able to show all of these.
Source: Directive 2006/112/EC, Article 226: https://eur-lex.europa.eu/eli/dir/2006/112/oj
Applies to: both

### D-10 The customer record holds, or can hold, what the invoice needs: legal name, address, VAT identification number.
Why: Article 226(4) and (5) require the customer's full name, address and, in the relevant cases, VAT number. This app stores name, email and phone only (A-02). That is acceptable for orders, but the model must accept address and VAT number fields later without migrating or renaming the existing ones, and the name must be the legal name, not a nickname.
Source: Directive 2006/112/EC, Article 226(4), 226(5): https://eur-lex.europa.eu/eli/dir/2006/112/oj
Applies to: both

### D-11 A customer who has documents cannot be deleted. Invoices are kept for the national retention period.
Why: Every taxable person must store copies of issued invoices (Article 244) for a period each member state sets (Article 247(1)); for example Germany: 8 years from the end of the calendar year of issue (§ 14b(1) UStG, 10 years before 2025). Deleting a customer would orphan documents that must stay readable. Today the app refuses to delete a customer with orders (R-05); the same rule, without exception, must hold for invoices. A customer may be deactivated, never removed.
Source: Directive 2006/112/EC, Articles 244, 247(1): https://eur-lex.europa.eu/eli/dir/2006/112/oj ; § 14b UStG: https://www.gesetze-im-internet.de/ustg_1980/__14b.html
Applies to: both

### D-12 Every document states its currency, once, for all its amounts.
Why: Amounts on an invoice may be in any currency, but the VAT amount must also be in the national currency (Article 230), so the document must say which currency its amounts are in. A single-currency app still records the currency (ISO 4217 code) on the document or at the data root, so that a second currency later cannot be mistaken for the first.
Source: Directive 2006/112/EC, Article 230: https://eur-lex.europa.eu/eli/dir/2006/112/oj ; Peppol BIS Billing 3.0 rule BR-05 (invoice currency code): https://docs.peppol.eu/poacc/billing/3.0/bis/ ; ISO 4217 (D-01)
Applies to: both

### D-13 Dates are distinct: issue date, supply date, due date. They are calendar dates, not timestamps.
Why: Article 226(1) requires the issue date and 226(7) the supply date when it differs. The due date is a payment term, needed for reminders and interest, not required by the Directive. The order date in this app is none of these; it must not be reused as an issue date. Dates are stored as `YYYY-MM-DD` (A-05), without time zone.
Source: Directive 2006/112/EC, Article 226(1), 226(7), 222 (time limits for issue): https://eur-lex.europa.eu/eli/dir/2006/112/oj ; due date: accounting practice
Applies to: both

### D-14 Search, filter and sort never change data.
Why: Looking at records is not a transaction. A filter that writes (for example re-sorting and saving lines, or trimming a name while matching) corrupts the stored state silently.
Source: accounting practice (read operations are side-effect free).
Applies to: both

### D-15 The app may defer tax, credit notes, invoice numbering and payment status, but its data model must not make them impossible.
Why: Deferring is fine; painting into a corner is not. Concretely: lines keep unit price exclusive of VAT (a rate and a VAT amount can be added per line); totals are computed, not stored (D-05); orders and invoices are separate kinds, so an order can later point to the invoice issued from it; identifiers are stable UUIDs (R-07, R-03); amounts are integers in cents (D-01); the stored object is versioned (A-09) so a migration can add fields.
Source: accounting practice, derived from D-01, D-05, D-06 to D-09.
Applies to: both

## What a reviewer checks
Questions to the requirements (domain-expert):
- Are amounts specified in cents as integers, with the display format separate from storage? (D-01)
- Is the line total defined as quantity × unit price, and the order total as the sum of rounded line totals? Is any other rounding written down as a decision? (D-02, D-03)
- Are quantity and price bounds stated: quantity ≥ 1, price ≥ 0? (D-04)
- Is any total ever typed in or stored? (D-05)
- Does any requirement call an order an invoice, or let an order carry tax or an invoice number? (D-06, D-08, D-09)
- Once invoices exist: is "edit invoice" or "delete invoice" anywhere? It must be "credit note". (D-07)
- Can the customer later hold legal name, address and VAT number without renaming today's fields? (D-10)
- Is deletion of a customer with orders or invoices refused, not cascaded? (D-11)
- Is the currency named on the document or at the data root? (D-12)
- Are order date, issue date, supply date and due date kept apart? (D-13)
- Does search or filter ever describe a write? (D-14)
- Does every LATER item have a place in the data model? (D-15)

Questions to the code (finder-domain):
- Any `parseFloat`, `toFixed`, `/ 100` or `* 100` on amounts outside the input parser and the display formatter? Any amount typed `number` that is not an integer check? (D-01)
- Is the line total an integer multiplication of integers, and the order total `reduce` over line totals? (D-02, D-03, D-05)
- Does validation reject quantity 0 or negative, price negative, and non-integer cents? (D-04)
- Is a total field persisted in `localStorage`? (D-05)
- Is there a field, label or export that names an order "invoice"? (D-06)
- Does delete customer check for orders before removing, and refuse rather than cascade? (D-11)
- Is the currency a constant or field, not an assumption in the formatter only? (D-12)
- Are dates strings `YYYY-MM-DD`, with no `Date.now()` stored as a document date? (D-13)
- Do search, filter and sort functions in `src/domain/` and `src/ui/` return new arrays and never call storage? (D-14)
- Would adding `vatRate`, `invoiceId`, `issueDate` or a `credit-note` kind require renaming or recomputing anything stored? (D-15)
