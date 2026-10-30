import { addLine, updateLine, removeLine } from '../domain/lines.js';
import { lineTotalCents, formatEuros } from '../domain/money.js';

const lineView = { editingLineId: null };
const FIELDS = ['description', 'quantity', 'unitPrice'];

export function el(tag, text, attributes = {}) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  return node;
}

export function button(label, onClick, type = 'button') {
  const node = el('button', label, { type });
  node.addEventListener('click', onClick);
  return node;
}

function centsToInput(cents) {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

export function renderLines(order, ctx) {
  const section = el('section');
  section.append(el('h3', 'Lines'), buildTable(order, ctx), buildForm(order, ctx));
  return section;
}

function buildTable(order, ctx) {
  if (order.lines.length === 0) {
    return el('p', 'This order has no lines yet. Add the first one below.', { class: 'empty' });
  }
  const table = el('table');
  const head = el('tr');
  head.append(el('th', 'Description'), el('th', 'Qty', { class: 'amount' }),
    el('th', 'Unit price', { class: 'amount' }), el('th', 'Line total', { class: 'amount' }), el('th', 'Actions'));
  table.append(head);
  for (const line of order.lines) table.append(buildRow(order, line, ctx));
  return table;
}

function buildRow(order, line, ctx) {
  const row = el('tr');
  const actions = el('td');
  actions.append(
    button('Edit', () => {
      lineView.editingLineId = line.id;
      ctx.rerender();
    }),
    button('Remove', () => ctx.commit(removeLine(ctx.state, order.id, line.id))),
  );
  row.append(
    el('td', line.description),
    el('td', String(line.quantity), { class: 'amount' }),
    el('td', formatEuros(line.unitPriceCents), { class: 'amount' }),
    el('td', formatEuros(lineTotalCents(line)), { class: 'amount' }),
    actions,
  );
  return row;
}

function buildField(name, label, value) {
  const wrapper = el('div', '', { class: 'field' });
  const input = el('input', '', { id: `line-${name}`, name, type: 'text', value });
  const message = el('span', '', { class: 'error', id: `line-error-${name}` });
  input.setAttribute('aria-describedby', message.id);
  wrapper.append(el('label', label, { for: input.id }), input, message);
  return wrapper;
}

function buildForm(order, ctx) {
  const editing = order.lines.find((l) => l.id === lineView.editingLineId);
  const form = el('form', '', { novalidate: '' });
  form.append(el('h4', editing ? 'Edit line' : 'Add line'));
  form.append(
    buildField('description', 'Description', editing?.description ?? ''),
    buildField('quantity', 'Quantity', editing ? String(editing.quantity) : ''),
    buildField('unitPrice', 'Unit price (EUR)', editing ? centsToInput(editing.unitPriceCents) : ''),
  );
  const actions = el('div', '', { class: 'actions' });
  actions.append(el('button', editing ? 'Save line' : 'Add line', { type: 'submit' }));
  if (editing) {
    actions.append(button('Cancel', () => {
      lineView.editingLineId = null;
      ctx.rerender();
    }));
  }
  form.append(actions);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitForm(order, ctx, form, editing);
  });
  return form;
}

function submitForm(order, ctx, form, editing) {
  const input = {
    description: form.elements.description.value,
    quantity: form.elements.quantity.value,
    unitPrice: form.elements.unitPrice.value,
  };
  const result = editing
    ? updateLine(ctx.state, order.id, editing.id, input)
    : addLine(ctx.state, order.id, input, ctx.newId());
  if (result.ok) lineView.editingLineId = null;
  const outcome = ctx.commit(result);
  if (outcome.ok) return;
  if (result.ok) lineView.editingLineId = editing?.id ?? null;
  for (const name of FIELDS) {
    form.querySelector(`#line-error-${name}`).textContent = outcome.errors?.[name] ?? '';
  }
}
