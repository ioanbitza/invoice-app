import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrder, updateOrder, deleteOrder, listOrders, ordersForCustomer, searchOrders } from '../src/domain/orders.js';

const deps = { newId: () => 'new-order', today: '2026-10-30' };
const customer = { id: 'c1', name: 'Ana Pop', email: '', phone: '', address: '' };
const order = (over = {}) => ({ id: 'o1', number: 'ORD-0001', customerId: 'c1', date: '2026-10-30', notes: '', lines: [], ...over });
const dataWith = (orders, over = {}) => ({ nextOrderNumber: 1, customers: [customer], orders, ...over });

test('R-06 createOrder gives ORD-0001 first and raises nextOrderNumber by one', () => {
  const result = createOrder(dataWith([]), { customerId: 'c1', date: '2026-10-30', notes: '' }, deps);
  assert.equal(result.ok, true);
  assert.equal(result.data.orders[0].number, 'ORD-0001');
  assert.equal(result.data.nextOrderNumber, 2);
});

test('R-06 createOrder gives ORD-10000 when nextOrderNumber is 10000', () => {
  const result = createOrder(dataWith([], { nextOrderNumber: 10000 }), { customerId: 'c1', date: '2026-10-30', notes: '' }, deps);
  assert.equal(result.data.orders[0].number, 'ORD-10000');
});

test('R-06 createOrder with an unknown customer returns reason not-found', () => {
  const result = createOrder(dataWith([]), { customerId: 'x', date: '2026-10-30', notes: '' }, deps);
  assert.deepEqual(result, { ok: false, reason: 'not-found' });
});

test('R-06 createOrder with an empty date gives the date error and does not substitute deps.today', () => {
  const result = createOrder(dataWith([]), { customerId: 'c1', date: '', notes: '' }, deps);
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].field, 'date');
  assert.equal(result.data, undefined);
});

test('R-06 the number of a deleted order is not given again', () => {
  const input = { customerId: 'c1', date: '2026-10-30', notes: '' };
  const one = createOrder(dataWith([]), input, deps);
  const gone = deleteOrder(one.data, { id: 'new-order' }, deps);
  const next = createOrder(gone.data, input, deps);
  assert.equal(next.data.orders[0].number, 'ORD-0002');
});

test('R-07 updateOrder changes date and notes and keeps number and customerId', () => {
  const input = { id: 'o1', date: '2026-12-24', notes: 'Gift', number: 'ORD-9', customerId: 'c2' };
  const result = updateOrder(dataWith([order()]), input, deps);
  assert.deepEqual(result.data.orders[0], order({ date: '2026-12-24', notes: 'Gift' }));
});

test('R-07 updateOrder with an invalid date returns the errors and no data', () => {
  const result = updateOrder(dataWith([order()]), { id: 'o1', date: '2026-02-30', notes: '' }, deps);
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].field, 'date');
  assert.equal(result.data, undefined);
});

test('R-07 updateOrder with an unknown id returns reason not-found', () => {
  assert.deepEqual(updateOrder(dataWith([]), { id: 'x', date: '2026-10-30', notes: '' }, deps), { ok: false, reason: 'not-found' });
});

test('R-08 deleteOrder removes the order and keeps the customer and nextOrderNumber', () => {
  const lines = [{ id: 'l', description: 'a', quantity: 1, unitPriceCents: 1 }];
  const result = deleteOrder(dataWith([order({ lines })], { nextOrderNumber: 5 }), { id: 'o1' }, deps);
  assert.deepEqual(result.data, { nextOrderNumber: 5, customers: [customer], orders: [] });
});

test('R-08 deleteOrder with an unknown id returns reason not-found', () => {
  assert.deepEqual(deleteOrder(dataWith([]), { id: 'x' }, deps), { ok: false, reason: 'not-found' });
});

test('R-09 listOrders sorts newer date first, then ORD-10000 before ORD-9999', () => {
  const data = dataWith([
    order({ id: 'a', number: 'ORD-9999' }),
    order({ id: 'b', number: 'ORD-10000' }),
    order({ id: 'c', number: 'ORD-0001', date: '2026-10-12' }),
    order({ id: 'd', number: 'ORD-0002', date: '2026-11-01' }),
  ]);
  assert.deepEqual(listOrders(data).map((r) => r.number), ['ORD-0002', 'ORD-10000', 'ORD-9999', 'ORD-0001']);
});

test('R-09 listOrders rows hold number, customer name, date and total cents', () => {
  const lines = [
    { id: 'l1', description: 'a', quantity: 3, unitPriceCents: 1999 },
    { id: 'l2', description: 'b', quantity: 3, unitPriceCents: 10 },
  ];
  const [row] = listOrders(dataWith([order({ lines })]));
  assert.deepEqual(row, { id: 'o1', number: 'ORD-0001', customerName: 'Ana Pop', date: '2026-10-30', totalCents: 6027 });
});

test('R-02 listOrders shows the renamed customer', () => {
  const data = dataWith([order()], { customers: [{ ...customer, name: 'Ana Maria' }] });
  assert.equal(listOrders(data)[0].customerName, 'Ana Maria');
});

test('R-03 ordersForCustomer returns only that customer rows in the R-09 order', () => {
  const data = dataWith([order({ id: 'a' }), order({ id: 'b', number: 'ORD-0002', customerId: 'c2' }), order({ id: 'c', number: 'ORD-0003' })], {
    customers: [customer, { ...customer, id: 'c2', name: 'Bob' }],
  });
  assert.deepEqual(ordersForCustomer(data, 'c1').map((r) => r.number), ['ORD-0003', 'ORD-0001']);
});

test('R-10 searchOrders finds by number and by customer name, trimmed, ignoring case', () => {
  const data = dataWith([order(), order({ id: 'b', number: 'ORD-0002', customerId: 'c2' })], {
    customers: [customer, { ...customer, id: 'c2', name: 'Bob' }],
  });
  assert.deepEqual(searchOrders(data, '  ord-0002  ').map((r) => r.number), ['ORD-0002']);
  assert.deepEqual(searchOrders(data, 'ANA').map((r) => r.number), ['ORD-0001']);
});

test('R-10 searchOrders with empty or spaces-only text returns all orders', () => {
  const data = dataWith([order(), order({ id: 'b', number: 'ORD-0002' })]);
  assert.equal(searchOrders(data, '').length, 2);
  assert.equal(searchOrders(data, '   ').length, 2);
});
