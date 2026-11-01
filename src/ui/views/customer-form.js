import { createCustomer, updateCustomer } from '../../domain/customers.js';
import { routeToHash } from '../router.js';
import { actionButton, element, field, heading, linkButton, panel } from './components.js';
import { renderNotFound } from './not-found.js';

const FIELDS = ['name', 'email', 'phone', 'address'];
const EMPTY_VALUES = Object.freeze({ name: '', email: '', phone: '', address: '' });

function control(name, value) {
  const node = name === 'address' ? element('textarea') : element('input');
  if (name === 'address') node.rows = 3;
  else node.type = name === 'name' ? 'text' : name === 'phone' ? 'tel' : 'email';
  node.name = name;
  node.value = value;
  return node;
}

function fieldFor(name, label, required, values, errors) {
  const error = errors.find((item) => item.field === name);
  return field({
    id: `customer-${name}`,
    label,
    required,
    control: control(name, values[name]),
    error: error ? error.message : '',
  });
}

function readValues(form) {
  const values = {};
  for (const name of FIELDS) values[name] = form.elements[name].value;
  return values;
}

function buildForm(values, errors, cancelHref) {
  const form = element('form');
  form.noValidate = true;
  form.autocomplete = 'off';
  const pair = element('div', 'form-pair');
  pair.append(fieldFor('email', 'Email', false, values, errors), fieldFor('phone', 'Phone', false, values, errors));
  const buttons = element('div', 'button-row');
  const save = actionButton('Save customer', 'primary');
  save.type = 'submit';
  const cancel = linkButton('Cancel', cancelHref, 'secondary');
  cancel.dataset.action = 'cancel';
  buttons.append(save, cancel);
  form.append(fieldFor('name', 'Name', true, values, errors), pair, fieldFor('address', 'Address', false, values, errors), buttons);
  return form;
}

function targets(route) {
  if (route.name === 'customer-edit') {
    const hash = routeToHash({ name: 'customer', id: route.id });
    return { cancel: hash, saved: hash };
  }
  return { cancel: '#/customers', saved: '#/customers' };
}

function startValues(route, data) {
  if (route.name === 'customer-new') return { ...EMPTY_VALUES };
  const customer = data.customers.find((item) => item.id === route.id);
  if (!customer) return null;
  return { name: customer.name, email: customer.email, phone: customer.phone, address: customer.address };
}

function runSave(route, data, values, deps) {
  return route.name === 'customer-new'
    ? createCustomer(data, values, deps)
    : updateCustomer(data, { id: route.id, ...values }, deps);
}

/** Screen 7.2: create or edit a customer; errors show at once, a failed save keeps what was typed (R-01, R-02, R-17, R-21). */
export function renderCustomerForm(container, viewModel, actions) {
  const { route } = viewModel;
  const { commit, showBanner, deps, setForm } = actions;
  const snapshot = startValues(route, viewModel.data);
  if (snapshot === null) return renderNotFound(container);
  const where = targets(route);
  const h1 = heading(route.name === 'customer-new' ? 'New customer' : 'Edit customer');
  const box = panel('panel-form');
  const region = actions.bannerRegion();
  let form = null;
  let lastFocused = null;

  function show(values, errors) {
    const next = buildForm(values, errors, where.cancel);
    if (form) form.replaceWith(next);
    else box.append(next);
    form = next;
  }

  /** One delegated listener per event type on the panel, which outlives every re-drawn form (ADR-003). */
  box.addEventListener('submit', onSubmit);
  box.addEventListener('focusin', (event) => {
    lastFocused = event.target.id;
  });
  box.addEventListener('click', (event) => {
    if (event.target.closest('a[data-action="cancel"]')) setForm(null);
  });

  function onSubmit(event) {
    event.preventDefault();
    const values = readValues(form);
    const result = runSave(route, viewModel.data, values, deps);
    if (!result.ok && result.errors) {
      show(values, result.errors);
      form.querySelector(`#customer-${result.errors[0].field}`).focus();
      return;
    }
    if (!result.ok) {
      renderNotFound(container);
      return;
    }
    const saved = commit(result.data, where.saved);
    if (!saved.ok) {
      showBanner(saved.code);
      form.querySelector('[type="submit"]').focus();
    }
  }

  show(snapshot, []);
  box.prepend(region);
  setForm({
    hash: location.hash,
    isDirty: () => FIELDS.some((name) => form.elements[name].value !== snapshot[name]),
    restoreFocus: () => {
      const target = lastFocused ? document.getElementById(lastFocused) : form.elements.name;
      target.focus();
    },
  });
  container.replaceChildren(h1, box);
  return h1;
}
