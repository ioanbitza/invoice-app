# Manual checks

## S8
- [x] R-16: in a browser set to Romanian, open a screen with an amount (from S12), it shows 1.234,50 € rather than €1,234.50
- [x] R-31: open a route with a made-up id, the URL shows the id only and the page title holds no record data
- [x] UX: keyboard only, from the first field to the outcome, focus visible at every step
- [x] UX: 200% browser zoom, nothing cut off, no horizontal scroll
- [x] UX: contrast 4.5:1 on text, 3:1 on large text and borders (browser devtools)
- [x] UX: empty states: an empty list and an empty form say what to do
- [x] UX: a validation error appears next to its field and says how to fix it
- [x] UX: 320 px wide, every screen of the slice, no horizontal scroll
- [x] UX: design tokens only: no raw color, size or spacing outside :root in styles.css (grep for "#", "rgb(", "px" outside the token block)
- [x] UX: every button, link, input and tab shows hover, focus-visible, active and disabled as docs/UI-SPEC.md describes
- [x] UX: type and spacing scales respected: every font-size and every margin, padding and gap is a token
- [x] UX: each screen of the slice matches its sketch in docs/UI-SPEC.md at 320 px and at desktop width

## S9
- [x] R-20: put invalid JSON under the invoice-app key and reload, the blocked screen shows, no list and no nav, the stored text is unchanged
- [x] R-20: put a document with version 2 under the key and reload, the newer-version text shows with STO-04
- [x] R-20: choose Start with empty data, a dialog says the old data will be lost; Cancel keeps the text, confirming replaces it
- [x] R-20: with storage access denied in the browser, reload, the unavailable text shows with STO-02 and no stored text is offered
- [x] R-21: on the blocked screen, run Storage.prototype.removeItem = () => { throw new Error('test'); } in the devtools console, confirm Start with empty data, the banner shows STO-02 and the screen stays
- [x] R-22: put a customer name of <b>x</b> in the stored document, nothing on the blocked or not-found screen interprets it
- [x] R-28: on the not-found screen, both links reach their lists' routes and the nav shows no current item
- [x] R-31: open #/some-private-text, the screen and the title show none of it
- [x] R-32: on the blocked screen, Start with empty data after its confirmation removes the invoice-app key
- [x] UX: keyboard only, from the first field to the outcome, focus visible at every step
- [x] UX: 200% browser zoom, nothing cut off, no horizontal scroll
- [x] UX: contrast 4.5:1 on text, 3:1 on large text and borders (browser devtools)
- [x] UX: empty states: an empty list and an empty form say what to do
- [x] UX: a validation error appears next to its field and says how to fix it
- [x] UX: 320 px wide, every screen of the slice, no horizontal scroll
- [x] UX: design tokens only: no raw color, size or spacing outside :root in styles.css (grep for "#", "rgb(", "px" outside the token block)
- [x] UX: every button, link, input and tab shows hover, focus-visible, active and disabled as docs/UI-SPEC.md describes
- [x] UX: type and spacing scales respected: every font-size and every margin, padding and gap is a token
- [x] UX: each screen of the slice matches its sketch in docs/UI-SPEC.md at 320 px and at desktop width
- [x] UX: leaving a form: S9 writes the guard and S11 completes this check with the first real form: type in a form, click Orders, then Keep editing: the text is still there; repeat with the browser's Back
- [x] UX: not found: an invented hash shows the screen and no part of the hash
- [x] UX: blocked screen: with invalid JSON under the invoice-app key, no list and no nav show; copy works; Start with empty data asks first
- [x] UX: all colors: the contrast ratios of section 3 match the browser devtools

