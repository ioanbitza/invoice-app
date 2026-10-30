#!/usr/bin/env node
// The delivery facts a static app's deployment needs, computed from the repository and never guessed: the default
// branch, the GitHub Pages URL of the origin remote, and a check of .github/workflows/pages.yml against the shape the
// devops role must write (pinned action majors, per-job permissions, the pages concurrency group, a timeout, the kit's
// folders kept out of the site).
// Usage: node delivery.mjs [url]      prints `Live: https://<owner>.github.io/<repo>/`; exit 1 with the reason when it cannot
//        node delivery.mjs branch     prints the default branch: origin/HEAD, else the current branch, else main
//        node delivery.mjs check      prints one line per problem of .github/workflows/pages.yml; nothing and exit 0 when it is right
//        --root <dir> on any of them
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { isMain } from './hook-common.mjs';

export const PAGES_WORKFLOW = '.github/workflows/pages.yml';
export const LIVE_PREFIX = 'Live: ';

/** The folders the Pages copy step must leave out: the kit's documents, tests, hooks, workflows, state and settings. */
export const EXCLUDED_FROM_SITE = ['docs/', 'tests/', '.github/', '.githooks/', '.sdlc/', '.claude/'];

/** The actions the workflow uses, each pinned to a major version (`@v4`), never to a branch or `latest`. */
export const PAGES_ACTIONS = ['actions/checkout', 'actions/configure-pages', 'actions/upload-pages-artifact', 'actions/deploy-pages'];

