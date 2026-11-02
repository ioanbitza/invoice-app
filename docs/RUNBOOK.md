# Runbook

How this app is run, checked and deployed. Written by the devops role (`/sdlc:setup-delivery`); the human edits it when the facts change.

## Run locally

The app is static files (`index.html`, `styles.css`, `src/`) with no build step. From the repository root:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/`. Stop the server with Ctrl-C.

## The CI gate

`.github/workflows/gate.yml` runs on every push and pull request: `node sdlc/tools/gate.mjs --strict`, the same gate the hooks run, with the manual checks required ticked, the review bound to `HEAD`, every planted defect caught: tests, scope, trace, contract, secrets, dependencies, commit message, the review binding and the mutations. A red gate blocks the merge. The file holds the kit's template; the devops role never edits it.

## Deployment to GitHub Pages

`.github/workflows/pages.yml` runs on every push to `main`. It copies the repository root without `docs/`, `tests/`, `sdlc/`, `.github/`, `.githooks/`, `.sdlc/` and `.claude/`, uploads the copy as the Pages artifact and deploys it. The site is served at:

https://ioanbitza.github.io/invoice-app/

The URL also appears on each run of the `pages` workflow (Actions tab, job `deploy`, the `github-pages` environment link) and under Settings > Pages.

### Once, by hand

GitHub Pages must be switched on by a repository admin, once: Settings > Pages > Build and deployment > Source: **GitHub Actions**. Until that is done the `deploy` job fails at `configure-pages` with a message that Pages is not enabled for the repository. No secret and no token is needed: the workflow uses the job's own `id-token` permission.

## Roll back

Revert the commit that broke the site and push the revert to `main`; the `pages` workflow redeploys the previous files. Nothing is rebuilt and no manual step is needed.

```sh
git revert <sha>
git push
```

The human runs these: the kit's agents never revert or push (ADR-002).

Last rehearsal: not yet. After the first rehearsal write the date and the name here (DR-09).

## Logs

The Actions tab holds the log of every gate and every deployment. The person who merged the change looks at the run that follows it.

## About the data on the published site

The published site is a demo with invented data (ADR-008). On `https://ioanbitza.github.io/` every project site of the same owner shares one origin, and so one `localStorage`. Anyone who keeps real customer data runs the app from `localhost` or from an origin of their own.
