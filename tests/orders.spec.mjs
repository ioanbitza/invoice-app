import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

// S4 not built yet: every test below is skipped until the builder creates the module, then it runs and must pass.
// The R-02 test also needs updateCustomer from S3, which the plan builds first.
const inDomain = (file) => existsSync(new URL(`../src/domain/${file}`, import.meta.url));
const built = inDomain('orders.js') && inDomain('customers.js');
const skip = built ? false : 'S4 not built yet';
const { createOrder, updateOrder, deleteOrder, listOrders, ordersForCustomer, searchOrders } = built
  ? await import('../src/domain/orders.js')
  : {};
const { updateCustomer } = built ? await import('../src/domain/customers.js') : {};

// Shapes used here, from ADR-003 `command(data, input, deps)`: createOrder's input is `{ customerId, date, notes }`,
// updateOrder's is `{ id, date, notes }`, deleteOrder's is `{ id }`. A list row is
// `{ id, number, customerName, date, totalCents }`; listOrders(data), ordersForCustomer(data, customerId) and
// searchOrders(data, text) all return rows, because a view adds nothing up (ADR-003).
const countingDeps = () => {
  let count = 0;
  return {
    newId: () => {
      count += 1;
      return `order-${count}`;
    },
    today: '2026-10-30',
  };
};

const aCustomer = (over = {}) => ({ id: 'c1', name: 'Ana Pop', email: '', phone: '', address: '', ...over });
const anOrder = (over = {}) => ({
  id: 'o1',
  number: 'ORD-0001',
  customerId: 'c1',
  date: '2026-10-30',
  notes: '',
  lines: [],
  ...over,
});
const aLine = (over = {}) => ({ id: 'l1', description: 'Widget', quantity: 1, unitPriceCents: 100, ...over });
const dataWith = (orders = [], over = {}) => ({
  nextOrderNumber: orders.length + 1,
  customers: [aCustomer()],
  orders,
  ...over,
});
const orderInput = (over = {}) => ({ customerId: 'c1', date: '2026-10-30', notes: '', ...over });

const numbers = (rows) => rows.map(({ number }) => number);

test('R-06 createOrder builds the order with the id from deps.newId and no lines', { skip }, () => {
  const data = dataWith();

  const result = createOrder(data, orderInput({ date: '2026-11-02', notes: 'Rush' }), countingDeps());

  assert.equal(result.ok, true);
  assert.deepEqual(result.data.orders, [
    { id: 'order-1', number: 'ORD-0001', customerId: 'c1', date: '2026-11-02', notes: 'Rush', lines: [] },
  ]);
});

test('R-06 createOrder gives ORD-0001 first and ORD-0002 next', { skip }, () => {
  const deps = countingDeps();

  const first = createOrder(dataWith(), orderInput(), deps);
  const second = createOrder(first.data, orderInput(), deps);

  assert.deepEqual(numbers(second.data.orders), ['ORD-0001', 'ORD-0002']);
});

test('R-06 createOrder raises nextOrderNumber by one', { skip }, () => {
  const result = createOrder(dataWith(), orderInput(), countingDeps());

  assert.equal(result.data.nextOrderNumber, 2);
});

test('R-06 createOrder gives ORD-9999 when nextOrderNumber is 9999', { skip }, () => {
  const data = dataWith([], { nextOrderNumber: 9999 });

  const result = createOrder(data, orderInput(), countingDeps());

  assert.deepEqual(numbers(result.data.orders), ['ORD-9999']);
});

test('R-06 createOrder gives ORD-10000 when nextOrderNumber is 10000', { skip }, () => {
  const data = dataWith([], { nextOrderNumber: 10000 });

  const result = createOrder(data, orderInput(), countingDeps());

  assert.deepEqual(numbers(result.data.orders), ['ORD-10000']);
});

test('R-06 createOrder leaves the input data unchanged', { skip }, () => {
  const data = dataWith();
  const before = structuredClone(data);

  createOrder(data, orderInput(), countingDeps());

  assert.deepEqual(data, before);
});

test('R-06 createOrder with an unknown customer returns reason not-found', { skip }, () => {
  const result = createOrder(dataWith(), orderInput({ customerId: 'nobody' }), countingDeps());

  assert.deepEqual(result, { ok: false, reason: 'not-found' });
});

test('R-06 createOrder with an empty date gives the date error and does not substitute deps.today', { skip }, () => {
  const result = createOrder(dataWith(), orderInput({ date: '' }), countingDeps());

  assert.equal(result.ok, false);
  assert.deepEqual(result.errors.map(({ field }) => field), ['date']);
  assert.equal(result.data, undefined);
});

for (const date of ['1999-12-31', '2099-01-01']) {
  test(`R-06 createOrder allows the past or future date ${date}`, { skip }, () => {
    const result = createOrder(dataWith(), orderInput({ date }), countingDeps());

    assert.equal(result.data.orders[0].date, date);
  });
}

