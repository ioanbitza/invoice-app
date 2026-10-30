import test from 'node:test';
import assert from 'node:assert/strict';
import { hasValidShape } from '../src/storage/shape.js';

const document = () => ({
  nextOrderNumber: 2,
  customers: [{ id: 'c1', name: 'Ana', email: '', phone: '', address: '' }],
  orders: [
    {
      id: 'o1',
      number: 'ORD-0001',
      customerId: 'c1',
      date: '2026-10-30',
      notes: '',
      lines: [{ id: 'l1', description: 'Widget', quantity: 2, unitPriceCents: 500 }],
    },
  ],
});

test('R-20 hasValidShape accepts a complete document', () => {
  assert.equal(hasValidShape(document()), true);
});

test('R-20 hasValidShape refuses a missing field', () => {
  const doc = document();
  delete doc.customers[0].email;
  assert.equal(hasValidShape(doc), false);
});

test('R-20 hasValidShape refuses a quantity that is not a safe integer', () => {
  const doc = document();
  doc.orders[0].lines[0].quantity = 1.5;
  assert.equal(hasValidShape(doc), false);
});

test('R-20 hasValidShape refuses an order number that is not ORD- and digits', () => {
  const doc = document();
  doc.orders[0].number = 'X-1';
  assert.equal(hasValidShape(doc), false);
});

test('R-20 hasValidShape refuses a customerId with no customer', () => {
  const doc = document();
  doc.orders[0].customerId = 'nobody';
  assert.equal(hasValidShape(doc), false);
});

test('R-20 hasValidShape refuses a nextOrderNumber not above every order number', () => {
  const doc = document();
  doc.nextOrderNumber = 1;
  assert.equal(hasValidShape(doc), false);
});

test('R-20 hasValidShape refuses null and arrays', () => {
  assert.equal(hasValidShape(null), false);
  assert.equal(hasValidShape([]), false);
});

const refused = (change) => {
  const doc = document();
  change(doc);
  return hasValidShape(doc) === false;
};

test('R-20 hasValidShape refuses a date that is not a real YYYY-MM-DD day', () => {
  assert.ok(refused((doc) => (doc.orders[0].date = 'not-a-date')));
  assert.ok(refused((doc) => (doc.orders[0].date = '2026-02-30')));
});

test('R-20 hasValidShape refuses a negative quantity or unit price', () => {
  assert.ok(refused((doc) => (doc.orders[0].lines[0].quantity = -1)));
  assert.ok(refused((doc) => (doc.orders[0].lines[0].unitPriceCents = -50)));
});

test('R-20 hasValidShape refuses a line total or an order total that is not a safe integer', () => {
  assert.ok(
    refused((doc) => {
      doc.orders[0].lines[0].quantity = Number.MAX_SAFE_INTEGER;
      doc.orders[0].lines[0].unitPriceCents = 2;
    }),
  );
  assert.ok(
    refused((doc) => {
      const big = { id: 'l2', description: 'Big', quantity: 1, unitPriceCents: Number.MAX_SAFE_INTEGER };
      doc.orders[0].lines = [big, { ...big, id: 'l3' }];
    }),
  );
});

test('R-06 hasValidShape refuses a nextOrderNumber below 1 or too large to add 1 to', () => {
  assert.ok(refused((doc) => ((doc.orders = []), (doc.nextOrderNumber = -5))));
  assert.ok(refused((doc) => ((doc.orders = []), (doc.nextOrderNumber = 0))));
  assert.ok(refused((doc) => ((doc.orders = []), (doc.nextOrderNumber = Number.MAX_SAFE_INTEGER))));
});

test('R-06 hasValidShape refuses order numbers that are not the four-digit form or have value 0', () => {
  assert.ok(refused((doc) => ((doc.orders[0].number = 'ORD-1'), (doc.nextOrderNumber = 5))));
  assert.ok(refused((doc) => ((doc.orders[0].number = 'ORD-0000'), (doc.nextOrderNumber = 5))));
});

test('R-20 hasValidShape refuses two orders with the same sequence in different spellings', () => {
  const doc = document();
  doc.nextOrderNumber = 3;
  doc.orders.push({ ...structuredClone(doc.orders[0]), id: 'o2', number: 'ORD-00001', lines: [] });
  assert.equal(hasValidShape(doc), false);
});

test('R-20 hasValidShape refuses an empty id, the id new and an id with characters outside a-z, 0-9, - and _', () => {
  assert.ok(refused((doc) => (doc.customers[0].id = '')));
  assert.ok(refused((doc) => ((doc.customers[0].id = 'new'), (doc.orders[0].customerId = 'new'))));
  assert.ok(refused((doc) => ((doc.customers[0].id = 'a b'), (doc.orders[0].customerId = 'a b'))));
  assert.ok(refused((doc) => (doc.orders[0].lines[0].id = '')));
  assert.ok(refused((doc) => (doc.orders[0].id = 'a/b')));
});

test('R-20 hasValidShape accepts a UUID as an id', () => {
  const doc = document();
  doc.customers[0].id = '3f2b8c1e-9d4a-4e6f-8a1b-0c2d3e4f5a6b';
  doc.orders[0].customerId = doc.customers[0].id;
  assert.equal(hasValidShape(doc), true);
});

test('R-29 hasValidShape refuses a key the document does not define, at every level', () => {
  assert.ok(refused((doc) => (doc.backup = { name: 'Ion' })));
  assert.ok(refused((doc) => (doc.customers[0].nationalId = '1')));
  assert.ok(refused((doc) => (doc.orders[0].extra = 1)));
  assert.ok(refused((doc) => (doc.orders[0].lines[0].extra = 1)));
});

test('R-20 hasValidShape refuses a duplicate id or order number', () => {
  const doc = document();
  doc.customers.push({ ...doc.customers[0] });
  assert.equal(hasValidShape(doc), false);
  const orders = document();
  orders.nextOrderNumber = 3;
  orders.orders.push({ ...structuredClone(orders.orders[0]), id: 'o2', lines: [] });
  assert.equal(hasValidShape(orders), false);
});

test('R-20 hasValidShape accepts a name of 500 characters, because form rules are not checked', () => {
  const doc = document();
  doc.customers[0].name = 'n'.repeat(500);
  assert.equal(hasValidShape(doc), true);
});
