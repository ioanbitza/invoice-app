import {
  addOrder, updateOrderDate, deleteOrder, filterOrders,
} from '../domain/orders.js';
import { orderTotalCents, formatEuros } from '../domain/money.js';
import { sortCustomers } from '../domain/customers.js';
import { el, button, renderLines } from './lines-view.js';

const view = { mode: 'list', orderId: null, customerId: '', text: '' };

function todayLocal() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function show(root, ctx, mode, orderId = null) {
  view.mode = mode;
  view.orderId = orderId;
  renderOrders(root, ctx);
}

function customerName(ctx, id) {
  return ctx.state.customers.find((c) => c.id === id)?.name ?? 'Unknown customer';
}

export function renderOrders(root, ctx) {
  const order = ctx.state.orders.find((o) => o.id === view.orderId);
  if (view.mode === 'detail' && !order) view.mode = 'list';
  if (view.mode === 'form') root.replaceChildren(buildNewForm(root, ctx));
  else if (view.mode === 'detail') root.replaceChildren(buildDetail(root, ctx, order));
  else root.replaceChildren(buildList(root, ctx));
}

function customerSelect(ctx, withAll) {
  const select = el('select', '', { id: 'order-customer', name: 'customerId' });
  if (withAll) select.append(el('option', 'All customers', { value: '' }));
  for (const customer of sortCustomers(ctx.state.customers)) {
    select.append(el('option', customer.name, { value: customer.id }));
  }
  return select;
}

function buildList(root, ctx) {
  const section = el('section');
  section.append(el('h2', 'Orders'));
  const select = customerSelect(ctx, true);
  select.setAttribute('aria-label', 'Filter by customer');
  select.value = view.customerId;
  const search = el('input', '', { type: 'search', 'aria-label': 'Filter orders', value: view.text });
  const toolbar = el('div', '', { class: 'toolbar' });
  toolbar.append(select, search, button('New order', () => show(root, ctx, 'form')));
  const results = el('div');
  const fill = () => results.replaceChildren(buildResults(root, ctx));
  select.addEventListener('change', () => {
    view.customerId = select.value;
    fill();
  });
  search.addEventListener('input', () => {
    view.text = search.value;
    fill();
  });
  fill();
  section.append(toolbar, results);
  return section;
}

function buildResults(root, ctx) {
  if (ctx.state.orders.length === 0) {
    return el('p', 'No orders yet. Use "New order" to create the first one.', { class: 'empty' });
  }
  const found = filterOrders(ctx.state, { customerId: view.customerId, text: view.text });
  if (found.length === 0) return el('p', 'No orders match your filter.', { class: 'empty' });
  const table = el('table');
  const head = el('tr');
  head.append(el('th', 'Order'), el('th', 'Date'), el('th', 'Customer'), el('th', 'Total', { class: 'amount' }));
  table.append(head);
  for (const order of found) {
    const row = el('tr');
    const numberCell = el('td');
    const open = button(`#${order.number}`, () => show(root, ctx, 'detail', order.id));
    open.className = 'link';
    numberCell.append(open);
    row.append(numberCell, el('td', order.date), el('td', customerName(ctx, order.customerId)),
      el('td', formatEuros(orderTotalCents(order)), { class: 'amount' }));
    table.append(row);
  }
  return table;
}

function buildNewForm(root, ctx) {
  const form = el('form', '', { novalidate: '' });
  form.append(el('h2', 'New order'));
  if (ctx.state.customers.length === 0) {
    form.append(el('p', 'There are no customers yet. Add a customer on the Customers tab first.', { class: 'empty' }));
    form.append(button('Back', () => show(root, ctx, 'list')));
    return form;
  }
  const customerField = el('div', '', { class: 'field' });
  customerField.append(el('label', 'Customer', { for: 'order-customer' }), customerSelect(ctx, false),
    el('span', '', { class: 'error', id: 'order-error-customer' }));
  const dateField = el('div', '', { class: 'field' });
  dateField.append(el('label', 'Order date', { for: 'order-date' }),
    el('input', '', { id: 'order-date', name: 'date', type: 'date', value: todayLocal() }),
    el('span', '', { class: 'error', id: 'order-error-date' }));
  const actions = el('div', '', { class: 'actions' });
  actions.append(el('button', 'Create order', { type: 'submit' }), button('Cancel', () => show(root, ctx, 'list')));
  form.append(customerField, dateField, actions);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitNew(root, ctx, form);
  });
  return form;
}

function showErrors(form, prefix, names, errors) {
  for (const name of names) {
    form.querySelector(`#${prefix}-error-${name}`).textContent = errors?.[name] ?? '';
  }
}

function submitNew(root, ctx, form) {
  const id = ctx.newId();
  const result = addOrder(ctx.state, form.elements.customerId.value, form.elements.date.value, id);
  const outcome = ctx.commit(result);
  if (!outcome.ok) {
    showErrors(form, 'order', ['customer', 'date'], outcome.errors);
    return;
  }
  show(root, ctx, 'detail', id);
}

function buildDetail(root, ctx, order) {
  const section = el('section');
  const back = button('Back', () => show(root, ctx, 'list'));
  back.className = 'link';
  section.append(back, el('h2', `Order #${order.number}`));
  const fields = el('dl');
  fields.append(el('dt', 'Customer'), el('dd', customerName(ctx, order.customerId)));
  section.append(fields, buildDateForm(root, ctx, order));
  section.append(el('p', `Total: ${formatEuros(orderTotalCents(order))}`, { class: 'total' }));
  section.append(renderLines(order, ctx));
  const remove = button('Delete order', () => removeOrder(root, ctx, order));
  const actions = el('div', '', { class: 'actions' });
  actions.append(remove);
  section.append(actions);
  return section;
}

function buildDateForm(root, ctx, order) {
  const form = el('form', '', { novalidate: '' });
  const field = el('div', '', { class: 'field' });
  field.append(el('label', 'Order date', { for: 'order-date' }),
    el('input', '', { id: 'order-date', name: 'date', type: 'date', value: order.date }),
    el('span', '', { class: 'error', id: 'order-error-date' }));
  form.append(field, el('button', 'Save date', { type: 'submit' }));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const outcome = ctx.commit(updateOrderDate(ctx.state, order.id, form.elements.date.value));
    if (!outcome.ok) showErrors(form, 'order', ['date'], outcome.errors);
  });
  return form;
}

function removeOrder(root, ctx, order) {
  if (!window.confirm(`Delete order #${order.number} and all its lines?`)) return;
  const outcome = ctx.commit(deleteOrder(ctx.state, order.id));
  if (outcome.ok) show(root, ctx, 'list');
}
