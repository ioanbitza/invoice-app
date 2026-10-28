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
