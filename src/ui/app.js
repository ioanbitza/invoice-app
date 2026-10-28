import { createStore } from '../storage/store.js';
import { renderCustomers } from './customers-view.js';
import { renderOrders } from './orders-view.js';

const store = createStore(window.localStorage);
const banner = document.getElementById('banner');
const main = document.getElementById('main');
const tabs = {
  customers: document.getElementById('tab-customers'),
  orders: document.getElementById('tab-orders'),
};
const loadResult = store.load();
const locked = !loadResult.ok;
let activeTab = 'customers';

// The views hold on to this object, so `state` is always read live from the store.
const ctx = {
  get state() { return store.current(); },
  commit,
  rerender: render,
  showError,
  newId: () => crypto.randomUUID(),
};

function showError(message) {
  banner.textContent = message;
  banner.hidden = false;
}

function clearError() {
  banner.textContent = '';
  banner.hidden = true;
}

function showLockedMessage() {
  const message = document.createElement('p');
  message.className = 'empty';
  message.textContent = 'Your stored data could not be loaded, so nothing is shown. It has not been changed.';
  main.replaceChildren(message);
}

function render() {
  for (const [name, tab] of Object.entries(tabs)) {
    tab.setAttribute('aria-pressed', String(name === activeTab));
  }
  if (locked) showLockedMessage();
  else if (activeTab === 'orders') renderOrders(main, ctx);
  else renderCustomers(main, ctx);
}

// Saves a successful domain result and re-renders. A failed domain result is
// returned to the caller so the form can show its field messages.
function commit(result) {
  if (!result.ok) return result;
  const saved = store.save(result.state);
  if (!saved.ok) {
    showError(saved.error);
    return { ok: false, errors: {} };
  }
  clearError();
  render();
  return { ok: true };
}

function switchTab(name) {
  activeTab = name;
  render();
}

tabs.customers.addEventListener('click', () => switchTab('customers'));
tabs.orders.addEventListener('click', () => switchTab('orders'));

if (locked) showError(loadResult.error);
render();
