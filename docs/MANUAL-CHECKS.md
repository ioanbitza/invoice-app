# Manual checks

## S8
- [ ] R-16: in a browser set to Romanian, open a screen with an amount (from S12), it shows 1.234,50 € rather than €1,234.50
- [ ] R-31: open a route with a made-up id, the URL shows the id only and the page title holds no record data
- [ ] UX: keyboard only, from the first field to the outcome, focus visible at every step

## S9
- [ ] R-20: put invalid JSON under the invoice-app key and reload, the blocked screen shows, no list and no nav, the stored text is unchanged
- [ ] R-20: put a document with version 2 under the key and reload, the newer-version text shows with STO-04
- [ ] R-20: choose Start with empty data, a dialog says the old data will be lost; Cancel keeps the text, confirming replaces it
- [ ] R-20: with storage access denied in the browser, reload, the unavailable text shows with STO-02 and no stored text is offered
- [ ] R-21: on the blocked screen, run Storage.prototype.removeItem = () => { throw new Error('test'); } in the devtools console, confirm Start with empty data, the banner shows STO-02 and the screen stays
- [ ] R-22: put a customer name of <b>x</b> in the stored document, nothing on the blocked or not-found screen interprets it
- [ ] R-28: on the not-found screen, both links reach their lists' routes and the nav shows no current item
- [ ] R-31: open #/some-private-text, the screen and the title show none of it
- [ ] R-32: on the blocked screen, Start with empty data after its confirmation removes the invoice-app key
- [ ] UX: keyboard only, from the first field to the outcome, focus visible at every step
- [ ] UX: 200% browser zoom, nothing cut off, no horizontal scroll
- [ ] UX: contrast 4.5:1 on text, 3:1 on large text and borders (browser devtools)
- [ ] UX: empty states: an empty list and an empty form say what to do
- [ ] UX: a validation error appears next to its field and says how to fix it
- [ ] UX: 320 px wide, every screen of the slice, no horizontal scroll
- [ ] UX: design tokens only: no raw color, size or spacing outside :root in styles.css (grep for "#", "rgb(", "px" outside the token block)
- [ ] UX: every button, link, input and tab shows hover, focus-visible, active and disabled as docs/UI-SPEC.md describes
- [ ] UX: type and spacing scales respected: every font-size and every margin, padding and gap is a token
- [ ] UX: each screen of the slice matches its sketch in docs/UI-SPEC.md at 320 px and at desktop width
- [ ] UX: leaving a form: S9 writes the guard and S11 completes this check with the first real form: type in a form, click Orders, then Keep editing: the text is still there; repeat with the browser's Back
- [ ] UX: not found: an invented hash shows the screen and no part of the hash
- [ ] UX: blocked screen: with invalid JSON under the invoice-app key, no list and no nav show; copy works; Start with empty data asks first
- [ ] UX: all colors: the contrast ratios of section 3 match the browser devtools

## S10
- [ ] R-03: with seeded customers, the list shows name and email, sorted by name whatever the case
- [ ] R-05: type part of a name, then part of an email, with spaces around it, only matching rows show; empty the box, all show
- [ ] R-18: with no customers, No customers yet. Add the first one. shows; with a search that matches nothing, Clear search returns all and focus to the box
- [ ] R-19: the note about this browser shows, also with no customers
- [ ] R-22: seed a customer named <b>x</b> and search for <b>x</b>, the text shows literally in the row
- [ ] R-28: Customers and Orders are reachable from this screen, the Customers link is marked current
- [ ] R-32: press Erase all data, the dialog says all customers and orders will be gone for good; Cancel changes nothing, confirming empties the list and the invoice-app key is gone
- [ ] UX: keyboard only, from the first field to the outcome, focus visible at every step
- [ ] UX: 200% browser zoom, nothing cut off, no horizontal scroll
- [ ] UX: contrast 4.5:1 on text, 3:1 on large text and borders (browser devtools)
- [ ] UX: empty states: an empty list and an empty form say what to do
- [ ] UX: a validation error appears next to its field and says how to fix it
- [ ] UX: 320 px wide, every screen of the slice, no horizontal scroll
- [ ] UX: design tokens only: no raw color, size or spacing outside :root in styles.css (grep for "#", "rgb(", "px" outside the token block)
- [ ] UX: every button, link, input and tab shows hover, focus-visible, active and disabled as docs/UI-SPEC.md describes
- [ ] UX: type and spacing scales respected: every font-size and every margin, padding and gap is a token
- [ ] UX: each screen of the slice matches its sketch in docs/UI-SPEC.md at 320 px and at desktop width
- [ ] UX: customer list: type in search, the caret stays and the list narrows; a 100-character name wraps at 320 px and truncates with a title on desktop
