import { addLine, removeLine, updateLine } from '../../domain/lines.js';
import { deleteOrder } from '../../domain/orders.js';
import { lineTotalCents, orderTotalCents, priceInputText } from '../../domain/money.js';
import { formatDate, formatMoney } from '../format.js';
import { routeToHash } from '../router.js';
import { actionButton, element, field, heading, linkButton, panel } from './components.js';
import { renderNotFound } from './not-found.js';

const DELETE_DIALOG = Object.freeze({
  title: 'Delete this order?',
  text: 'The order and all its lines will be gone for good.',
  safeLabel: 'Cancel',
  confirmLabel: 'Delete order',
});

function detailItem(label, content, muted) {
  const group = element('div', 'detail-item');
  const value = element('dd', muted ? 'detail-value cell-muted' : 'detail-value');
  value.append(content);
  group.append(element('dt', 'detail-term', label), value);
  return group;
}

function details(order, customer, locale) {
  const customerLink = element('a', 'text-link', customer.name);
  customerLink.href = routeToHash({ name: 'customer', id: customer.id });
  const list = element('dl', 'detail-list');
  list.append(
    detailItem('Customer', customerLink, false),
    detailItem('Date', formatDate(order.date, locale), false),
    detailItem('Notes', order.notes === '' ? 'No notes' : order.notes, order.notes === ''),
  );
  const box = panel('panel-detail');
  box.append(list);
  return box;
}

function cell(tag, role, className, text) {
  const node = element(tag, className, text);
  node.setAttribute('role', role);
  return node;
}

function dataCell(className, label, text) {
  const node = cell('td', 'cell', className, text);
  node.dataset.label = label;
  return node;
}

function linesHeader() {
  const head = element('thead');
  head.setAttribute('role', 'rowgroup');
  const row = element('tr');
  row.setAttribute('role', 'row');
  row.append(
    cell('th', 'columnheader', 'col-description', 'Description'),
    cell('th', 'columnheader', 'col-quantity cell-number', 'Quantity'),
    cell('th', 'columnheader', 'col-price cell-number', 'Unit price'),
    cell('th', 'columnheader', 'col-line-total cell-number', 'Line total'),
    cell('th', 'columnheader', 'col-actions cell-number', 'Actions'),
  );
  head.append(row);
  return head;
}

function rowActions(line, position, busy) {
  const wrapper = element('div', 'row-actions');
  const edit = actionButton('Edit', 'link', 'edit-line');
  const remove = actionButton('Remove', 'link', 'remove-line');
  edit.setAttribute('aria-label', `Edit line ${position}`);
  remove.setAttribute('aria-label', `Remove line ${position}`);
  edit.dataset.lineId = line.id;
  remove.dataset.lineId = line.id;
  edit.disabled = busy;
  remove.disabled = busy;
  wrapper.append(edit, remove);
  return wrapper;
}

function lineRow(line, position, locale, ui) {
  const row = element('tr', ui.editing === line.id ? 'row-editing' : '');
  row.setAttribute('role', 'row');
  const description = cell('td', 'cell', 'col-description', line.description);
  description.title = line.description;
  const actionsCell = cell('td', 'cell', 'col-actions cell-number');
  actionsCell.append(rowActions(line, position, ui.open));
  row.append(
    description,
    dataCell('col-quantity cell-number', 'Quantity', String(line.quantity)),
    dataCell('col-price cell-number', 'Unit price', formatMoney(line.unitPriceCents, locale)),
    dataCell('col-line-total cell-number', 'Line total', formatMoney(lineTotalCents(line.quantity, line.unitPriceCents), locale)),
    actionsCell,
  );
  return row;
}

function linesTable(lines, locale, ui) {
  const table = element('table', 'table-lines');
  table.setAttribute('role', 'table');
  const body = element('tbody');
  body.setAttribute('role', 'rowgroup');
  body.append(...lines.map((line, index) => lineRow(line, index + 1, locale, ui)));
  table.append(element('caption', 'visually-hidden', 'Lines of this order'), linesHeader(), body);
  return table;
}

