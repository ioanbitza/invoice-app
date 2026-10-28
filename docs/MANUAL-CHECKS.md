# Manual checks

Run `python3 -m http.server 8000` and open http://localhost:8000.

- [x] R-01: add a customer "Ana Pop" with no email and no phone; she appears in the list.
- [x] R-02: save with name "   "; a message appears next to Name and nothing is added. Email "a@b"; refused with a message.
- [x] R-03: edit Ana's email and save; the list shows the new email and her orders are still there.
- [x] R-04: open a customer with two orders; you see their fields and both orders with totals as `€x.xx`.
- [x] R-05: delete a customer with 2 orders; after confirming, the app says they have 2 orders to delete first, and the customer stays. Delete one without orders and cancel the dialog; nothing changes.
- [x] R-06: type "  ANA " in search; only matching customers show. Clear it; all show.
- [x] R-17: add a customer, reload the page; the customer is still there.
- [x] R-18: in DevTools set `localStorage['invoice-app']` to `{bad`, reload; an error banner shows, forms are disabled, and the key still holds `{bad`.
- [x] R-19: in DevTools fill storage until it is full (or override `Storage.prototype.setItem` to throw), then add a customer; an error shows and the customer is not in the list.
- [x] R-20: with no data, the customer list says there are no customers and offers "Add customer"; a search with no match says no customers match.
- [x] R-21: add a customer named `<img src=x onerror=alert(1)>`; the name shows literally and no alert appears.
- [x] R-07: create an order for Ana; it gets the next number, today's date and no lines.
- [x] R-08: change the order date and save; the new date shows. The customer has no edit control.
- [x] R-09: delete an order and confirm; it and its lines are gone. Create another; its number is not the deleted one.
- [x] R-10: filter by customer, then type part of an order number or a customer name in any case; only matches show. Clear both; all orders show, newest date first.
- [x] R-11: add a line "Design", 2, 12.5; it shows with unit price €12.50 and line total €25.00.
- [x] R-12: try quantity 1.5, price 12.345 and an empty description; each is refused with a message next to its field. Price 12,50 says "Use a dot for decimals, e.g. 12.50" and nothing is saved.
- [x] R-13: edit the line's quantity to 3; it updates in place and the total becomes €37.50.
- [x] R-14: remove the line; the order total drops at once.
- [x] R-15: a line of 3 × 0.10 shows €0.30 exactly.
- [x] R-16: an order with lines €1,000.00 and €234.50 shows total €1,234.50; an order with no lines shows €0.00.
- [x] R-20: with no orders the list says so and offers "New order"; an order with no lines says so and offers to add one.
- [x] R-21: add a line described `<b>bold</b>`; it shows the tags literally.
- [ ] R-18 (F-07): set `localStorage['invoice-app']` to `{bad` and reload; the banner shows and the main area says the stored data could not be loaded. It never says "No customers yet" or "No orders yet", on either tab, and there are no forms.
- [ ] R-10 (F-10): on Orders pick a customer in the filter, delete that customer on the Customers tab (they must have no orders), return to Orders; the filter shows "All customers" and the remaining orders are listed, not "No orders match your filter."
