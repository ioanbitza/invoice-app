import { orderTotalCents } from './money.js';

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_MESSAGE = 'Enter a real date like 2026-03-05';

export function isCalendarDate(text) {
  const match = DATE_PATTERN.exec(text);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function addOrder(state, customerId, date, newId) {
  if (!state.customers.some((c) => c.id === customerId)) {
    return { ok: false, errors: { customer: 'Customer not found' } };
  }
  if (!isCalendarDate(date)) return { ok: false, errors: { date: DATE_MESSAGE } };
  const order = { id: newId, number: state.nextOrderNumber, customerId, date, lines: [] };
  const next = {
    ...state,
    nextOrderNumber: state.nextOrderNumber + 1,
    orders: [...state.orders, order],
  };
  return { ok: true, state: next };
}

export function updateOrderDate(state, orderId, date) {
  if (!state.orders.some((o) => o.id === orderId)) {
    return { ok: false, errors: { order: 'Order not found' } };
  }
  if (!isCalendarDate(date)) return { ok: false, errors: { date: DATE_MESSAGE } };
  const orders = state.orders.map((o) => (o.id === orderId ? { ...o, date } : o));
  return { ok: true, state: { ...state, orders } };
}

export function deleteOrder(state, orderId) {
  if (!state.orders.some((o) => o.id === orderId)) {
    return { ok: false, errors: { order: 'Order not found' } };
  }
  return { ok: true, state: { ...state, orders: state.orders.filter((o) => o.id !== orderId) } };
}

function newestFirst(a, b) {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return b.number - a.number;
}

export function filterOrders(state, { customerId = '', text = '' } = {}) {
  const needle = text.trim().toLowerCase();
  const nameOf = (id) => (state.customers.find((c) => c.id === id)?.name ?? '').toLowerCase();
  return state.orders
    .filter((o) => customerId === '' || o.customerId === customerId)
    .filter((o) => needle === '' || `#${o.number}`.includes(needle) || nameOf(o.customerId).includes(needle))
    .sort(newestFirst);
}

export function ordersOfCustomer(state, customerId) {
  return state.orders
    .filter((o) => o.customerId === customerId)
    .sort(newestFirst)
    .map((o) => ({ ...o, totalCents: orderTotalCents(o) }));
}
