import { deleteOrder } from '../../domain/orders.js';
import { lineTotalCents, orderTotalCents } from '../../domain/money.js';
import { formatDate, formatMoney } from '../format.js';
import { routeToHash } from '../router.js';
import { actionButton, element, heading, linkButton, panel } from './components.js';
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

function lineRow(line, locale) {
  const row = element('tr');
  row.setAttribute('role', 'row');
  const description = cell('td', 'cell', 'col-description', line.description);
  description.title = line.description;
  row.append(
    description,
    dataCell('col-quantity cell-number', 'Quantity', String(line.quantity)),
    dataCell('col-price cell-number', 'Unit price', formatMoney(line.unitPriceCents, locale)),
    dataCell('col-line-total cell-number', 'Line total', formatMoney(lineTotalCents(line.quantity, line.unitPriceCents), locale)),
    cell('td', 'cell', 'col-actions cell-number'),
  );
  return row;
}

function linesTable(lines, locale) {
  const table = element('table', 'table-lines');
  table.setAttribute('role', 'table');
  const body = element('tbody');
  body.setAttribute('role', 'rowgroup');
  body.append(...lines.map((line) => lineRow(line, locale)));
  table.append(element('caption', 'visually-hidden', 'Lines of this order'), linesHeader(), body);
  return table;
}

function linesPanel(lines, locale) {
  const box = panel('panel-table');
  if (lines.length > 0) {
    box.append(linesTable(lines, locale));
    return box;
  }
  const empty = element('div', 'empty-state');
  empty.append(element('p', '', 'No lines yet. Add the first one.'));
  box.append(empty);
  return box;
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

/** Screen 7.6, read-only part: an order's details, lines and total, with delete (R-08, R-14, R-15). */
export function renderOrderView(container, context) {
  const { route, state, commit, openDialog, showBanner, deps } = context;
  const order = state.data.orders.find((item) => item.id === route.id);
  if (!order) return renderNotFound(container);
  const customer = state.data.customers.find((item) => item.id === order.customerId);
  const locale = navigator.language;
  const h1 = heading(order.number);
  h1.classList.add('cell-mono');
  const { titleRow, deleteButton } = buildTop(order, h1);

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

  const linesRow = element('div', 'title-row');
  linesRow.append(element('h2', '', 'Lines'));
  container.replaceChildren(
    titleRow,
    context.bannerRegion(),
    details(order, customer, locale),
    linesRow,
    linesPanel(order.lines, locale),
    totalLine(order, locale),
  );
  return h1;
}
