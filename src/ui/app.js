import { createStore } from '../storage/store.js';
import { renderCustomers } from './customers-view.js';

const store = createStore(window.localStorage);
const banner = document.getElementById('banner');
const main = document.getElementById('main');
const loadResult = store.load();
const locked = !loadResult.ok;

const emptyState = { version: 1, nextOrderNumber: 1, customers: [], orders: [] };

function showError(message) {
  banner.textContent = message;
  banner.hidden = false;
}

function clearError() {
  banner.textContent = '';
  banner.hidden = true;
}

function disableForms() {
  for (const control of main.querySelectorAll('input, button, select, textarea')) {
    control.disabled = true;
  }
}

function render() {
  const state = store.current() ?? emptyState;
  renderCustomers(main, { state, commit, showError, newId: () => crypto.randomUUID() });
  if (locked) disableForms();
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

if (locked) showError(loadResult.error);
render();
