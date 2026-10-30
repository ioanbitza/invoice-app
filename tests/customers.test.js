import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCustomer, addCustomer, updateCustomer, deleteCustomer,
  searchCustomers, sortCustomers,
} from '../src/domain/customers.js';

function emptyState() {
  return { version: 1, nextOrderNumber: 1, customers: [], orders: [] };
}

function stateWith(customers, orders = []) {
  return { version: 1, nextOrderNumber: 1, customers, orders };
}

const ana = { id: 'c1', name: 'Ana Pop', email: 'ana@example.com', phone: '' };

test('R-01 adds a customer with a trimmed name and empty optional email and phone', () => {
  const result = addCustomer(emptyState(), { name: '  Ana Pop  ' }, 'c1');
  assert.equal(result.ok, true);
  assert.deepEqual(result.state.customers, [{ id: 'c1', name: 'Ana Pop', email: '', phone: '' }]);
});

test('R-01 does not change the input state', () => {
  const state = emptyState();
  addCustomer(state, { name: 'Ana' }, 'c1');
  assert.deepEqual(state.customers, []);
});

test('R-01 customer list is sorted by name, case-insensitive', () => {
  const list = [{ name: 'bob' }, { name: 'Ana' }, { name: 'Zed' }, { name: 'adam' }];
  assert.deepEqual(sortCustomers(list).map((c) => c.name), ['adam', 'Ana', 'bob', 'Zed']);
  assert.deepEqual(list.map((c) => c.name), ['bob', 'Ana', 'Zed', 'adam']);
});

test('R-02 refuses an empty or whitespace-only name and saves nothing', () => {
  for (const name of ['', '   ']) {
    const result = addCustomer(emptyState(), { name }, 'c1');
    assert.equal(result.ok, false);
    assert.ok(result.errors.name);
  }
  assert.equal(validateCustomer({ name: '  ' }).name, 'Name is required');
});

test('R-02 refuses an email without exactly one @, without text on both sides, or without a dot after @', () => {
  for (const email of ['abc', 'a@@b.com', 'a@b@c.com', '@b.com', 'a@', 'a@b', 'a@.', 'a.b@c']) {
    const errors = validateCustomer({ name: 'Ana', email });
    assert.ok(errors.email, `expected ${email} to be refused`);
  }
  assert.deepEqual(validateCustomer({ name: 'Ana', email: 'a@b.c' }), {});
});

test('R-02 accepts an empty email', () => {
  assert.deepEqual(validateCustomer({ name: 'Ana', email: '' }), {});
  assert.deepEqual(validateCustomer({ name: 'Ana', email: '   ' }), {});
  assert.deepEqual(validateCustomer({ name: 'Ana' }), {});
});

test('R-02 refuses a name over 100, an email over 254 and a phone over 30 characters', () => {
  assert.ok(validateCustomer({ name: 'a'.repeat(101) }).name);
  assert.deepEqual(validateCustomer({ name: 'a'.repeat(100) }), {});
  assert.ok(validateCustomer({ name: 'Ana', email: 'a'.repeat(251) + '@b.c' }).email);
  assert.deepEqual(validateCustomer({ name: 'Ana', email: 'a'.repeat(250) + '@b.c' }), {});
  assert.ok(validateCustomer({ name: 'Ana', phone: '1'.repeat(31) }).phone);
  assert.deepEqual(validateCustomer({ name: 'Ana', phone: '1'.repeat(30) }), {});
});

test('R-03 edit keeps the customer id and their orders', () => {
  const orders = [{ id: 'o1', number: 1, customerId: 'c1', date: '2026-01-01', lines: [] }];
  const state = stateWith([ana], orders);
  const result = updateCustomer(state, 'c1', { name: 'Ana P', email: '', phone: '123' });
  assert.equal(result.ok, true);
  assert.deepEqual(result.state.customers, [{ id: 'c1', name: 'Ana P', email: '', phone: '123' }]);
  assert.deepEqual(result.state.orders, orders);
  assert.equal(state.customers[0].name, 'Ana Pop');
});

test('R-03 edit applies the same validation as create', () => {
  const result = updateCustomer(stateWith([ana]), 'c1', { name: ' ', email: 'bad' });
  assert.equal(result.ok, false);
  assert.ok(result.errors.name);
  assert.ok(result.errors.email);
});

test('R-03 edit of an unknown customer is refused', () => {
  const result = updateCustomer(stateWith([ana]), 'nope', { name: 'X' });
  assert.equal(result.ok, false);
  assert.ok(result.errors.customer);
});

test('R-05 delete refuses a customer with orders and reports how many', () => {
  const orders = [
    { id: 'o1', number: 1, customerId: 'c1', date: '2026-01-01', lines: [] },
    { id: 'o2', number: 2, customerId: 'c1', date: '2026-01-02', lines: [] },
    { id: 'o3', number: 3, customerId: 'c2', date: '2026-01-02', lines: [] },
  ];
  const result = deleteCustomer(stateWith([ana], orders), 'c1');
  assert.equal(result.ok, false);
  assert.equal(result.orderCount, 2);
  assert.match(result.errors.orders, /2 orders/);
  assert.match(result.errors.orders, /deleted first/);
});

test('R-05 delete refuses a customer with exactly one order', () => {
  const orders = [{ id: 'o1', number: 1, customerId: 'c1', date: '2026-01-01', lines: [] }];
  const result = deleteCustomer(stateWith([ana], orders), 'c1');
  assert.equal(result.ok, false);
  assert.equal(result.orderCount, 1);
  assert.match(result.errors.orders, /1 order\./);
});

test('R-05 delete removes a customer without orders', () => {
  const other = { id: 'c2', name: 'Bob', email: '', phone: '' };
  const result = deleteCustomer(stateWith([ana, other]), 'c1');
  assert.equal(result.ok, true);
  assert.deepEqual(result.state.customers, [other]);
});

test('R-06 search matches name or email, case-insensitive, trimmed', () => {
  const bob = { id: 'c2', name: 'Bob', email: 'ANA.fan@x.io', phone: '' };
  const cid = { id: 'c3', name: 'Cid', email: '', phone: '' };
  const all = [ana, bob, cid];
  assert.deepEqual(searchCustomers(all, '  ANA ').map((c) => c.id), ['c1', 'c2']);
  assert.deepEqual(searchCustomers(all, 'x.io').map((c) => c.id), ['c2']);
  assert.deepEqual(searchCustomers(all, 'zzz'), []);
});

test('R-06 empty search returns all customers', () => {
  const all = [ana, { id: 'c2', name: 'Bob', email: '', phone: '' }];
  assert.deepEqual(searchCustomers(all, ''), all);
  assert.deepEqual(searchCustomers(all, '   '), all);
});
