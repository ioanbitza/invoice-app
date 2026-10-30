# ADR-004: Navigation

Date: 2026-10-28. Status: accepted. Author: Ioan Bita.

## Context
The plan (D2) asks how people move around the app: one page with tabs, or one web address per screen so the browser Back button and bookmarks work. The app is small and runs locally for one user.

## Decision
- One page with two tabs, Customers and Orders.
- Opening a customer or an order shows its detail in the same page, with a "Back" link.
- No URL routing and no hash addresses in this build.

## Consequences
- Less code: no router file, no address parsing, half a slice less of work.
- The browser Back button and bookmarks do not point at a screen inside the app.
- An agent that needs per-screen addresses writes `NEEDS HUMAN` and stops.

## Not decided here
- Keyboard shortcuts and focus order inside the page.
- Whether the last open tab is remembered across reloads.

## Answered
Q: How do people move around the app?  A (2026-10-28, Ioan Bita): "One page with two tabs, Customers and Orders, and a Back link on the detail screens. No routing in this build."
