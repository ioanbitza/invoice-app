import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

// S3 not built yet: every test below is skipped until the builder creates the module, then it runs and must pass.
const built = existsSync(new URL('../src/domain/customers.js', import.meta.url));
const skip = built ? false : 'S3 not built yet';
const { createCustomer, updateCustomer, deleteCustomer, listCustomers, searchCustomers, customerLabel } = built
  ? await import('../src/domain/customers.js')
  : {};

// Shapes used here, from ADR-003 `command(data, input, deps)`: createCustomer's input is the form's raw strings,
// updateCustomer's adds `id`, deleteCustomer's is `{ id }`. listCustomers and searchCustomers return customers.
const deps = { newId: () => 'new-id', today: '2026-10-30' };

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
const dataWith = (customers, orders = []) => ({ nextOrderNumber: orders.length + 1, customers, orders });

const ascending = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const descending = (a, b) => ascending(b, a);
const names = (customers) => customers.map((customer) => customer.name);
const byId = (data, id) => data.customers.find((customer) => customer.id === id);

test('R-01 createCustomer adds a customer with the id from deps.newId', { skip }, () => {
  const data = dataWith([aCustomer()]);
  const input = { name: 'Bob Ionescu', email: 'bob@example.com', phone: '0722', address: 'Cluj' };

  const result = createCustomer(data, input, deps);

  assert.equal(result.ok, true);
  assert.equal(result.data.customers.length, 2);
  assert.deepEqual(byId(result.data, 'new-id'), { id: 'new-id', ...input });
});

test('R-01 createCustomer leaves the input data unchanged', { skip }, () => {
  const data = dataWith([aCustomer()]);
  const before = structuredClone(data);

  createCustomer(data, { name: 'Bob', email: '', phone: '', address: '' }, deps);

  assert.deepEqual(data, before);
});

test('R-01 createCustomer with an invalid email returns the errors and no data', { skip }, () => {
  const data = dataWith([]);

  const result = createCustomer(data, { name: 'Bob', email: 'ab.c', phone: '', address: '' }, deps);

  assert.equal(result.ok, false);
  assert.deepEqual(result.errors.map(({ field }) => field), ['email']);
  assert.equal(result.data, undefined);
});

test('R-01 two customers may have the same name and email', { skip }, () => {
  const data = dataWith([aCustomer({ email: 'ana@example.com' })]);

  const result = createCustomer(data, { name: 'Ana Pop', email: 'ana@example.com', phone: '', address: '' }, deps);

  assert.equal(result.ok, true);
  assert.equal(result.data.customers.length, 2);
});

test('R-02 updateCustomer changes the fields of that customer', { skip }, () => {
  const data = dataWith([aCustomer(), aCustomer({ id: 'c2', name: 'Bob' })]);
  const fields = { name: 'Ana Maria', email: 'am@example.com', phone: '0722', address: 'Cluj' };

  const result = updateCustomer(data, { id: 'c1', ...fields }, deps);

  assert.equal(result.ok, true);
  assert.deepEqual(byId(result.data, 'c1'), { id: 'c1', ...fields });
});

test('R-02 updateCustomer leaves the other customers as they were', { skip }, () => {
  const other = aCustomer({ id: 'c2', name: 'Bob' });
  const data = dataWith([aCustomer(), other]);

  const result = updateCustomer(data, { id: 'c1', name: 'Ana Maria', email: '', phone: '', address: '' }, deps);

  assert.deepEqual(byId(result.data, 'c2'), other);
});

test('R-02 updateCustomer leaves the input data unchanged', { skip }, () => {
  const data = dataWith([aCustomer()]);
  const before = structuredClone(data);

  updateCustomer(data, { id: 'c1', name: 'Ana Maria', email: '', phone: '', address: '' }, deps);

  assert.deepEqual(data, before);
});

test('R-02 updateCustomer with an invalid name returns the errors and no data', { skip }, () => {
  const data = dataWith([aCustomer()]);

  const result = updateCustomer(data, { id: 'c1', name: '', email: '', phone: '', address: '' }, deps);

  assert.equal(result.ok, false);
  assert.deepEqual(result.errors.map(({ field }) => field), ['name']);
  assert.equal(result.data, undefined);
});

test('R-02 updateCustomer with an unknown id returns reason not-found', { skip }, () => {
  const data = dataWith([aCustomer()]);

  const result = updateCustomer(data, { id: 'nobody', name: 'Ana', email: '', phone: '', address: '' }, deps);

  assert.deepEqual(result, { ok: false, reason: 'not-found' });
});

test('R-03 listCustomers orders customers by the compare function it is given', { skip }, () => {
  const data = dataWith([
    aCustomer({ id: 'c1', name: 'Bob' }),
    aCustomer({ id: 'c2', name: 'Zoe' }),
    aCustomer({ id: 'c3', name: 'Ana' }),
  ]);

  assert.deepEqual(names(listCustomers(data, ascending)), ['Ana', 'Bob', 'Zoe']);
  assert.deepEqual(names(listCustomers(data, descending)), ['Zoe', 'Bob', 'Ana']);
});

test('R-03 listCustomers breaks a tie of that compare function by id', { skip }, () => {
  const data = dataWith([
    aCustomer({ id: 'c3' }),
    aCustomer({ id: 'c1' }),
    aCustomer({ id: 'c2' }),
  ]);

  const listed = listCustomers(data, () => 0);

  assert.deepEqual(listed.map(({ id }) => id), ['c1', 'c2', 'c3']);
});

