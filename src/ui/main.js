import { openBrowserStorage } from '../storage/storage.js';
import { createNameCompare } from './format.js';
import { parseRoute, routeTitle } from './router.js';
import { banner, bannerRegion, fillDialog, setBanner } from './views/components.js';
import { renderBlocked } from './views/blocked.js';
import { renderCustomerDetail } from './views/customer-detail.js';
import { renderCustomerForm } from './views/customer-form.js';
import { renderCustomerList } from './views/customer-list.js';
import { renderNotFound } from './views/not-found.js';
import { renderOrderList } from './views/order-list.js';

/** The texts a user sees with a code (ADR-007). Failure texts end with the code. */
const CODES = Object.freeze({
  'STO-01': { variant: 'danger', text: "Your browser's storage is full, so this was not saved. Deleting data frees space. (STO-01)" },
  'STO-02': {
    variant: 'danger',
    text: "Your browser's storage is unavailable, so this was not saved. Allow storage for this site, or delete data to free space, then try again. (STO-02)",
  },
  'STO-05': {
    variant: 'danger',
    text: 'Changes are locked because the saved data could not be read. Reload the page. (STO-05)',
    action: { label: 'Reload', name: 'reload' },
  },
  'APP-01': {
    variant: 'danger',
    text: 'Something went wrong and the last action may not have finished. Reload the page. (APP-01)',
    action: { label: 'Reload', name: 'reload' },
  },
});

const SAVE_FAILURE_CODES = Object.freeze({ quota: 'STO-01', unavailable: 'STO-02', blocked: 'STO-05' });
const BLOCKED_TITLE = 'Data problem - Invoice app';

const storage = openBrowserStorage();
const compareNames = createNameCompare(navigator.language);
const mainElement = document.getElementById('main');
const dialog = document.getElementById('dialog');
const header = document.getElementById('app-header');

/** The one owner of UI state (ADR-003). `form` is set by a screen with an open form: { hash, isDirty, restoreFocus }. */
const state = { data: null, blocked: null, route: null, form: null, searchCustomers: '', searchOrders: '' };
let renderedHash = null;

/** Screens by route name; a route with no screen yet renders the not-found screen. */
const SCREENS = { customers: renderCustomerList, customer: renderCustomerDetail, 'customer-new': renderCustomerForm, 'customer-edit': renderCustomerForm, orders: renderOrderList };
const deps = { newId: () => crypto.randomUUID() };

function bannerFor(code) {
  return CODES[code];
}

/** The one write path (R-21): save first, change state only when the save worked. */
function commit(nextData) {
  const saved = storage.save(nextData);
  if (!saved.ok) return { ok: false, code: SAVE_FAILURE_CODES[saved.reason] };
  state.data = nextData;
  return { ok: true };
}

function showBanner(code) {
  const region = document.querySelector('[data-banner-region]');
  if (region) return setBanner(region, bannerFor(code)).focus();
  const node = banner(bannerFor(code));
  mainElement.prepend(node);
  return node.focus();
}

function openDialog(content, opener, handlers) {
  const safe = fillDialog(dialog, content);
  dialog.returnValue = '';
  dialog.onclose = () => {
    if (dialog.returnValue === 'confirm') handlers.onConfirm();
    else if (handlers.onSafe) handlers.onSafe();
    else if (opener) opener.focus();
  };
  dialog.showModal();
  safe.focus();
}

dialog.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-dialog]');
  if (button) dialog.close(button.dataset.dialog);
});

function startEmpty({ opener, onFailed }) {
  const text = state.blocked.reason === 'unavailable'
    ? 'The old data will be lost for good.'
    : 'The old data will be lost for good. Copy the stored text first if you may need it.';
  const content = { title: 'Start with empty data?', text, safeLabel: 'Cancel', confirmLabel: 'Start with empty data' };
  openDialog(content, opener, {
    onConfirm: () => {
      const erased = storage.erase();
      if (!erased.ok) {
        onFailed('STO-02');
        return;
      }
      state.data = erased.data;
      state.blocked = null;
      location.replace('#/customers');
      render();
    },
  });
}

const ERASE_DIALOG = Object.freeze({
  title: 'Erase all data?',
  text: 'All customers and orders on this device will be gone for good, and order numbers start again at ORD-0001.',
  safeLabel: 'Cancel',
  confirmLabel: 'Erase all data',
});

/** R-32: erase the stored document after a confirmation, then land on the empty customer list. */
function eraseAll(opener) {
  openDialog(ERASE_DIALOG, opener, {
    onConfirm: () => {
      const erased = storage.erase();
      if (!erased.ok) {
        showBanner('STO-02');
        return;
      }
      state.data = erased.data;
      state.searchCustomers = '';
      state.searchOrders = '';
      location.replace('#/customers');
      render();
    },
  });
}

function markNav(route) {
  const section = route.name === 'not-found' ? null : route.name.startsWith('customer') ? 'customers' : 'orders';
  for (const link of header.querySelectorAll('[data-nav]')) {
    if (link.dataset.nav === section) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}

function renderBlockedScreen() {
  header.hidden = true;
  document.title = BLOCKED_TITLE;
  return renderBlocked(mainElement, state.blocked, { startEmpty, bannerFor });
}

function renderRoute() {
  header.hidden = false;
  const parsed = parseRoute(location.hash);
  const route = SCREENS[parsed.name] ? parsed : { name: 'not-found' };
  state.route = route;
  markNav(route);
  document.title = routeTitle(route);
  state.form = null;
  const screen = SCREENS[route.name] ?? renderNotFound;
  return screen(mainElement, { route, state, compareNames, commit, openDialog, bannerRegion, eraseAll, showBanner, deps });
}

function render() {
  renderedHash = location.hash;
  const h1 = state.blocked ? renderBlockedScreen() : renderRoute();
  h1.focus();
}

function askToDiscard(form) {
  const content = {
    title: 'Discard your changes?',
    text: 'What you typed has not been saved.',
    safeLabel: 'Keep editing',
    confirmLabel: 'Discard changes',
  };
  openDialog(content, null, {
    onConfirm: () => render(),
    onSafe: () => {
      location.hash = form.hash;
      form.restoreFocus();
    },
  });
}

function onHashChange() {
  if (location.hash === renderedHash) return;
  const form = state.form;
  if (form && form.isDirty()) askToDiscard(form);
  else render();
}

function start() {
  const loaded = storage.load();
  if (loaded.ok) state.data = loaded.data;
  else state.blocked = { reason: loaded.reason, text: loaded.text ?? '' };
  if (location.hash === '') location.replace('#/customers');
  window.addEventListener('hashchange', onHashChange);
  document.body.addEventListener('click', (event) => {
    if (event.target.closest('button[data-action="reload"]')) location.reload();
  });
  window.addEventListener('error', () => showBanner('APP-01'));
  window.addEventListener('unhandledrejection', () => showBanner('APP-01'));
  render();
}

start();
