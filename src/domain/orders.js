import { validateNewOrder, validateOrderEdit } from './validation.js';
import { orderTotalCents } from './money.js';

const NUMBER_PREFIX = 'ORD-';

function orderNumber(sequence) {
  return `${NUMBER_PREFIX}${String(sequence).padStart(4, '0')}`;
}

function numericPart(number) {
  return Number(number.slice(NUMBER_PREFIX.length));
}

function newestFirst(a, b) {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return numericPart(b.number) - numericPart(a.number);
}

function toRow(data, order) {
  const customer = data.customers.find((c) => c.id === order.customerId);
  return {
    id: order.id,
    number: order.number,
    customerName: customer.name,
    date: order.date,
    totalCents: orderTotalCents(order),
  };
}

function rowsOf(data, orders) {
  return [...orders].sort(newestFirst).map((order) => toRow(data, order));
}

function hasOrder(data, id) {
  return data.orders.some((o) => o.id === id);
}

/** Adds an order with the next never-reused number (R-06). */
export function createOrder(data, input, deps) {
  const checked = validateNewOrder(input);
  if (!checked.ok) return { ok: false, errors: checked.errors };
  if (!data.customers.some((c) => c.id === checked.value.customerId)) return { ok: false, reason: 'not-found' };
  const order = { id: deps.newId(), number: orderNumber(data.nextOrderNumber), ...checked.value, lines: [] };
  return { ok: true, data: { ...data, nextOrderNumber: data.nextOrderNumber + 1, orders: [...data.orders, order] } };
}

/** Changes date and notes of the order with input.id; number, customer and lines stay (R-07). */
export function updateOrder(data, input, deps) {
  if (!hasOrder(data, input.id)) return { ok: false, reason: 'not-found' };
  const checked = validateOrderEdit(input);
  if (!checked.ok) return { ok: false, errors: checked.errors };
  const orders = data.orders.map((o) => (o.id === input.id ? { ...o, ...checked.value } : o));
  return { ok: true, data: { ...data, orders } };
}

/** Removes an order with its lines; nextOrderNumber is not lowered (R-08). */
export function deleteOrder(data, input, deps) {
  if (!hasOrder(data, input.id)) return { ok: false, reason: 'not-found' };
  return { ok: true, data: { ...data, orders: data.orders.filter((o) => o.id !== input.id) } };
}

/** All orders as rows, newest date first, then highest number (R-09). */
export function listOrders(data) {
  return rowsOf(data, data.orders);
}

/** The rows of one customer's orders (R-03). */
export function ordersForCustomer(data, customerId) {
  return rowsOf(data, data.orders.filter((o) => o.customerId === customerId));
}

/** Rows whose number or customer name contains the trimmed text, ignoring case (R-10). */
export function searchOrders(data, text) {
  const needle = text.trim().toLowerCase();
  return listOrders(data).filter(
    (row) => row.number.toLowerCase().includes(needle) || row.customerName.toLowerCase().includes(needle),
  );
}