test('R-03 listCustomers shows the name and email of each customer', { skip }, () => {
  const data = dataWith([aCustomer({ name: 'Ana', email: 'ana@example.com' })]);

  const [listed] = listCustomers(data, ascending);

  assert.equal(listed.name, 'Ana');
  assert.equal(listed.email, 'ana@example.com');
});

test('R-03 listCustomers leaves the input data unchanged', { skip }, () => {
  const data = dataWith([aCustomer({ id: 'c1', name: 'Zoe' }), aCustomer({ id: 'c2', name: 'Ana' })]);
  const before = structuredClone(data);

  listCustomers(data, ascending);

  assert.deepEqual(data, before);
});

test('R-04 deleteCustomer with no orders removes the customer', { skip }, () => {
  const other = aCustomer({ id: 'c2', name: 'Bob' });
  const data = dataWith([aCustomer(), other]);

  const result = deleteCustomer(data, { id: 'c1' }, deps);

  assert.equal(result.ok, true);
  assert.deepEqual(result.data.customers, [other]);
});

test('R-04 deleteCustomer with 3 orders returns reason customer-has-orders, orderCount 3, and no data', { skip }, () => {
  const orders = [
    anOrder({ id: 'o1', number: 'ORD-0001' }),
    anOrder({ id: 'o2', number: 'ORD-0002' }),
    anOrder({ id: 'o3', number: 'ORD-0003' }),
  ];
  const data = dataWith([aCustomer()], orders);

  const result = deleteCustomer(data, { id: 'c1' }, deps);

  assert.deepEqual(result, { ok: false, reason: 'customer-has-orders', orderCount: 3 });
});

test('R-04 deleteCustomer counts only the orders of that customer', { skip }, () => {
  const orders = [
    anOrder({ id: 'o1', number: 'ORD-0001', customerId: 'c1' }),
    anOrder({ id: 'o2', number: 'ORD-0002', customerId: 'c2' }),
  ];
  const data = dataWith([aCustomer(), aCustomer({ id: 'c2', name: 'Bob' })], orders);

  const result = deleteCustomer(data, { id: 'c1' }, deps);

  assert.deepEqual(result, { ok: false, reason: 'customer-has-orders', orderCount: 1 });
});

test('R-04 deleteCustomer of a customer with orders changes no data', { skip }, () => {
  const data = dataWith([aCustomer()], [anOrder()]);
  const before = structuredClone(data);

  deleteCustomer(data, { id: 'c1' }, deps);

  assert.deepEqual(data, before);
});

test('R-04 deleteCustomer with an unknown id returns reason not-found', { skip }, () => {
  const data = dataWith([aCustomer()]);

  const result = deleteCustomer(data, { id: 'nobody' }, deps);

  assert.deepEqual(result, { ok: false, reason: 'not-found' });
});

const searchable = () =>
  dataWith([
    aCustomer({ id: 'c1', name: 'Ana', email: 'ana@one.ro' }),
    aCustomer({ id: 'c2', name: 'Bob', email: 'bob@ana.ro' }),
    aCustomer({ id: 'c3', name: 'Carol', email: 'carol@two.ro', phone: 'ana-phone', address: 'ana-street' }),
  ]);

test('R-05 searchCustomers with  ANA  finds Ana by name and bob@ana.ro by email', { skip }, () => {
  const found = searchCustomers(searchable(), '  ANA  ', ascending);

  assert.deepEqual(names(found), ['Ana', 'Bob']);
});

test('R-05 searchCustomers matches an email stored in capitals', { skip }, () => {
  const data = dataWith([aCustomer({ name: 'Dan', email: 'DAN@EXAMPLE.COM' })]);

  assert.deepEqual(names(searchCustomers(data, 'dan@ex', ascending)), ['Dan']);
});

test('R-05 searchCustomers does not search the phone or the address', { skip }, () => {
  assert.deepEqual(searchCustomers(searchable(), 'ana-', ascending), []);
});

test('R-05 searchCustomers returns its matches in the order of the compare function it is given', { skip }, () => {
  const found = searchCustomers(searchable(), 'ana', descending);

  assert.deepEqual(names(found), ['Bob', 'Ana']);
});

test('R-05 searchCustomers breaks a tie of that compare function by id', { skip }, () => {
  const data = dataWith([aCustomer({ id: 'c2' }), aCustomer({ id: 'c1' })]);

  const found = searchCustomers(data, 'ana', () => 0);

  assert.deepEqual(found.map(({ id }) => id), ['c1', 'c2']);
});

for (const text of ['', '     ']) {
  test(`R-05 searchCustomers with the text "${text}" returns all customers`, { skip }, () => {
    assert.deepEqual(names(searchCustomers(searchable(), text, ascending)), ['Ana', 'Bob', 'Carol']);
  });
}

test('R-06 customerLabel gives Ana Pop (ana@example.com) for a customer with an email', { skip }, () => {
  assert.equal(customerLabel(aCustomer({ email: 'ana@example.com' })), 'Ana Pop (ana@example.com)');
});

test('R-06 customerLabel gives Ana Pop (no email) for a customer with no email', { skip }, () => {
  assert.equal(customerLabel(aCustomer({ email: '' })), 'Ana Pop (no email)');
});
