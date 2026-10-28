# Manual checks

Run `python3 -m http.server 8000` and open http://localhost:8000.

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
- [ ] R-07: create an order for Ana; it gets the next number, today's date and no lines.
- [ ] R-08: change the order date and save; the new date shows. The customer has no edit control.
- [ ] R-09: delete an order and confirm; it and its lines are gone. Create another; its number is not the deleted one.
- [ ] R-10: filter by customer, then type part of an order number or a customer name in any case; only matches show. Clear both; all orders show, newest date first.
- [ ] R-11: add a line "Design", 2, 12.5; it shows with unit price €12.50 and line total €25.00.
- [ ] R-12: try quantity 1.5, price 12.345 and an empty description; each is refused with a message next to its field. Price 12,50 says "Use a dot for decimals, e.g. 12.50" and nothing is saved.
- [ ] R-13: edit the line's quantity to 3; it updates in place and the total becomes €37.50.
- [ ] R-14: remove the line; the order total drops at once.
- [ ] R-15: a line of 3 × 0.10 shows €0.30 exactly.
- [ ] R-16: an order with lines €1,000.00 and €234.50 shows total €1,234.50; an order with no lines shows €0.00.
- [ ] R-20: with no orders the list says so and offers "New order"; an order with no lines says so and offers to add one.
- [ ] R-21: add a line described `<b>bold</b>`; it shows the tags literally.