## S10
- [x] R-03: with seeded customers, the list shows name and email, sorted by name whatever the case
- [x] R-05: type part of a name, then part of an email, with spaces around it, only matching rows show; empty the box, all show
- [x] R-18: with no customers, No customers yet. Add the first one. shows; with a search that matches nothing, Clear search returns all and focus to the box
- [x] R-19: the note about this browser shows, also with no customers
- [x] R-22: seed a customer named <b>x</b> and search for <b>x</b>, the text shows literally in the row
- [x] R-28: Customers and Orders are reachable from this screen, the Customers link is marked current
- [x] R-32: press Erase all data, the dialog says all customers and orders will be gone for good; Cancel changes nothing, confirming empties the list and the invoice-app key is gone
- [x] R-01: type a name in Search customers, open Add customer, save a name only, the list shows the new customer and the search box is empty
- [x] R-04: type a customer's name in Search customers and in Search orders, delete that customer's orders, then the customer, the list shows without that customer and both search boxes are empty
- [x] UX: keyboard only, from the first field to the outcome, focus visible at every step
- [x] UX: 200% browser zoom, nothing cut off, no horizontal scroll
- [x] UX: contrast 4.5:1 on text, 3:1 on large text and borders (browser devtools)
- [x] UX: empty states: an empty list and an empty form say what to do
- [x] UX: a validation error appears next to its field and says how to fix it
- [x] UX: 320 px wide, every screen of the slice, no horizontal scroll
- [x] UX: design tokens only: no raw color, size or spacing outside :root in styles.css (grep for "#", "rgb(", "px" outside the token block)
- [x] UX: every button, link, input and tab shows hover, focus-visible, active and disabled as docs/UI-SPEC.md describes
- [x] UX: type and spacing scales respected: every font-size and every margin, padding and gap is a token
- [x] UX: each screen of the slice matches its sketch in docs/UI-SPEC.md at 320 px and at desktop width
- [x] UX: customer list: type in search, the caret stays and the list narrows; a 100-character name wraps at 320 px and truncates with a title on desktop

## S11
- [x] R-01: save a name only, the customer appears in the list; save with email ab.c, the error shows and nothing is saved
- [x] R-01: type a name in Search customers, press Add customer, fill a name and a valid email and save, the list shows the new customer with the search box empty (review F-63; S10 covers the name-only case)
- [x] R-02: edit a customer with an invalid email, the old values stay; edit with valid values, the list shows them
- [x] R-17: leave the name empty and give a bad email, both messages show next to their fields, focus is on Name; Cancel discards and the saved values stay
- [x] R-21: fill localStorage from devtools until a save fails, the form stays filled and shows STO-01; free space and press Save again, it saves
- [x] R-22: save a customer named <b>x</b>, the form and the list show it literally
- [x] UX: keyboard only, from the first field to the outcome, focus visible at every step
- [x] UX: 200% browser zoom, nothing cut off, no horizontal scroll
- [x] UX: contrast 4.5:1 on text, 3:1 on large text and borders (browser devtools)
- [x] UX: empty states: an empty list and an empty form say what to do
- [x] UX: a validation error appears next to its field and says how to fix it
- [x] UX: 320 px wide, every screen of the slice, no horizontal scroll
- [x] UX: design tokens only: no raw color, size or spacing outside :root in styles.css (grep for "#", "rgb(", "px" outside the token block)
- [x] UX: every button, link, input and tab shows hover, focus-visible, active and disabled as docs/UI-SPEC.md describes
- [x] UX: type and spacing scales respected: every font-size and every margin, padding and gap is a token
- [x] UX: each screen of the slice matches its sketch in docs/UI-SPEC.md at 320 px and at desktop width
- [x] UX: customer form: Save with a bad email and an empty name, both errors show, focus lands on Name, nothing is saved
- [x] UX: leaving a form: type in a form, click Orders, then Keep editing: the text is still there; repeat with the browser's Back

