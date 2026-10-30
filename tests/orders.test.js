import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isCalendarDate, addOrder, updateOrderDate, deleteOrder, filterOrders, ordersOfCustomer,
} from '../src/domain/orders.js';

const ana = { id: 'c1', name: 'Ana Pop', email: '', phone: '' };
const bob = { id: 'c2', name: 'Bob Stan', email: '', phone: '' };

function order(id, number, customerId, date, lines = []) {
  return { id, number, customerId, date, lines };
}

function stateWith(orders, nextOrderNumber = 10) {
  return { version: 1, nextOrderNumber, customers: [ana, bob], orders };
}

test('R-04 lists a customer\'s orders with each order\'s total', () => {
  const lines = [
    { id: 'l1', description: 'A', quantity: 2, unitPriceCents: 1250 },
    { id: 'l2', description: 'B', quantity: 1, unitPriceCents: 500 },
  ];
  const state = stateWith([
    order('o1', 1, 'c1', '2026-01-01', lines),
    order('o2', 2, 'c2', '2026-01-02'),
    order('o3', 3, 'c1', '2026-01-03'),
  ]);
  const list = ordersOfCustomer(state, 'c1');
  assert.deepEqual(list.map((o) => [o.id, o.totalCents]), [['o3', 0], ['o1', 3000]]);
});

test('R-07 creates an order with no lines for an existing customer', () => {
  const result = addOrder(stateWith([], 4), 'c1', '2026-03-05', 'o1');
  assert.equal(result.ok, true);
  assert.deepEqual(result.state.orders, [order('o1', 4, 'c1', '2026-03-05')]);
  assert.equal(result.state.nextOrderNumber, 5);
});

test('R-07 refuses an order for a customer that does not exist', () => {
  const state = stateWith([]);
  const result = addOrder(state, 'ghost', '2026-03-05', 'o1');
  assert.equal(result.ok, false);
  assert.ok(result.errors.customer);
});

test('R-07 order numbers count up from nextOrderNumber and are not reused after a delete', () => {
  const first = addOrder({ ...stateWith([], 1) }, 'c1', '2026-01-01', 'o1');
  const second = addOrder(first.state, 'c1', '2026-01-01', 'o2');
  assert.deepEqual(second.state.orders.map((o) => o.number), [1, 2]);
  const afterDelete = deleteOrder(second.state, 'o2');
  const third = addOrder(afterDelete.state, 'c1', '2026-01-01', 'o3');
  assert.equal(third.state.orders[1].number, 3);
});

test('R-07 refuses a date that is not a real YYYY-MM-DD calendar date', () => {
  for (const date of ['', '2026-02-30', '2026-13-01', '2026-1-1', '01-02-2026', 'abc', '2026-00-10', '2026-04-31']) {
    assert.equal(isCalendarDate(date), false, date);
    const result = addOrder(stateWith([]), 'c1', date, 'o1');
    assert.equal(result.ok, false, date);
    assert.ok(result.errors.date, date);
  }
  assert.equal(isCalendarDate('2026-02-28'), true);
  assert.equal(isCalendarDate('2024-02-29'), true);
  assert.equal(isCalendarDate('2026-02-29'), false);
});

test('R-08 changes the order date and keeps the customer', () => {
  const state = stateWith([order('o1', 1, 'c1', '2026-01-01'), order('o2', 2, 'c2', '2026-01-02')]);
  const result = updateOrderDate(state, 'o1', '2026-05-06');
  assert.equal(result.ok, true);
  assert.deepEqual(result.state.orders[0], order('o1', 1, 'c1', '2026-05-06'));
  assert.deepEqual(result.state.orders[1], state.orders[1]);
  assert.equal(state.orders[0].date, '2026-01-01');
});

test('R-08 refuses a bad date or an unknown order', () => {
  const state = stateWith([order('o1', 1, 'c1', '2026-01-01')]);
  const badDate = updateOrderDate(state, 'o1', '2026-02-30');
  assert.equal(badDate.ok, false);
  assert.ok(badDate.errors.date);
  assert.equal(badDate.state, undefined);
  const unknown = updateOrderDate(state, 'nope', '2026-01-01');
  assert.equal(unknown.ok, false);
  assert.ok(unknown.errors.order);
  assert.equal(unknown.state, undefined);
});

test('R-09 deleting an order removes it with its lines', () => {
  const lines = [{ id: 'l1', description: 'A', quantity: 1, unitPriceCents: 100 }];
  const state = stateWith([order('o1', 1, 'c1', '2026-01-01', lines), order('o2', 2, 'c1', '2026-01-02')]);
  const result = deleteOrder(state, 'o1');
  assert.equal(result.ok, true);
  assert.deepEqual(result.state.orders.map((o) => o.id), ['o2']);
  assert.equal(JSON.stringify(result.state).includes('l1'), false);
});

test('R-09 deleting an unknown order is refused', () => {
  const result = deleteOrder(stateWith([]), 'nope');
  assert.equal(result.ok, false);
  assert.ok(result.errors.order);
});

test('R-09 deleting the only order works and an unknown id is refused when orders exist', () => {
  const only = deleteOrder(stateWith([order('o1', 1, 'c1', '2026-01-01')]), 'o1');
  assert.equal(only.ok, true);
  assert.deepEqual(only.state.orders, []);
  const unknown = deleteOrder(stateWith([order('o1', 1, 'c1', '2026-01-01')]), 'nope');
  assert.equal(unknown.ok, false);
  assert.ok(unknown.errors.order);
  assert.equal(unknown.state, undefined);
});

test('R-10 a search written as #12 finds order number 12', () => {
  const state = stateWith([order('o1', 12, 'c1', '2026-01-01'), order('o2', 3, 'c2', '2026-01-02')]);
  assert.deepEqual(filterOrders(state, { text: '#12' }).map((o) => o.id), ['o1']);
  assert.deepEqual(filterOrders(state, { text: '#3' }).map((o) => o.id), ['o2']);
  assert.deepEqual(filterOrders(state, { text: '#99' }), []);
});

test('R-10 filters by customer', () => {
  const state = stateWith([order('o1', 1, 'c1', '2026-01-01'), order('o2', 2, 'c2', '2026-01-02')]);
  assert.deepEqual(filterOrders(state, { customerId: 'c2', text: '' }).map((o) => o.id), ['o2']);
});

test('R-10 filters by text on order number or customer name, case-insensitive', () => {
  const state = stateWith([
    order('o1', 12, 'c1', '2026-01-01'),
    order('o2', 3, 'c2', '2026-01-02'),
    order('o3', 4, 'c2', '2026-01-03'),
  ]);
  assert.deepEqual(filterOrders(state, { text: ' BOB ' }).map((o) => o.id), ['o3', 'o2']);
  assert.deepEqual(filterOrders(state, { text: '12' }).map((o) => o.id), ['o1']);
  assert.deepEqual(filterOrders(state, { customerId: 'c1', text: 'bob' }), []);
});

test('R-10 empty filter shows all orders, newest date first', () => {
  const state = stateWith([
    order('o1', 1, 'c1', '2026-01-01'),
    order('o2', 2, 'c1', '2026-03-01'),
    order('o3', 3, 'c1', '2026-03-01'),
    order('o4', 4, 'c1', '2026-02-01'),
  ]);
  const expected = ['o3', 'o2', 'o4', 'o1'];
  assert.deepEqual(filterOrders(state, { customerId: '', text: '' }).map((o) => o.id), expected);
  assert.deepEqual(filterOrders(state, {}).map((o) => o.id), expected);
});
