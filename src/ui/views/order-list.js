import { listOrders, searchOrders } from '../../domain/orders.js';
import { formatDate, formatMoney } from '../format.js';
import { routeToHash } from '../router.js';
import { element, emptyState, heading, linkButton, panel } from './components.js';

const NEW_ORDER_HREF = '#/orders/new';
const NEW_CUSTOMER_HREF = '#/customers/new';

const NO_CUSTOMERS = {
  text: 'Add a customer first. Every order belongs to one.',
  action: { label: 'New customer', variant: 'primary', href: NEW_CUSTOMER_HREF },
};
const NO_ORDERS = {
  text: 'No orders yet. Create the first one.',
  action: { label: 'New order', variant: 'primary', href: NEW_ORDER_HREF },
};

function cell(tag, role, className, text) {
  const node = element(tag, className, text);
  node.setAttribute('role', role);
  return node;
}

function headerRow() {
  const head = element('thead');
  head.setAttribute('role', 'rowgroup');
  const row = element('tr');
  row.setAttribute('role', 'row');
  row.append(
    cell('th', 'columnheader', 'col-number', 'Number'),
    cell('th', 'columnheader', 'col-customer', 'Customer'),
    cell('th', 'columnheader', 'col-date', 'Date'),
    cell('th', 'columnheader', 'col-total cell-number', 'Total'),
  );
  head.append(row);
  return head;
}

function orderRow(order, locale) {
  const row = element('tr', 'row-link');
  row.setAttribute('role', 'row');
  const numberCell = cell('td', 'cell', 'col-number cell-mono');
  const link = element('a', 'row-open', order.number);
  link.href = routeToHash({ name: 'order', id: order.id });
  numberCell.append(link);
  const customerCell = cell('td', 'cell', 'col-customer', order.customerName);
  customerCell.title = order.customerName;
  row.append(
    numberCell,
    customerCell,
    cell('td', 'cell', 'col-date', formatDate(order.date, locale)),
    cell('td', 'cell', 'col-total cell-number', formatMoney(order.totalCents, locale)),
  );
  return row;
}

function orderTable(rows, locale) {
  const table = element('table', 'table-order-list');
  table.setAttribute('role', 'table');
  const body = element('tbody');
  body.setAttribute('role', 'rowgroup');
  body.append(...rows.map((order) => orderRow(order, locale)));
  table.append(element('caption', 'visually-hidden', 'Orders'), headerRow(), body);
  return table;
}

function resultsPanel(matches, locale, onClear) {
  const box = panel('panel-table');
  if (matches.length > 0) {
    box.append(orderTable(matches, locale));
    return box;
  }
  const empty = emptyState({
    text: 'No orders match this search.',
    action: { label: 'Clear search', variant: 'secondary', name: 'clear-search' },
  });
  empty.querySelector('button').addEventListener('click', onClear);
  box.append(empty);
  return box;
}

function buildEmpty(context, spec) {
  const h1 = heading('Orders');
  const box = panel('panel-table');
  box.append(emptyState(spec));
  return { h1, nodes: [h1, context.bannerRegion(), box] };
}

function buildSearch(state) {
  const wrapper = element('div', 'field search');
  const label = element('label', 'field-label', 'Search orders');
  label.htmlFor = 'search-orders';
  const input = element('input');
  input.type = 'search';
  input.id = 'search-orders';
  input.value = state.searchOrders;
  const status = element('p', 'search-count');
  status.setAttribute('role', 'status');
  wrapper.append(label, input, status);
  return { wrapper, input, status };
}

function buildList(context) {
  const { state, locale } = context;
  const total = state.data.orders.length;
  const h1 = heading('Orders');
  const titleRow = element('div', 'title-row');
  titleRow.append(h1, linkButton('New order', NEW_ORDER_HREF, 'primary'));
  const { wrapper, input, status } = buildSearch(state);
  const results = element('div', 'results');

  function showResults() {
    const text = state.searchOrders;
    const searching = text.trim() !== '';
    const matches = searching ? searchOrders(state.data, text) : listOrders(state.data);
    status.textContent = searching ? `Showing ${matches.length} of ${total}` : '';
    results.replaceChildren(resultsPanel(matches, locale, clearSearch));
  }
  function clearSearch() {
    state.searchOrders = '';
    input.value = '';
    showResults();
    input.focus();
  }
  input.addEventListener('input', () => {
    state.searchOrders = input.value;
    showResults();
  });
  showResults();
  return { h1, nodes: [titleRow, context.bannerRegion(), wrapper, results] };
}

/** Screen 7.4: orders newest first with a search by number or customer name and three empty states. */
export function renderOrderList(container, context) {
  const { data } = context.state;
  let built;
  if (data.customers.length === 0) built = buildEmpty(context, NO_CUSTOMERS);
  else if (data.orders.length === 0) built = buildEmpty(context, NO_ORDERS);
  else built = buildList(context);
  container.replaceChildren(...built.nodes);
  return built.h1;
}
