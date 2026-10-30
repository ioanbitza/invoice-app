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
