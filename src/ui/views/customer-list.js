import { searchCustomers } from '../../domain/customers.js';
import { routeToHash } from '../router.js';
import { actionButton, element, emptyState, heading, linkButton, panel } from './components.js';

const NOTE = "Your data lives only in this browser and is lost when the browser's site data is cleared.";
const NEW_CUSTOMER_HREF = '#/customers/new';

function cell(tag, role, className) {
  const node = element(tag, className);
  node.setAttribute('role', role);
  return node;
}

function headerRow() {
  const head = element('thead');
  head.setAttribute('role', 'rowgroup');
  const row = element('tr');
  row.setAttribute('role', 'row');
  const name = cell('th', 'columnheader', 'col-name');
  name.textContent = 'Name';
  const email = cell('th', 'columnheader', 'col-email');
  email.textContent = 'Email';
  row.append(name, email);
  head.append(row);
  return head;
}

function customerRow(customer) {
  const row = element('tr', 'row-link');
  row.setAttribute('role', 'row');
  const nameCell = cell('td', 'cell', 'cell-name');
  const link = element('a', 'row-open', customer.name);
  link.href = routeToHash({ name: 'customer', id: customer.id });
  nameCell.title = customer.name;
  nameCell.append(link);
  const hasEmail = customer.email !== '';
  const emailCell = cell('td', 'cell', hasEmail ? 'cell-email' : 'cell-email cell-muted');
  emailCell.textContent = hasEmail ? customer.email : 'No email';
  if (hasEmail) emailCell.title = customer.email;
  row.append(nameCell, emailCell);
  return row;
}

function customerTable(customers) {
  const table = element('table', 'table-customers');
  table.setAttribute('role', 'table');
  table.append(element('caption', 'visually-hidden', 'Customers'), headerRow());
  const body = element('tbody');
  body.setAttribute('role', 'rowgroup');
  body.append(...customers.map(customerRow));
  table.append(body);
  return table;
}

function resultsPanel(matches, onClear) {
  const box = panel('panel-table');
  if (matches.length > 0) {
    box.append(customerTable(matches));
    return box;
  }
  const empty = emptyState({
    text: 'No customers match this search.',
    action: { label: 'Clear search', variant: 'secondary', name: 'clear-search' },
  });
  empty.querySelector('button').addEventListener('click', onClear);
  box.append(empty);
  return box;
}

function buildNote(eraseAll) {
  const row = element('div', 'data-note');
  const erase = actionButton('Erase all data', 'destructive-quiet', 'erase-all');
  erase.addEventListener('click', () => eraseAll(erase));
  row.append(element('p', 'note-text', NOTE), erase);
  return row;
}

function buildEmpty(context) {
  const h1 = heading('Customers');
  const box = panel('panel-table');
  box.append(
    emptyState({
      text: 'No customers yet. Add the first one.',
      action: { label: 'New customer', variant: 'primary', href: NEW_CUSTOMER_HREF },
    }),
  );
  return { h1, nodes: [h1, context.bannerRegion(), box, buildNote(context.eraseAll)] };
}

function buildSearch(state) {
  const wrapper = element('div', 'field search');
  const label = element('label', 'field-label', 'Search customers');
  label.htmlFor = 'search-customers';
  const input = element('input');
  input.type = 'search';
  input.id = 'search-customers';
  input.value = state.searchCustomers;
  const status = element('p', 'search-count');
  status.setAttribute('role', 'status');
  wrapper.append(label, input, status);
  return { wrapper, input, status };
}

function buildList(context) {
  const { state, compareNames } = context;
  const total = state.data.customers.length;
  const h1 = heading('Customers');
  const titleRow = element('div', 'title-row');
  titleRow.append(h1, linkButton('New customer', NEW_CUSTOMER_HREF, 'primary'));
  const { wrapper, input, status } = buildSearch(state);
  const results = element('div', 'results');

  function showResults() {
    const text = state.searchCustomers;
    const matches = searchCustomers(state.data, text, compareNames);
    status.textContent = text.trim() === '' ? '' : `Showing ${matches.length} of ${total}`;
    results.replaceChildren(resultsPanel(matches, clearSearch));
  }
  function clearSearch() {
    state.searchCustomers = '';
    input.value = '';
    showResults();
    input.focus();
  }
  input.addEventListener('input', () => {
    state.searchCustomers = input.value;
    showResults();
  });
  showResults();
  return { h1, nodes: [titleRow, context.bannerRegion(), wrapper, results, buildNote(context.eraseAll)] };
}

/** Screen 7.1: customers by name, a search that re-renders only the results, the data note and Erase all data. */
export function renderCustomerList(container, context) {
  const built = context.state.data.customers.length > 0 ? buildList(context) : buildEmpty(context);
  container.replaceChildren(...built.nodes);
  return built.h1;
}
