# ADR-005: Navigation

Date: 2026-10-30. Status: accepted. Author: architect, accepted by Ioan Bita.
Tags: javascript, browser, web-ui

## Context
R-28 asks that the user can reach both lists from every screen and open orders from the list and the customer detail. R-31 says a page is addressed by `id` only and that the URL and title hold no personal data or search text. The app is static files with no server (ADR-001, ADR-008), so a path-based address would need a server fallback that does not exist. The plan needs the page model, the addresses and where each action lands.

## Decision
- One page, `index.html`, with hash routing. The address after `#` is the only navigation state. `src/ui/router.js` holds `parseRoute(hash)` and `routeToHash(route)`, both pure. `src/ui/main.js` has the one `hashchange` listener and re-renders on it. The browser's Back and Forward work with no extra code.
- The routes:

| Hash | Screen |
|---|---|
| `#/customers` | customer list (the start screen) |
| `#/customers/new` | new customer form |
| `#/customers/<id>` | customer detail |
| `#/customers/<id>/edit` | edit customer form |
| `#/customers/<id>/orders/new` | new order form with the customer already picked |
| `#/orders` | order list |
| `#/orders/new` | new order form with a customer picker |
| `#/orders/<id>` | order view, including its lines |
| `#/orders/<id>/edit` | edit order form |

- An empty hash goes to `#/customers` with `location.replace`.
- A hash that matches no route, or an `id` that no record has, shows a not-found screen with links to both lists. It writes nothing and never displays the text of the hash.
- The add and edit line forms live inside the order view and have no route of their own.
- Where actions land:

| Action | Lands on |
|---|---|
| Save a new customer | `#/customers` (R-01) |
| Save a customer edit | `#/customers/<id>` |
| Save a new order | `#/orders/<id>` (R-28) |
| Save an order edit | `#/orders/<id>` |
| Delete a customer | `#/customers`, with `location.replace` |
| Delete an order | `#/orders`, with `location.replace` |
| Cancel on a new customer | `#/customers` |
| Cancel on a customer edit | `#/customers/<id>` |
| Cancel on a new order | the customer detail when opened from it, otherwise `#/orders` |
| Cancel on an order edit | `#/orders/<id>` |

- `#/orders/new` with no customers does not show the form: it shows the R-18 message with a link to `#/customers/new`.
- Every screen carries links to `#/customers` and `#/orders` (R-28). The one exception is the blocked screen of R-20, which is not a route: it replaces everything, whatever the hash says, because R-20 shows the error instead of the lists.
- The page title comes from a frozen table of route names in `src/ui/router.js` (for example `Customers - Invoice app`) and never contains record data (R-31).
- The search texts live in the UI state of `src/ui/main.js`, one per list, and are never put in the address (R-31). They survive moving between screens and are gone after a reload.
- The customer picker of an order lists each customer as name and email, in the R-03 order (R-06, A-12).

## Consequences
- The app works from any folder of any static host, with no server rewrite rule, and a reload keeps the screen.
- A link to a record is meaningful only in the browser holding that record; elsewhere it shows not-found, which is correct under A-01.
- `parseRoute` can be tested under Node for every route, including the unknown ones.
- The address never holds what the user searched for, so a search cannot be bookmarked or restored from history.
- An agent that hits the edge of this decision writes NEEDS HUMAN and stops.

## Not decided here
- What the forms and confirmations look like, a page or a dialog, and where focus goes after a screen changes: `docs/UI-SPEC.md`. The routes above are addresses; a design that needs a form to have no route writes `NEEDS HUMAN` here.
- What happens to typed text when the user follows a link away from an open form instead of pressing Cancel. R-17 covers only Cancel. `docs/UI-SPEC.md` proposes it and the human approves it.

## Answered