function linesPanel(lines, locale, ui) {
  const box = panel('panel-table');
  if (lines.length > 0) {
    box.append(linesTable(lines, locale, ui));
    return box;
  }
  const empty = element('div', 'empty-state');
  empty.append(element('p', '', 'No lines yet. Add the first one.'));
  box.append(empty);
  return box;
}

const LINE_FIELDS = Object.freeze(['description', 'quantity', 'unitPrice']);
const PRICE_HELPER = 'Use a dot or a comma for decimals, no thousands separators, for example 19.99.';

function textControl(name, value, inputMode) {
  const node = element('input');
  node.type = 'text';
  node.name = name;
  node.value = value;
  if (inputMode) node.inputMode = inputMode;
  return node;
}

function errorOf(errors, name) {
  const found = errors.find((item) => item.field === name);
  return found ? found.message : '';
}

function lineForm(title, values, errors) {
  const box = panel('panel-form line-form');
  box.append(element('h3', '', title));
  const form = element('form');
  form.noValidate = true;
  form.autocomplete = 'off';
  const buttons = element('div', 'button-row');
  const save = actionButton('Save line', 'primary');
  save.type = 'submit';
  buttons.append(save, actionButton('Cancel', 'secondary', 'cancel-line'));
  form.append(
    field({ id: 'line-description', label: 'Description', required: true, control: textControl('description', values.description), error: errorOf(errors, 'description') }),
    field({ id: 'line-quantity', label: 'Quantity', required: true, control: textControl('quantity', values.quantity, 'numeric'), error: errorOf(errors, 'quantity') }),
    field({ id: 'line-unitPrice', label: 'Unit price in EUR', required: true, control: textControl('unitPrice', values.unitPrice, 'decimal'), helper: PRICE_HELPER, error: errorOf(errors, 'unitPrice') }),
    buttons,
  );
  box.append(form);
  return { box, form, save };
}

function readLineValues(form) {
  const values = {};
  for (const name of LINE_FIELDS) values[name] = form.elements[name].value;
  return values;
}

function startValues(line) {
  if (!line) return { description: '', quantity: '', unitPrice: '' };
  return { description: line.description, quantity: String(line.quantity), unitPrice: priceInputText(line.unitPriceCents) };
}

function totalLine(order, locale) {
  const line = element('p', 'order-total');
  line.append(
    element('span', 'order-total-label', 'Order total'),
    element('span', 'order-total-amount', formatMoney(orderTotalCents(order), locale)),
  );
  return line;
}

function buildTop(order, h1) {
  const actions = element('div', 'detail-actions');
  const deleteButton = actionButton('Delete order', 'destructive-quiet', 'delete');
  actions.append(linkButton('Edit order', routeToHash({ name: 'order-edit', id: order.id }), 'secondary'), deleteButton);
  const titleRow = element('div', 'title-row');
  titleRow.append(h1, actions);
  return { titleRow, deleteButton };
}

