import { deleteCustomer } from '../../domain/customers.js';
import { buildCustomerExport, exportFileName } from '../../domain/export.js';
import { ordersForCustomer } from '../../domain/orders.js';
import { formatDate, formatMoney } from '../format.js';
import { routeToHash } from '../router.js';
import { actionButton, element, emptyState, heading, linkButton, panel, setBanner } from './components.js';
import { renderNotFound } from './not-found.js';

const DETAIL_FIELDS = [
  ['email', 'Email'],
  ['phone', 'Phone'],
  ['address', 'Address'],
];

const DELETE_DIALOG = Object.freeze({
  title: 'Delete this customer?',
  text: 'This customer will be gone for good.',
  safeLabel: 'Cancel',
  confirmLabel: 'Delete customer',
});

function detailItem(label, value) {
  const given = value !== '';
  const group = element('div', 'detail-item');
  group.append(
    element('dt', 'detail-term', label),
    element('dd', given ? 'detail-value' : 'detail-value cell-muted', given ? value : 'Not given'),
  );
  return group;
}

function details(customer) {
  const list = element('dl', 'detail-list');
  list.append(...DETAIL_FIELDS.map(([key, label]) => detailItem(label, customer[key])));
  const box = panel('panel-detail');
  box.append(list);
  return box;
}

function orderCell(tag, role, className, text) {
  const node = element(tag, className, text);
  node.setAttribute('role', role);
  return node;
}

function ordersHeader() {
  const head = element('thead');
  head.setAttribute('role', 'rowgroup');
  const row = element('tr');
  row.setAttribute('role', 'row');
  row.append(
    orderCell('th', 'columnheader', 'col-number', 'Number'),
    orderCell('th', 'columnheader', 'col-date', 'Date'),
    orderCell('th', 'columnheader', 'col-total cell-number', 'Total'),
  );
  head.append(row);
  return head;
}

function orderRow(order, locale) {
  const row = element('tr', 'row-link');
  row.setAttribute('role', 'row');
  const numberCell = orderCell('td', 'cell', 'col-number cell-mono');
  const link = element('a', 'row-open', order.number);
  link.href = routeToHash({ name: 'order', id: order.id });
  numberCell.append(link);
  row.append(
    numberCell,
    orderCell('td', 'cell', 'col-date', formatDate(order.date, locale)),
    orderCell('td', 'cell', 'col-total cell-number', formatMoney(order.totalCents, locale)),
  );
  return row;
}

function ordersTable(rows, locale) {
  const table = element('table', 'table-orders');
  table.setAttribute('role', 'table');
  const body = element('tbody');
  body.setAttribute('role', 'rowgroup');
  body.append(...rows.map((order) => orderRow(order, locale)));
  table.append(element('caption', 'visually-hidden', 'Orders of this customer'), ordersHeader(), body);
  const box = panel('panel-table');
  box.append(table);
  return box;
}

function ordersEmpty(newOrderHref) {
  const box = panel('panel-table');
  box.append(
    emptyState({
      text: 'No orders for this customer yet. Create the first one.',
      action: { label: 'New order', variant: 'primary', href: newOrderHref },
    }),
  );
  return box;
}

function blockedText(orderCount) {
  const noun = orderCount === 1 ? '1 order' : `${orderCount} orders`;
  return `This customer has ${noun}, so it cannot be deleted. No legal retention applies. Delete those orders, then the customer, and all of this customer's data is erased.`;
}

/** Starts the browser download of the customer's export; false when the customer is gone. */
function downloadExport(data, customerId) {
  const built = buildCustomerExport(data, customerId);
  if (built.ok === false) return false;
  const blob = new Blob([JSON.stringify(built, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = element('a');
  link.href = url;
  link.download = exportFileName(customerId);
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return true;
}

function buildTop(customer, h1) {
  const actions = element('div', 'detail-actions');
  const exportButton = actionButton('Export data', 'secondary', 'export');
  const deleteButton = actionButton('Delete customer', 'destructive-quiet', 'delete');
  const editHref = routeToHash({ name: 'customer-edit', id: customer.id });
  actions.append(linkButton('Edit customer', editHref, 'secondary'), exportButton, deleteButton);
  const titleRow = element('div', 'title-row');
  titleRow.append(h1, actions);
  return { titleRow, exportButton, deleteButton };
}

/** Screen 7.3: one customer's fields and orders, with delete (R-04) and export (R-29). */
export function renderCustomerDetail(container, context) {
  const { route, state, commit, openDialog, showBanner, deps, locale } = context;
  const customer = state.data.customers.find((item) => item.id === route.id);
  if (!customer) return renderNotFound(container);
  const rows = ordersForCustomer(state.data, customer.id);
  const newOrderHref = routeToHash({ name: 'customer-order-new', id: customer.id });
  const region = context.bannerRegion();
  const h1 = heading(customer.name);
  const { titleRow, exportButton, deleteButton } = buildTop(customer, h1);

  const ordersRow = element('div', 'title-row');
  ordersRow.append(element('h2', '', 'Orders'));
  if (rows.length > 0) ordersRow.append(linkButton('New order', newOrderHref, 'primary'));

  exportButton.addEventListener('click', () => {
    if (!downloadExport(state.data, customer.id)) renderNotFound(container).focus();
  });

  function confirmDelete(result) {
    const saved = commit(result.data, routeToHash({ name: 'customers' }), { replace: true });
    if (!saved.ok) showBanner(saved.code);
  }

  deleteButton.addEventListener('click', () => {
    const result = deleteCustomer(state.data, { id: customer.id }, deps);
    if (result.ok) {
      openDialog(DELETE_DIALOG, deleteButton, { onConfirm: () => confirmDelete(result) });
      return;
    }
    if (result.reason === 'customer-has-orders') {
      setBanner(region, { variant: 'warning', text: blockedText(result.orderCount) });
      return;
    }
    renderNotFound(container).focus();
  });

  const ordersBox = rows.length > 0 ? ordersTable(rows, locale) : ordersEmpty(newOrderHref);
  container.replaceChildren(titleRow, region, details(customer), ordersRow, ordersBox);
  return h1;
}
