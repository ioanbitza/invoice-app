import { validateCustomer } from './validation.js';

function compareById(a, b) {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function sortedBy(customers, compareNames) {
  return [...customers].sort((a, b) => compareNames(a.name, b.name) || compareById(a, b));
}

function exists(data, id) {
  return data.customers.some((customer) => customer.id === id);
}

/** Adds a customer from the raw form strings (R-01). */
export function createCustomer(data, input, deps) {
  const checked = validateCustomer(input);
  if (!checked.ok) return { ok: false, errors: checked.errors };
  const customer = { id: deps.newId(), ...checked.value };
  return { ok: true, data: { ...data, customers: [...data.customers, customer] } };
}

/** Changes the fields of the customer with input.id (R-02). */
export function updateCustomer(data, input, deps) {
  if (!exists(data, input.id)) return { ok: false, reason: 'not-found' };
  const checked = validateCustomer(input);
  if (!checked.ok) return { ok: false, errors: checked.errors };
  const customers = data.customers.map((customer) =>
    customer.id === input.id ? { id: customer.id, ...checked.value } : customer,
  );
  return { ok: true, data: { ...data, customers } };
}

/** Removes a customer that has no orders (R-04). */
export function deleteCustomer(data, input, deps) {
  if (!exists(data, input.id)) return { ok: false, reason: 'not-found' };
  const orderCount = data.orders.filter((order) => order.customerId === input.id).length;
  if (orderCount > 0) return { ok: false, reason: 'customer-has-orders', orderCount };
  return { ok: true, data: { ...data, customers: data.customers.filter((customer) => customer.id !== input.id) } };
}

/** All customers in the order of compareNames, ties by id (R-03). */
export function listCustomers(data, compareNames) {
  return sortedBy(data.customers, compareNames);
}

/** Customers whose name or email contains the trimmed text, ignoring case (R-05). */
export function searchCustomers(data, text, compareNames) {
  const needle = text.trim().toLowerCase();
  const matches = data.customers.filter(
    (customer) => customer.name.toLowerCase().includes(needle) || customer.email.toLowerCase().includes(needle),
  );
  return sortedBy(matches, compareNames);
}

/** The text that picks or shows a customer read-only (R-06). */
export function customerLabel(customer) {
  return `${customer.name} (${customer.email === '' ? 'no email' : customer.email})`;
}
