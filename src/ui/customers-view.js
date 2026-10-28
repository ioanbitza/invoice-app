import {
  addCustomer, updateCustomer, deleteCustomer, searchCustomers, sortCustomers,
} from '../domain/customers.js';
import { ordersOfCustomer } from '../domain/orders.js';
import { formatEuros } from '../domain/money.js';

const view = { mode: 'list', customerId: null, search: '' };

function el(tag, text, attributes = {}) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  return node;
}

function button(label, onClick, type = 'button') {
  const node = el('button', label, { type });
  node.addEventListener('click', onClick);
  return node;
}

function show(root, ctx, mode, customerId = null) {
  view.mode = mode;
  view.customerId = customerId;
  renderCustomers(root, ctx);
}

export function renderCustomers(root, ctx) {
  const customer = ctx.state.customers.find((c) => c.id === view.customerId);
  if (view.mode !== 'list' && view.customerId && !customer) {
    view.mode = 'list';
    view.customerId = null;
  }
  if (view.mode === 'form') root.replaceChildren(buildForm(root, ctx, customer));
  else if (view.mode === 'detail') root.replaceChildren(buildDetail(root, ctx, customer));
  else root.replaceChildren(buildList(root, ctx));
}

function buildList(root, ctx) {
  const section = el('section');
  section.append(el('h2', 'Customers'));
  const search = el('input', '', { type: 'search', 'aria-label': 'Search customers', value: view.search });
  const toolbar = el('div', '', { class: 'toolbar' });
  toolbar.append(search, button('Add customer', () => show(root, ctx, 'form')));
  const results = el('div');
  const fill = () => results.replaceChildren(buildResults(root, ctx));
  search.addEventListener('input', () => {
    view.search = search.value;
    fill();
  });
  fill();
  section.append(toolbar, results);
  return section;
}

function buildResults(root, ctx) {
  if (ctx.state.customers.length === 0) {
    return el('p', 'No customers yet. Use "Add customer" to create the first one.', { class: 'empty' });
  }
  const found = sortCustomers(searchCustomers(ctx.state.customers, view.search));
  if (found.length === 0) return el('p', 'No customers match your search.', { class: 'empty' });
  const table = el('table');
  const head = el('tr');
  head.append(el('th', 'Name'), el('th', 'Email'), el('th', 'Phone'));
  table.append(head);
  for (const customer of found) {
    const row = el('tr');
    const nameCell = el('td');
    nameCell.append(button(customer.name, () => show(root, ctx, 'detail', customer.id)));
    nameCell.firstChild.className = 'link';
    row.append(nameCell, el('td', customer.email), el('td', customer.phone));
    table.append(row);
  }
  return table;
}

function buildDetail(root, ctx, customer) {
  const section = el('section');
  const back = button('Back', () => show(root, ctx, 'list'));
  back.className = 'link';
  section.append(back, el('h2', customer.name));
  const fields = el('dl');
  fields.append(el('dt', 'Email'), el('dd', customer.email), el('dt', 'Phone'), el('dd', customer.phone));
  const actions = el('div', '', { class: 'actions' });
  actions.append(
    button('Edit', () => show(root, ctx, 'form', customer.id)),
    button('Delete', () => removeCustomer(root, ctx, customer)),
  );
  section.append(fields, actions, el('h3', 'Orders'), buildCustomerOrders(ctx, customer));
  return section;
}

function buildCustomerOrders(ctx, customer) {
  const orders = ordersOfCustomer(ctx.state, customer.id);
  if (orders.length === 0) return el('p', 'This customer has no orders yet.', { class: 'empty' });
  const table = el('table');
  const head = el('tr');
  head.append(el('th', 'Order'), el('th', 'Date'), el('th', 'Total', { class: 'amount' }));
  table.append(head);
  for (const order of orders) {
    const row = el('tr');
    row.append(el('td', `#${order.number}`), el('td', order.date),
      el('td', formatEuros(order.totalCents), { class: 'amount' }));
    table.append(row);
  }
  return table;
}

function removeCustomer(root, ctx, customer) {
  if (!window.confirm(`Delete customer "${customer.name}"?`)) return;
  const result = deleteCustomer(ctx.state, customer.id);
  if (!result.ok) {
    ctx.showError(result.errors.orders);
    return;
  }
  if (ctx.commit(result).ok) show(root, ctx, 'list');
}

function buildField(name, label, value) {
  const wrapper = el('div', '', { class: 'field' });
  const input = el('input', '', { id: `field-${name}`, name, type: 'text', value });
  const message = el('span', '', { class: 'error', id: `error-${name}` });
  input.setAttribute('aria-describedby', message.id);
  wrapper.append(el('label', label, { for: input.id }), input, message);
  return wrapper;
}

function buildForm(root, ctx, customer) {
  const form = el('form', '', { novalidate: '' });
  const title = customer ? 'Edit customer' : 'Add customer';
  form.append(el('h2', title));
  form.append(
    buildField('name', 'Name', customer?.name ?? ''),
    buildField('email', 'Email', customer?.email ?? ''),
    buildField('phone', 'Phone', customer?.phone ?? ''),
  );
  const actions = el('div', '', { class: 'actions' });
  actions.append(
    el('button', 'Save', { type: 'submit' }),
    button('Cancel', () => show(root, ctx, customer ? 'detail' : 'list', customer?.id ?? null)),
  );
  form.append(actions);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitForm(root, ctx, form, customer);
  });
  return form;
}

function submitForm(root, ctx, form, customer) {
  const input = {
    name: form.elements.name.value,
    email: form.elements.email.value,
    phone: form.elements.phone.value,
  };
  const result = customer
    ? updateCustomer(ctx.state, customer.id, input)
    : addCustomer(ctx.state, input, ctx.newId());
  const outcome = ctx.commit(result);
  if (outcome.ok) {
    show(root, ctx, 'list');
    return;
  }
  for (const name of ['name', 'email', 'phone']) {
    form.querySelector(`#error-${name}`).textContent = outcome.errors?.[name] ?? '';
  }
}