## S12
- [x] R-03: the detail shows all fields and the customer's orders with their totals
- [x] R-04: on a customer with 3 orders, Delete customer shows no dialog, the banner names 3 orders, that no legal retention applies, and that deleting those orders and then the customer erases all of this customer's data; nothing changes; with 1 order the banner says 1 order
- [x] R-04: on a customer with no orders, a dialog asks first; Cancel keeps the customer, confirming deletes it and lands on the list
- [x] R-16: amounts show two decimals and the euro sign, in the browser's language
- [x] R-18: a customer with no orders shows No orders for this customer yet. Create the first one. with New order
- [x] R-22: seed a customer address of <b>x</b>, the detail shows it literally
- [x] R-28: selecting an order row leaves for that order's address; Customers and Orders are reachable
- [x] R-29: Export data downloads customer-<id>.json under the CSP, with the purpose, the retention, all this customer's orders and lines, and no other customer's data
- [x] UX: keyboard only, from the first field to the outcome, focus visible at every step
- [x] UX: 200% browser zoom, nothing cut off, no horizontal scroll
- [x] UX: contrast 4.5:1 on text, 3:1 on large text and borders (browser devtools)
- [x] UX: empty states: an empty list and an empty form say what to do
- [x] UX: a validation error appears next to its field and says how to fix it
- [x] UX: 320 px wide, every screen of the slice, no horizontal scroll
- [x] UX: design tokens only: no raw color, size or spacing outside :root in styles.css (grep for "#", "rgb(", "px" outside the token block)
- [x] UX: every button, link, input and tab shows hover, focus-visible, active and disabled as docs/UI-SPEC.md describes
- [x] UX: type and spacing scales respected: every font-size and every margin, padding and gap is a token
- [x] UX: each screen of the slice matches its sketch in docs/UI-SPEC.md at 320 px and at desktop width
- [x] UX: customer detail: Delete with orders shows the warning with the count and no dialog; Export data downloads customer-<id>.json under the CSP

## S14
- [x] R-06: with two customers of the same name, the picker tells them apart by email; a saved order gets the next number and today's date unless changed, and opens
- [x] R-06: delete the newest order and create another, the number is not reused
- [x] R-07: edit an order, date and notes change; number and customer are read-only
- [x] R-17: save with no customer and a cleared date, both messages show and focus is on Customer; Cancel lands as ADR-005 says
- [x] R-18: on #/orders/new with no customers, no form shows and the message links to the customer form
- [x] R-21: fill localStorage until a save fails, the form stays filled and shows STO-01, and no order number is used up
- [x] R-22: save notes of <b>x</b>, the form shows them literally
- [x] UX: keyboard only, from the first field to the outcome, focus visible at every step
- [x] UX: 200% browser zoom, nothing cut off, no horizontal scroll
- [x] UX: contrast 4.5:1 on text, 3:1 on large text and borders (browser devtools)
- [x] UX: empty states: an empty list and an empty form say what to do
- [x] UX: a validation error appears next to its field and says how to fix it
- [x] UX: 320 px wide, every screen of the slice, no horizontal scroll
- [x] UX: design tokens only: no raw color, size or spacing outside :root in styles.css (grep for "#", "rgb(", "px" outside the token block)
- [x] UX: every button, link, input and tab shows hover, focus-visible, active and disabled as docs/UI-SPEC.md describes
- [x] UX: type and spacing scales respected: every font-size and every margin, padding and gap is a token
- [x] UX: each screen of the slice matches its sketch in docs/UI-SPEC.md at 320 px and at desktop width
- [x] UX: order form: the picker shows name and email for two customers of the same name; the date field opens with today

## S16
- [x] R-11: add a line with price 19,99, it is saved; quantity 0 or price 1,234.50 shows an error next to the field and adds nothing; Edit shows the price as 19.99
- [x] R-12: change a line's quantity and price, the order total updates at once; an invalid edit leaves the old values
- [x] R-13: Remove takes the line out at once and the total falls
- [x] R-17: Cancel closes the line form, discards what was typed, and the saved line stays
- [x] R-18: from the no-lines message, Add line opens the form
- [x] R-21: fill localStorage until saving a line fails, the form stays open with what was typed and shows STO-01; a failed Remove keeps the line and shows the banner
- [x] R-22: add a line described <b>x</b>, it shows literally
- [x] R-28: from the order view the user can edit the order, add, edit and remove lines, and delete the order
- [x] UX: keyboard only, from the first field to the outcome, focus visible at every step
- [x] UX: 200% browser zoom, nothing cut off, no horizontal scroll
- [x] UX: contrast 4.5:1 on text, 3:1 on large text and borders (browser devtools)
- [x] UX: empty states: an empty list and an empty form say what to do
- [x] UX: a validation error appears next to its field and says how to fix it
- [x] UX: 320 px wide, every screen of the slice, no horizontal scroll
- [x] UX: design tokens only: no raw color, size or spacing outside :root in styles.css (grep for "#", "rgb(", "px" outside the token block)
- [x] UX: every button, link, input and tab shows hover, focus-visible, active and disabled as docs/UI-SPEC.md describes
- [x] UX: type and spacing scales respected: every font-size and every margin, padding and gap is a token
- [x] UX: each screen of the slice matches its sketch in docs/UI-SPEC.md at 320 px and at desktop width
- [x] UX: order view: add, edit and remove a line by keyboard, the total updates each time; while the line form is open the row buttons are disabled

