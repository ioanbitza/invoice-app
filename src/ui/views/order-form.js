import { customerLabel, listCustomers } from '../../domain/customers.js';
import { createOrder, updateOrder } from '../../domain/orders.js';
import { routeToHash } from '../router.js';
import { actionButton, element, emptyState, field, heading, linkButton, panel } from './components.js';
import { renderNotFound } from './not-found.js';

const NOTES_HELPER = 'Up to 500 characters. Keep details about other people out of this field.';
const NO_CUSTOMERS = {
  text: 'Add a customer first. Every order belongs to one.',
  action: { label: 'New customer', variant: 'primary', href: '#/customers/new' },
};

function readOnlyInput(value, extraClass) {
  const node = element('input', extraClass);
  node.type = 'text';
  node.readOnly = true;
  node.value = value;
  return node;
}

function pickerControl(customers, value) {
  const select = element('select');
  select.name = 'customerId';
  const first = element('option', '', 'Choose a customer');
  first.value = '';
  select.append(first);
  for (const customer of customers) {
    const option = element('option', '', customerLabel(customer));
    option.value = customer.id;
    select.append(option);
  }
  select.value = value;
  return select;
}

function dateControl(value) {
  const node = element('input');
  node.type = 'date';
  node.name = 'date';
  node.value = value;
  return node;
}

function notesControl(value) {
  const node = element('textarea');
  node.rows = 4;
  node.name = 'notes';
  node.value = value;
  return node;
}

function errorOf(errors, name) {
  const found = errors.find((item) => item.field === name);
  return found ? found.message : '';
}

function customerField(setup, values, errors) {
  if (setup.pickable) {
    return field({
      id: 'order-customerId',
      label: 'Customer',
      required: true,
      control: pickerControl(setup.customers, values.customerId),
      error: errorOf(errors, 'customerId'),
    });
  }
  const fixed = field({
    id: 'order-customerId',
    label: 'Customer',
    required: false,
    control: readOnlyInput(setup.customerText),
    helper: setup.isEdit ? 'To move an order, delete it and create a new one.' : '',
  });
  fixed.querySelector('label').textContent = 'Customer';
  return fixed;
}

function numberField(setup) {
  const fixed = field({
    id: 'order-number',
    label: 'Number',
    required: false,
    control: readOnlyInput(setup.number, 'mono'),
    helper: 'The number does not change.',
  });
  fixed.querySelector('label').textContent = 'Number';
  return fixed;
}

function buildForm(setup, values, errors) {
  const form = element('form');
  form.noValidate = true;
  form.autocomplete = 'off';
  const parts = [];
  if (setup.isEdit) parts.push(numberField(setup));
  parts.push(
    customerField(setup, values, errors),
    field({ id: 'order-date', label: 'Date', required: true, control: dateControl(values.date), error: errorOf(errors, 'date') }),
    field({ id: 'order-notes', label: 'Notes', required: false, control: notesControl(values.notes), helper: NOTES_HELPER, error: errorOf(errors, 'notes') }),
  );
  const buttons = element('div', 'button-row');
  const save = actionButton('Save order', 'primary');
  save.type = 'submit';
  const cancel = linkButton('Cancel', setup.cancel, 'secondary');
  cancel.dataset.action = 'cancel';
  buttons.append(save, cancel);
  form.append(...parts, buttons);
  return form;
}

/** The three forms of screen 7.5; null when the customer or order of the address does not exist. */
function setupFor(route, data, compareNames, today) {
  if (route.name === 'order-new') {
    return {
      pickable: true,
      customers: listCustomers(data, compareNames),
      cancel: '#/orders',
      start: { customerId: '', date: today, notes: '' },
    };
  }
  if (route.name === 'customer-order-new') {
    const customer = data.customers.find((item) => item.id === route.id);
    if (!customer) return null;
    return {
      pickable: false,
      customerText: customerLabel(customer),
      cancel: routeToHash({ name: 'customer', id: customer.id }),
      start: { customerId: customer.id, date: today, notes: '' },
    };
  }
  const order = data.orders.find((item) => item.id === route.id);
  if (!order) return null;
  const customer = data.customers.find((item) => item.id === order.customerId);
  return {
    pickable: false,
    isEdit: true,
    number: order.number,
    customerText: customerLabel(customer),
    cancel: routeToHash({ name: 'order', id: order.id }),
    start: { customerId: order.customerId, date: order.date, notes: order.notes },
  };
}

function readValues(form, setup) {
  const values = { customerId: setup.start.customerId, date: form.elements.date.value, notes: form.elements.notes.value };
  if (setup.pickable) values.customerId = form.elements.customerId.value;
  return values;
}

function runSave(route, data, values, deps) {
  if (route.name === 'order-edit') return updateOrder(data, { id: route.id, date: values.date, notes: values.notes }, deps);
  return createOrder(data, values, deps);
}

function savedHash(route, after) {
  if (route.name === 'order-edit') return routeToHash({ name: 'order', id: route.id });
  return routeToHash({ name: 'order', id: after.orders[after.orders.length - 1].id });
}

/** Screen 7.5: start an order or change its date and notes; a failed save keeps what was typed (R-06, R-07, R-17, R-18, R-21). */
export function renderOrderForm(container, viewModel, actions) {
  const { route, compareNames } = viewModel;
  const { commit, showBanner, setForm, deps } = actions;
  const setup = setupFor(route, viewModel.data, compareNames, deps.today);
  if (setup === null) return renderNotFound(container);
  const h1 = heading(route.name === 'order-edit' ? 'Edit order' : 'New order');
  const box = panel('panel-form');
  if (setup.pickable && setup.customers.length === 0) {
    box.append(emptyState(NO_CUSTOMERS));
    container.replaceChildren(h1, box);
    return h1;
  }
  const region = actions.bannerRegion();
  let form = null;
  let lastFocused = null;

  function show(values, errors) {
    const next = buildForm(setup, values, errors);
    if (form) form.replaceWith(next);
    else box.append(next);
    form = next;
  }

  function onSubmit(event) {
    event.preventDefault();
    const values = readValues(form, setup);
    const result = runSave(route, viewModel.data, values, deps);
    if (!result.ok && result.errors) {
      show(values, result.errors);
      form.querySelector(`#order-${result.errors[0].field}`).focus();
      return;
    }
    if (!result.ok) {
      renderNotFound(container);
      return;
    }
    const saved = commit(result.data, savedHash(route, result.data));
    if (!saved.ok) {
      showBanner(saved.code);
      form.querySelector('[type=submit]').focus();
    }
  }

  box.addEventListener('submit', onSubmit);
  box.addEventListener('focusin', (event) => {
    lastFocused = event.target.id;
  });
  box.addEventListener('click', (event) => {
    if (event.target.closest('a[data-action="cancel"]')) setForm(null);
  });
  show(setup.start, []);
  box.prepend(region);
  setForm({
    hash: location.hash,
    isDirty: () => {
      const now = readValues(form, setup);
      return Object.keys(now).some((name) => now[name] !== setup.start[name]);
    },
    restoreFocus: () => {
      const target = lastFocused ? document.getElementById(lastFocused) : form.querySelector('select, input[name="date"]');
      target.focus();
    },
  });
  container.replaceChildren(h1, box);
  return h1;
}
