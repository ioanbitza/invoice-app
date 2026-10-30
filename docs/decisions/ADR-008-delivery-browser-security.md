# ADR-008: Delivery and browser security

Date: 2026-10-30. Status: accepted. Author: architect, accepted by Ioan Bita.
Tags: javascript, browser, web-ui

## Context
ADR-002 sends delivery to GitHub Pages, and the requirements review (LEG-09) left the origin to this kind of decision: a project site shares its origin, and so its `localStorage`, with the owner's other sites under the same `github.io` name. R-22 and A-01 promise that user text is only text and that nothing leaves the device, and SE-15 and SE-16 ask for browser headers and a threat register. GitHub Pages does not let a site set response headers, and the requirements do not spell any of this out.

## Decision
- Host: GitHub Pages, serving the repository files as they are, with no build step (ADR-001, ADR-002). `docs/RUNBOOK.md` and the Pages workflow are the devops role's.
- Every URL in `index.html`, `styles.css` and the imports is relative (`./styles.css`, `./src/ui/main.js`), so the same files work at `http://localhost:8000/` and at `https://<owner>.github.io/<repo>/`. Hash routes (ADR-005) need nothing from the host.
- The app's data uses only its own key, and the app never calls `localStorage.clear()` or reads other keys (ADR-004).
- `index.html` carries this policy in a `<meta http-equiv="Content-Security-Policy">` tag, placed before any script or stylesheet:
  ```
  default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'
  ```
- The policy makes A-01 a browser rule: the page cannot send data anywhere, and it cannot run inline or foreign script even if an injection got through (SE-15). It also means no inline `<script>`, no `style=""` attribute in markup and no inline event handler. Styling goes through classes.
- The R-29 download must be checked once under this policy, as an item in `docs/MANUAL-CHECKS.md`.
- No analytics, no error reporting service, no remote font, no external link that loads anything by itself (A-01, JS-18).
- `frame-ancestors` and the other header-only protections cannot be set from a `meta` tag. This is accepted (T-06). `Strict-Transport-Security` and HTTPS on `github.io` are the host's.
- Security rules with nothing to apply to, because there is no server, account, cookie or upload: SE-03 to SE-08, SE-10, SE-12, SE-13. Release rules with nothing to apply to, for the same reason: DR-06 to DR-08, DR-10, DR-12.
- Threat register (SE-16). There is no flow that creates value or costs money, so no anti-automation limit applies.

| Id | Asset | Actor and path | Impact | Mitigation | Covered by |
|---|---|---|---|---|---|
| T-01 | customer data | hostile text in a field runs as code | data read or changed | no HTML sinks, CSP | SE-01, JS-10, R-22 |
| T-02 | customer data | another page on the same origin reads the key | data read | open, see below | LD-09, this ADR |
| T-03 | customer data | data in an address, title or error reaches history, screenshots or a shared link | disclosure | ids only, fixed titles, fixed messages | R-31, EO-07 |
| T-04 | customer data | a third-party script or font | data sent away | no dependencies, CSP | JS-18, ADR-001 |
| T-05 | stored data | a bad write or a newer build overwrites data | data lost | write lock, shape check | R-20, ADR-004 |
| T-06 | delete actions | the page framed by another site and clicked through | a record deleted | a confirmation on every delete; framing itself accepted | R-04, R-08 |
| T-07 | customer data | another person at the same machine | data read | out of scope by A-01; erase exists | A-01, R-32 |

## Consequences
- The policy is checked by reading one line, and it needs no server.
- A builder cannot use an inline style or script, and a designer cannot use an external font or image.
- A change of repository name or owner changes the origin and leaves the stored data behind, because `localStorage` belongs to the origin.
- An agent that hits the edge of this decision writes NEEDS HUMAN and stops.

## Not decided here
- T-02, the origin itself. NEEDS HUMAN: on `https://<owner>.github.io/<repo>/`, any other project site of the same owner runs on the same origin and can read this app's data. It is harmless with invented data or if the owner has no other site there. For real customer data, the human chooses the origin: a custom domain for this site, or a GitHub account or organisation that hosts nothing else. A user site named `<owner>.github.io` does not help, because it is that same origin. Either choice is a devops change and needs no code change.
- The repository owner and name: the devops role reads them from the remote.
- Release steps, version numbers and the checklist (DR-09, DR-11, DR-15): `docs/RUNBOOK.md` and the devops role.

## Answered
Q: T-02, the origin: may the app run on the shared origin https://ioanbitza.github.io/ as a project site?  A (2026-10-30, Ioan Bita): "Yes. The published site is a demo with invented data; anyone who keeps real customer data runs the app from localhost or from an origin of their own. The runbook says so."