/** Screen 7.6: an order's details, lines and total, with delete and the line form (R-08, R-11 to R-15, R-17, R-18, R-21). */
export function renderOrderView(container, context) {
  const { route, state, commit, openDialog, showBanner, deps } = context;
  const order = state.data.orders.find((item) => item.id === route.id);
  if (!order) return renderNotFound(container);
  const customer = state.data.customers.find((item) => item.id === order.customerId);
  const locale = navigator.language;
  const h1 = heading(order.number);
  h1.classList.add('cell-mono');
  const { titleRow, deleteButton } = buildTop(order, h1);
  const currentOrder = () => state.data.orders.find((item) => item.id === route.id);
  const ui = { open: false, editing: null, start: null, opener: null, lastFocused: null, form: null, save: null };
  const addButton = actionButton('Add line', 'primary', 'add-line');
  const linesRow = element('div', 'title-row');
  linesRow.append(element('h2', '', 'Lines'), addButton);
  const linesHolder = element('div', 'lines-holder');
  const totalHolder = element('div', 'total-holder');
  const formHolder = element('div', 'form-holder');

  function drawLines() {
    const now = currentOrder();
    addButton.disabled = ui.open;
    linesHolder.replaceChildren(linesPanel(now.lines, locale, ui));
    totalHolder.replaceChildren(totalLine(now, locale));
  }

  function showForm(values, errors) {
    const position = currentOrder().lines.findIndex((line) => line.id === ui.editing) + 1;
    const built = lineForm(ui.editing ? `Edit line ${position}` : 'Add a line', values, errors);
    ui.form = built.form;
    ui.save = built.save;
    built.form.addEventListener('submit', onSubmit);
    built.form.addEventListener('focusin', (event) => {
      ui.lastFocused = event.target.id;
    });
    formHolder.replaceChildren(built.box);
  }

  function isDirty() {
    const now = readLineValues(ui.form);
    return LINE_FIELDS.some((name) => now[name] !== ui.start[name]);
  }

  function openForm(lineId, opener) {
    const line = lineId ? currentOrder().lines.find((item) => item.id === lineId) : null;
    ui.open = true;
    ui.editing = lineId;
    ui.opener = opener;
    ui.start = startValues(line);
    ui.lastFocused = 'line-description';
    drawLines();
    showForm(ui.start, []);
    state.form = { hash: location.hash, isDirty, restoreFocus: () => document.getElementById(ui.lastFocused).focus() };
    document.getElementById('line-description').focus();
  }

  function closeForm() {
    ui.open = false;
    ui.editing = null;
    ui.form = null;
    state.form = null;
    formHolder.replaceChildren();
    drawLines();
  }

  function cancelForm() {
    const opener = ui.opener;
    closeForm();
    const target = opener.isConnected && !opener.disabled ? opener : addButton;
    target.focus();
  }

  function runLine(values) {
    const input = { orderId: route.id, ...values };
    if (ui.editing) return updateLine(state.data, { ...input, lineId: ui.editing }, deps);
    return addLine(state.data, input, deps);
  }

  function onSubmit(event) {
    event.preventDefault();
    const values = readLineValues(ui.form);
    const result = runLine(values);
    if (!result.ok && result.errors) {
      showForm(values, result.errors);
      const first = LINE_FIELDS.find((name) => errorOf(result.errors, name) !== '');
      document.getElementById(`line-${first}`).focus();
      return;
    }
    if (!result.ok) {
      renderNotFound(container).focus();
      return;
    }
    const saved = commit(result.data);
    if (!saved.ok) {
      showBanner(saved.code);
      ui.save.focus();
      return;
    }
    closeForm();
    addButton.focus();
  }

  function removeOne(lineId) {
    const result = removeLine(state.data, { orderId: route.id, lineId }, deps);
    if (!result.ok) {
      renderNotFound(container).focus();
      return;
    }
    const saved = commit(result.data);
    if (!saved.ok) {
      showBanner(saved.code);
      return;
    }
    drawLines();
    addButton.focus();
  }

  function onClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === 'add-line') openForm(null, button);
    else if (action === 'edit-line') openForm(button.dataset.lineId, button);
    else if (action === 'cancel-line') cancelForm();
    else if (action === 'remove-line') removeOne(button.dataset.lineId);
  }

  for (const part of [linesRow, linesHolder, formHolder]) part.addEventListener('click', onClick);

  function confirmDelete(result) {
    const saved = commit(result.data);
    if (!saved.ok) {
      showBanner(saved.code);
      return;
    }
    location.replace('#/orders');
  }

  deleteButton.addEventListener('click', () => {
    const result = deleteOrder(state.data, { id: order.id }, deps);
    if (!result.ok) {
      renderNotFound(container).focus();
      return;
    }
    openDialog(DELETE_DIALOG, deleteButton, { onConfirm: () => confirmDelete(result) });
  });

  drawLines();
  container.replaceChildren(
    titleRow,
    context.bannerRegion(),
    details(order, customer, locale),
    linesRow,
    linesHolder,
    totalHolder,
    formHolder,
  );
  return h1;
}