function git(root, ...args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

/** `{ owner, repo }` of a github.com remote in its https, ssh or scp form; null for anything else. */
export function parseGitHubRemote(url) {
  const text = String(url ?? '').trim();
  const m = text.match(/^(?:https?:\/\/(?:[^@/]+@)?github\.com\/|ssh:\/\/(?:[^@/]+@)?github\.com(?::\d+)?\/|(?:[^@/]+@)?github\.com:)([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}

/** The Pages URL of a repository: `https://<owner>.github.io/<repo>/`, or the root when the repository is the owner's `<owner>.github.io` site. */
export function pagesUrl(owner, repo) {
  const host = `${owner}.github.io`;
  return String(repo).toLowerCase() === host.toLowerCase() ? `https://${host}/` : `https://${host}/${repo}/`;
}

/** The origin remote's url, or null when the repository has none. */
export function originUrl(root) {
  return git(root, 'remote', 'get-url', 'origin');
}

/** The default branch: what origin/HEAD points at (a clone has it), else the current branch, else `main`. */
export function defaultBranch(root) {
  const head = git(root, 'rev-parse', '--abbrev-ref', 'origin/HEAD');
  if (head && head !== 'origin/HEAD') return head.replace(/^origin\//, '');
  const current = git(root, 'branch', '--show-current');
  return current || 'main';
}

/** `{ line }` with the `Live: ` line for the release text, or `{ problem }` when it cannot be computed (no workflow, no origin, not github.com). */
export function liveLine(root) {
  if (!existsSync(join(root, PAGES_WORKFLOW))) return { problem: `${PAGES_WORKFLOW} does not exist; no Pages deployment, no Live line (run /sdlc:setup-delivery to add one)` };
  const url = originUrl(root);
  if (!url) return { problem: 'git remote get-url origin failed: the repository has no origin remote, so the Pages URL cannot be computed' };
  const parsed = parseGitHubRemote(url);
  if (!parsed) return { problem: `origin is ${url}, not a github.com repository; GitHub Pages serves github.com repositories only` };
  return { line: `${LIVE_PREFIX}${pagesUrl(parsed.owner, parsed.repo)}` };
}

/**
 * What is wrong with a pages workflow text, one sentence each; empty when it has the shape the devops role must write.
 * Read by regular expressions over the lines, not a YAML parser: the kit has no dependencies.
 */
export function pagesWorkflowProblems(text) {
  const yaml = String(text ?? '');
  const problems = [];
  if (!/^on:\s*$/m.test(yaml) || !/^\s+push:\s*$/m.test(yaml)) problems.push('it does not run on push (on: push:)');
  if (!/^\s+branches:\s*\[?\s*[\w./-]+/m.test(yaml)) problems.push('push has no branches: line naming the default branch');
  if (/__DEFAULT_BRANCH__/.test(yaml)) problems.push('__DEFAULT_BRANCH__ is still a placeholder; fill in the branch node delivery.mjs branch prints');
  if (!/^\s*concurrency:\s*$/m.test(yaml) || !/^\s+group:\s*["']?pages["']?\s*$/m.test(yaml)) problems.push('no concurrency group named pages');
  if (!/^\s+timeout-minutes:\s*\d+\s*$/m.test(yaml)) problems.push('no timeout-minutes on the job');
  const permissions = yaml.match(/^(\s+)permissions:\s*\n((?:\1\s+\S.*\n?)+)/m);
  const granted = permissions ? permissions[2] : '';
  for (const need of ['contents: read', 'pages: write', 'id-token: write']) {
    if (!new RegExp(`^\\s+${need.replace(/[-]/g, '\\-')}\\s*$`, 'm').test(granted)) problems.push(`permissions lack ${need} (per job: contents: read, pages: write, id-token: write)`);
  }
  if (/^permissions:\s*\n(\s+\S.*\n?)*?\s+(?:pages|id-token):\s*write/m.test(yaml)) problems.push('write permissions are granted to the whole workflow; declare them on the deploy job only (DR-13)');
  for (const action of PAGES_ACTIONS) {
    const use = yaml.match(new RegExp(`uses:\\s*${action.replace(/[./-]/g, '\\$&')}@(\\S+)`));
    if (!use) problems.push(`${action} is not used`);
    else if (!/^v\d+(?:\.\d+)*$/.test(use[1]) && !/^[0-9a-f]{40}$/.test(use[1])) problems.push(`${action} is pinned to "${use[1]}", not a major version or a commit sha (DR-04)`);
  }
  for (const folder of EXCLUDED_FROM_SITE) {
    if (!new RegExp(`--exclude[= ]['"]?${folder.replace(/[./]/g, '\\$&')}`).test(yaml)) problems.push(`${folder} is not excluded from the site (--exclude ${folder})`);
  }
  if (/\bnpm (?:ci|install|run build)\b|\byarn\b|\bpnpm\b/.test(yaml)) problems.push('the workflow runs a build step; the app is static files served as they are');
  return problems;
}

/** The problems of the project's own pages workflow; one problem when the file is missing. */
export function checkPagesWorkflow(root) {
  const path = join(root, PAGES_WORKFLOW);
  if (!existsSync(path)) return [`${PAGES_WORKFLOW} does not exist`];
  return pagesWorkflowProblems(readFileSync(path, 'utf8'));
}

function cli(argv) {
  const rootIdx = argv.indexOf('--root');
  const root = resolve(rootIdx >= 0 ? argv[rootIdx + 1] : process.cwd());
  const command = argv.find((a, i) => !a.startsWith('--') && (rootIdx < 0 || i !== rootIdx + 1)) ?? 'url';
  if (command === 'branch') {
    console.log(defaultBranch(root));
    return 0;
  }
  if (command === 'check') {
    const problems = checkPagesWorkflow(root);
    for (const p of problems) console.log(`${PAGES_WORKFLOW}: ${p}`);
    return problems.length ? 1 : 0;
  }
  if (command === 'url') {
    const live = liveLine(root);
    if (live.problem) {
      console.error(live.problem);
      return 1;
    }
    console.log(live.line);
    return 0;
  }
  console.error('Usage: node delivery.mjs [url|branch|check] [--root <project dir>]');
  return 2;
}

if (isMain(import.meta.url)) process.exit(cli(process.argv.slice(2)));
