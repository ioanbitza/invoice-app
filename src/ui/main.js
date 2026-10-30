import { openBrowserStorage } from '../storage/storage.js';
import { todayIso } from '../domain/dates.js';
import { createNameCompare } from './format.js';
import { parseRoute, routeTitle } from './router.js';
import { banner, bannerRegion, fillDialog, setBanner } from './views/components.js';
import { renderBlocked } from './views/blocked.js';
import { renderCustomerDetail } from './views/customer-detail.js';
import { renderCustomerForm } from './views/customer-form.js';
import { renderCustomerList } from './views/customer-list.js';
import { renderNotFound } from './views/not-found.js';
import { renderOrderForm } from './views/order-form.js';
import { renderOrderList } from './views/order-list.js';
import { renderOrderView } from './views/order-view.js';

/** The texts a user sees with a code (ADR-007). Failure texts end with the code. */
const CODES = Object.freeze({
  'STO-01': { variant: 'danger', text: "Your browser's storage is full, so this was not saved. Deleting data frees space. (STO-01)" },
  'STO-02': {
    variant: 'danger',
    text: "Your browser's storage is unavailable, so this was not saved. Allow storage for this site, or delete data to free space, then try again. (STO-02)",
    screen: {
      title: 'Browser storage cannot be used',
      text: "Your browser's storage is unavailable. Allow storage for this site, then reload the page. (STO-02)",
    },
  },
  'STO-03': {
    variant: 'danger',
    text: 'The saved data cannot be read. (STO-03)',
    screen: {
      title: 'The saved data cannot be read',
      text: 'Nothing has been changed. Copy the stored text to keep it, or start with empty data. (STO-03)',
    },
  },
  'STO-04': {
    variant: 'danger',
    text: 'The saved data is from a newer version of the app. (STO-04)',
    screen: {
      title: 'This data is from a newer version',
      text: 'It was saved by a newer version of the app, and nothing has been changed. Copy the stored text to keep it, or start with empty data. (STO-04)',
    },
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
const LOAD_FAILURE_CODES = Object.freeze({ corrupt: 'STO-03', newer: 'STO-04', unavailable: 'STO-02' });
const FORM_ROUTES = Object.freeze(['customer-new', 'customer-edit', 'order-new', 'customer-order-new', 'order-edit']);
const FIRST_FIELD = 'input:not([type="hidden"]):not([readonly]):not([disabled]), select:not([disabled]), textarea:not([readonly]):not([disabled])';
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
const SCREENS = { customers: renderCustomerList, customer: renderCustomerDetail, 'customer-new': renderCustomerForm, 'customer-edit': renderCustomerForm, orders: renderOrderList,
  'order-new': renderOrderForm, 'customer-order-new': renderOrderForm, 'order-edit': renderOrderForm, order: renderOrderView };
/** `today` is read on every use, so a page left open past midnight does not keep yesterday (ADR-003, ADR-007). `now` stays for views that still read the clock. */
const deps = {
  newId: () => crypto.randomUUID(),
  now: () => Date.now(),
  get today() {
    return todayIso(() => Date.now());
  },
};

function bannerFor(code) {
  return CODES[code];
}

function screenFor(reason) {
  return CODES[LOAD_FAILURE_CODES[reason]].screen;
}

/**
 * The one write path (R-21, ADR-003): save first, change state only when the save worked.
 * With `hash` it then navigates and renders; without it the caller stays on its screen.
 */
function commit(nextData, hash) {
  const saved = storage.save(nextData);
  if (!saved.ok) return { ok: false, code: SAVE_FAILURE_CODES[saved.reason] };
  state.data = nextData;
  if (hash !== undefined) goTo(hash);
  return { ok: true };
}

function goTo(hash) {
  state.form = null;
  if (location.hash === hash) render();
  else location.hash = hash;
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
  return renderBlocked(mainElement, state.blocked, { startEmpty, bannerFor, screenFor });
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
  const h1 = screen(mainElement, { route, state, compareNames, commit, openDialog, bannerRegion, eraseAll, showBanner, deps });
  if (h1.dataset.screen === 'not-found') showAsNotFound();
  return h1;
}

/** A screen that found no record renders not-found itself; the title and the nav follow it (R-28, UI-SPEC 7.7). */
function showAsNotFound() {
  state.route = { name: 'not-found' };
  markNav(state.route);
  document.title = routeTitle(state.route);
}

function focusStart(h1) {
  const field = FORM_ROUTES.includes(state.route?.name) ? mainElement.querySelector(FIRST_FIELD) : null;
  (field ?? h1).focus();
}

function render() {
  renderedHash = location.hash;
  if (state.blocked) renderBlockedScreen().focus();
  else focusStart(renderRoute());
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