test('R-06 the number of a deleted order is not given again', { skip }, () => {
  const deps = countingDeps();
  const first = createOrder(dataWith(), orderInput(), deps);
  const second = createOrder(first.data, orderInput(), deps);
  const afterDelete = deleteOrder(second.data, { id: 'order-2' }, deps);

  const third = createOrder(afterDelete.data, orderInput(), deps);

  assert.deepEqual(numbers(third.data.orders), ['ORD-0001', 'ORD-0003']);
});

test('R-07 updateOrder changes date and notes', { skip }, () => {
  const data = dataWith([anOrder()]);

  const result = updateOrder(data, { id: 'o1', date: '2026-12-24', notes: 'Gift' }, countingDeps());

  assert.equal(result.ok, true);
  assert.equal(result.data.orders[0].date, '2026-12-24');
  assert.equal(result.data.orders[0].notes, 'Gift');
});

test('R-07 updateOrder keeps number and customerId even when the input carries them', { skip }, () => {
  const data = dataWith([anOrder()], { customers: [aCustomer(), aCustomer({ id: 'c2', name: 'Bob' })] });
  const input = { id: 'o1', date: '2026-12-24', notes: '', number: 'ORD-9999', customerId: 'c2' };

  const result = updateOrder(data, input, countingDeps());

  assert.equal(result.data.orders[0].number, 'ORD-0001');
  assert.equal(result.data.orders[0].customerId, 'c1');
});

test('R-07 updateOrder keeps the lines of the order', { skip }, () => {
  const lines = [aLine()];
  const data = dataWith([anOrder({ lines })]);

  const result = updateOrder(data, { id: 'o1', date: '2026-12-24', notes: '' }, countingDeps());

  assert.deepEqual(result.data.orders[0].lines, lines);
});

test('R-07 updateOrder leaves the other orders as they were', { skip }, () => {
  const other = anOrder({ id: 'o2', number: 'ORD-0002' });
  const data = dataWith([anOrder(), other]);

  const result = updateOrder(data, { id: 'o1', date: '2026-12-24', notes: '' }, countingDeps());

  assert.deepEqual(result.data.orders.find(({ id }) => id === 'o2'), other);
});

test('R-07 updateOrder with an invalid date returns the errors and no data', { skip }, () => {
  const data = dataWith([anOrder()]);

  const result = updateOrder(data, { id: 'o1', date: '2026-02-30', notes: '' }, countingDeps());

  assert.equal(result.ok, false);
  assert.deepEqual(result.errors.map(({ field }) => field), ['date']);
  assert.equal(result.data, undefined);
});

test('R-07 updateOrder with an unknown id returns reason not-found', { skip }, () => {
  const result = updateOrder(dataWith(), { id: 'nothing', date: '2026-10-30', notes: '' }, countingDeps());

  assert.deepEqual(result, { ok: false, reason: 'not-found' });
});

test('R-08 deleteOrder removes the order and its lines', { skip }, () => {
  const data = dataWith([anOrder({ lines: [aLine()] })]);

  const result = deleteOrder(data, { id: 'o1' }, countingDeps());

  assert.equal(result.ok, true);
  assert.deepEqual(result.data.orders, []);
});

test('R-08 deleteOrder keeps the other orders', { skip }, () => {
  const other = anOrder({ id: 'o2', number: 'ORD-0002', lines: [aLine()] });
  const data = dataWith([anOrder(), other]);

  const result = deleteOrder(data, { id: 'o1' }, countingDeps());

  assert.deepEqual(result.data.orders, [other]);
});

test('R-08 deleteOrder keeps the customer and nextOrderNumber', { skip }, () => {
  const data = dataWith([anOrder()], { nextOrderNumber: 7 });

  const result = deleteOrder(data, { id: 'o1' }, countingDeps());

  assert.deepEqual(result.data.customers, [aCustomer()]);
  assert.equal(result.data.nextOrderNumber, 7);
});

test('R-08 deleteOrder with an unknown id returns reason not-found', { skip }, () => {
  const data = dataWith([anOrder()]);

  const result = deleteOrder(data, { id: 'nothing' }, countingDeps());

  assert.deepEqual(result, { ok: false, reason: 'not-found' });
});

test('R-09 listOrders sorts 2026-10-30 before 2026-10-12', { skip }, () => {
  const data = dataWith([
    anOrder({ id: 'o1', number: 'ORD-0001', date: '2026-10-12' }),
    anOrder({ id: 'o2', number: 'ORD-0002', date: '2026-10-30' }),
  ]);

  assert.deepEqual(numbers(listOrders(data)), ['ORD-0002', 'ORD-0001']);
});

