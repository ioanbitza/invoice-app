import test from 'node:test';
import assert from 'node:assert/strict';
import { createCustomer, updateCustomer, deleteCustomer, listCustomers, searchCustomers, customerLabel } from '../src/domain/customers.js';

const deps = { newId: () => 'new-id', today: '2026-10-30' };
const aCustomer = (over = {}) => ({ id: 'c1', name: 'Ana Pop', email: '', phone: '', address: '', ...over });
const dataWith = (customers, orders = []) => ({ nextOrderNumber: 1, customers, orders });
const ascending = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

test('R-01 createCustomer stores the trimmed fields under the id from deps.newId', () => {
  const data = dataWith([]);
  const before = structuredClone(data);
  const result = createCustomer(data, { name: ' Bob ', email: '', phone: '', address: '' }, deps);
  assert.equal(result.ok, true);
  assert.deepEqual(result.data.customers, [{ id: 'new-id', name: 'Bob', email: '', phone: '', address: '' }]);
  assert.deepEqual(data, before);
});

test('R-01 createCustomer with an invalid email returns the errors and no data', () => {
  const result = createCustomer(dataWith([]), { name: 'Bob', email: 'ab.c' }, deps);
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].field, 'email');
  assert.equal(result.data, undefined);
});

test('R-02 updateCustomer changes that customer only', () => {
  const other = aCustomer({ id: 'c2', name: 'Bob' });
  const result = updateCustomer(dataWith([aCustomer(), other]), { id: 'c1', name: 'Ana M', email: '' }, deps);
  assert.equal(result.data.customers[0].name, 'Ana M');
  assert.deepEqual(result.data.customers[1], other);
});

test('R-02 updateCustomer with an invalid name returns the errors and no data', () => {
  const result = updateCustomer(dataWith([aCustomer()]), { id: 'c1', name: '' }, deps);
  assert.equal(result.ok, false);
  assert.equal(result.data, undefined);
});

test('R-02 updateCustomer with an unknown id returns reason not-found', () => {
  assert.deepEqual(updateCustomer(dataWith([]), { id: 'x', name: 'A' }, deps), { ok: false, reason: 'not-found' });
});

test('R-03 listCustomers orders by the compare function, ties by id', () => {
  const data = dataWith([aCustomer({ id: 'c2', name: 'B' }), aCustomer({ id: 'c3', name: 'A' }), aCustomer({ id: 'c1', name: 'B' })]);
  const byName = ascending;
  assert.deepEqual(listCustomers(data, byName).map((c) => c.id), ['c3', 'c1', 'c2']);
});

test('R-04 deleteCustomer removes a customer with no orders', () => {
  const result = deleteCustomer(dataWith([aCustomer()]), { id: 'c1' }, deps);
  assert.deepEqual(result.data.customers, []);
});

test('R-04 deleteCustomer with orders returns customer-has-orders and the count', () => {
  const orders = [{ customerId: 'c1' }, { customerId: 'c1' }, { customerId: 'c2' }];
  assert.deepEqual(deleteCustomer(dataWith([aCustomer()], orders), { id: 'c1' }, deps), {
    ok: false,
    reason: 'customer-has-orders',
    orderCount: 2,
  });
});

test('R-04 deleteCustomer with an unknown id returns reason not-found', () => {
  assert.deepEqual(deleteCustomer(dataWith([]), { id: 'x' }, deps), { ok: false, reason: 'not-found' });
});

test('R-05 searchCustomers trims, ignores case, matches name or email only', () => {
  const data = dataWith([
    aCustomer({ id: 'c1', name: 'Ana' }),
    aCustomer({ id: 'c2', name: 'Bob', email: 'bob@ana.ro' }),
    aCustomer({ id: 'c3', name: 'Cy', phone: 'ana' }),
  ]);
  const byName = ascending;
  assert.deepEqual(searchCustomers(data, '  ANA  ', byName).map((c) => c.id), ['c1', 'c2']);
  assert.equal(searchCustomers(data, '   ', byName).length, 3);
});

test('R-06 customerLabel shows the email or (no email)', () => {
  assert.equal(customerLabel(aCustomer({ email: 'ana@example.com' })), 'Ana Pop (ana@example.com)');
  assert.equal(customerLabel(aCustomer()), 'Ana Pop (no email)');
});