## S15
- [x] R-08: Delete order asks first; Cancel changes nothing, confirming removes the order and its lines, and the customer stays
- [x] R-14: lines of 3 x 0.10 and 3 x 19.99 show line totals of 0.30 and 59.97
- [x] R-15: the order total is the sum of the line totals; an order with no lines shows 0.00
- [x] R-16: every amount shows two decimals and the euro sign, in the browser's language
- [x] R-18: an order with no lines shows No lines yet. Add the first one.
- [x] R-22: seed notes and a description of <b>x</b>, the view shows them literally
- [x] R-28: the view shows number, customer, date, notes, each line in the order added, and the total; the Customer link and both lists are reachable; from the order list and the customer detail, selecting an order opens this view
- [x] UX: keyboard only, from the first field to the outcome, focus visible at every step
- [x] UX: 200% browser zoom, nothing cut off, no horizontal scroll
- [x] UX: contrast 4.5:1 on text, 3:1 on large text and borders (browser devtools)
- [x] UX: empty states: an empty list and an empty form say what to do
- [x] UX: a validation error appears next to its field and says how to fix it
- [x] UX: 320 px wide, every screen of the slice, no horizontal scroll
- [x] UX: design tokens only: no raw color, size or spacing outside :root in styles.css (grep for "#", "rgb(", "px" outside the token block)
- [x] UX: every button, link, input and tab shows hover, focus-visible, active and disabled as docs/UI-SPEC.md describes
- [x] UX: type and spacing scales respected: every font-size and every margin, padding and gap is a token
- [x] UX: each screen of the slice matches its sketch in docs/UI-SPEC.md at 320 px and at desktop width

## S13
- [x] R-09: the list shows number, customer, date and total, newest date first, then highest number first
- [x] R-10: type part of a number, then part of a customer name in another case, only matching rows show; empty the box, all show
- [x] R-16: totals show two decimals and the euro sign, in the browser's language
- [x] R-18: with no customers the list says a customer must be added first and links to the customer form, and no order can be started; with no orders it offers the first one; a search with no match says so and offers to clear it
- [x] R-22: search for <b>x</b>, the search text and any customer named so show literally
- [x] R-28: selecting a row leaves for that order's address; Customers and Orders are reachable, the Orders link is marked current
- [x] R-31: type a customer name into the order search, then into the customer search; the address bar and the page title never show the typed text (review F-44)
- [x] UX: keyboard only, from the first field to the outcome, focus visible at every step
- [x] UX: 200% browser zoom, nothing cut off, no horizontal scroll
- [x] UX: contrast 4.5:1 on text, 3:1 on large text and borders (browser devtools)
- [x] UX: empty states: an empty list and an empty form say what to do
- [x] UX: a validation error appears next to its field and says how to fix it
- [x] UX: 320 px wide, every screen of the slice, no horizontal scroll
- [x] UX: design tokens only: no raw color, size or spacing outside :root in styles.css (grep for "#", "rgb(", "px" outside the token block)
- [x] UX: every button, link, input and tab shows hover, focus-visible, active and disabled as docs/UI-SPEC.md describes
- [x] UX: type and spacing scales respected: every font-size and every margin, padding and gap is a token
- [x] UX: each screen of the slice matches its sketch in docs/UI-SPEC.md at 320 px and at desktop width
- [x] UX: order list: with no customers only the "Add a customer first" message shows; with customers, Back from an order keeps the search