test('R-09 listOrders puts a newer date first even when its number is lower', { skip }, () => {
  const data = dataWith([
    anOrder({ id: 'o1', number: 'ORD-0001', date: '2026-10-30' }),
    anOrder({ id: 'o2', number: 'ORD-0002', date: '2026-10-12' }),
  ]);

  assert.deepEqual(numbers(listOrders(data)), ['ORD-0001', 'ORD-0002']);
});

test('R-09 listOrders on the same date puts ORD-10000 before ORD-9999', { skip }, () => {
  const data = dataWith(
    [anOrder({ id: 'o1', number: 'ORD-9999' }), anOrder({ id: 'o2', number: 'ORD-10000' })],
    { nextOrderNumber: 10001 },
  );

  assert.deepEqual(numbers(listOrders(data)), ['ORD-10000', 'ORD-9999']);
});

test('R-09 listOrders rows hold number, customer name, date and total cents', { skip }, () => {
  const lines = [aLine({ quantity: 3, unitPriceCents: 1999 }), aLine({ id: 'l2', quantity: 3, unitPriceCents: 10 })];
  const data = dataWith([anOrder({ lines })]);

  const [row] = listOrders(data);

  assert.equal(row.number, 'ORD-0001');
  assert.equal(row.customerName, 'Ana Pop');
  assert.equal(row.date, '2026-10-30');
  assert.equal(row.totalCents, 6027);
});

test('R-09 listOrders rows hold the id the row opens', { skip }, () => {
  const [row] = listOrders(dataWith([anOrder({ id: 'o7' })]));

  assert.equal(row.id, 'o7');
});

test('R-09 listOrders leaves the input data unchanged', { skip }, () => {
  const data = dataWith([
    anOrder({ id: 'o1', number: 'ORD-0001', date: '2026-10-12' }),
    anOrder({ id: 'o2', number: 'ORD-0002', date: '2026-10-30' }),
  ]);
  const before = structuredClone(data);

  listOrders(data);

  assert.deepEqual(data, before);
});

test('R-02 listOrders shows the new customer name after updateCustomer', { skip }, () => {
  const data = dataWith([anOrder()]);
  const edited = updateCustomer(data, { id: 'c1', name: 'Ana Maria', email: '', phone: '', address: '' }, countingDeps());

  const [row] = listOrders(edited.data);

  assert.equal(row.customerName, 'Ana Maria');
});

const twoCustomers = () =>
  dataWith(
    [
      anOrder({ id: 'o1', number: 'ORD-0001', customerId: 'c1', date: '2026-10-12', lines: [aLine()] }),
      anOrder({ id: 'o2', number: 'ORD-0002', customerId: 'c2', date: '2026-10-20', notes: 'for ana' }),
      anOrder({ id: 'o3', number: 'ORD-0003', customerId: 'c1', date: '2026-10-30' }),
    ],
    { customers: [aCustomer(), aCustomer({ id: 'c2', name: 'Bob Ionescu', email: 'ana@bob.ro' })] },
  );

test('R-03 ordersForCustomer returns that customer\'s rows with totals, in the R-09 order', { skip }, () => {
  const rows = ordersForCustomer(twoCustomers(), 'c1');

  assert.deepEqual(numbers(rows), ['ORD-0003', 'ORD-0001']);
  assert.deepEqual(rows.map(({ totalCents }) => totalCents), [0, 100]);
});

test('R-03 ordersForCustomer of a customer with no orders is empty', { skip }, () => {
  assert.deepEqual(ordersForCustomer(dataWith(), 'c1'), []);
});

test('R-10 searchOrders with  ord-0002  finds the order by number', { skip }, () => {
  assert.deepEqual(numbers(searchOrders(twoCustomers(), '  ord-0002  ')), ['ORD-0002']);
});

test('R-10 searchOrders with ANA finds the orders by customer name', { skip }, () => {
  assert.deepEqual(numbers(searchOrders(twoCustomers(), 'ANA')), ['ORD-0003', 'ORD-0001']);
});

test('R-10 searchOrders matches part of a number', { skip }, () => {
  assert.deepEqual(numbers(searchOrders(twoCustomers(), '0003')), ['ORD-0003']);
});

test('R-10 searchOrders with text that matches nothing returns no rows', { skip }, () => {
  assert.deepEqual(searchOrders(twoCustomers(), 'zzz'), []);
});

test('R-10 searchOrders returns rows with their totals, in the R-09 order', { skip }, () => {
  const rows = searchOrders(twoCustomers(), 'ord');

  assert.deepEqual(rows, listOrders(twoCustomers()));
});

for (const text of ['', '     ']) {
  test(`R-10 searchOrders with the text "${text}" returns all orders`, { skip }, () => {
    assert.deepEqual(numbers(searchOrders(twoCustomers(), text)), ['ORD-0003', 'ORD-0002', 'ORD-0001']);
  });
}
