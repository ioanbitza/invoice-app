import test from 'node:test';
import assert from 'node:assert/strict';
import { addLine, updateLine, removeLine } from '../src/domain/lines.js';
import { orderTotalCents } from '../src/domain/money.js';

const deps = { newId: () => 'new-line', today: '2026-10-30' };
const line = (over = {}) => ({ id: 'l1', description: 'Widget', quantity: 2, unitPriceCents: 500, ...over });
const order = (lines) => ({ id: 'o1', number: 'ORD-0001', customerId: 'c1', date: '2026-10-30', notes: '', lines });
const dataWith = (lines) => ({ nextOrderNumber: 2, customers: [], orders: [order(lines)] });
const input = (over = {}) => ({ orderId: 'o1', description: 'Gadget', quantity: '3', unitPrice: '19.99', ...over });

test('R-11 addLine appends a parsed line with the id from deps.newId', () => {
  const result = addLine(dataWith([line()]), input(), deps);
  assert.deepEqual(result.data.orders[0].lines[1], { id: 'new-line', description: 'Gadget', quantity: 3, unitPriceCents: 1999 });
});

test('R-11 addLine with an invalid quantity returns the errors and no data', () => {
  const result = addLine(dataWith([]), input({ quantity: '0' }), deps);
  assert.equal(result.ok, false);
  assert.equal(result.data, undefined);
});

test('R-12 updateLine changes that line only and keeps its position', () => {
  const data = dataWith([line({ id: 'a' }), line({ id: 'b' }), line({ id: 'c' })]);
  const result = updateLine(data, input({ lineId: 'b' }), deps);
  assert.deepEqual(result.data.orders[0].lines.map((l) => l.description), ['Widget', 'Gadget', 'Widget']);
});

test('R-12 updateLine with an unknown line id returns reason not-found', () => {
  assert.deepEqual(updateLine(dataWith([line()]), input({ lineId: 'x' }), deps), { ok: false, reason: 'not-found' });
});

test('R-13 removeLine takes the line out and the total falls by its line total', () => {
  const data = dataWith([line({ id: 'a' }), line({ id: 'b', quantity: 1, unitPriceCents: 300 })]);
  const result = removeLine(data, { orderId: 'o1', lineId: 'b' }, deps);
  assert.equal(orderTotalCents(result.data.orders[0]), 1000);
});

test('R-11 addLine keeps the lines in the order they were added', () => {
  const first = addLine(dataWith([]), input({ description: 'First' }), deps);
  const second = addLine(first.data, input({ description: 'Second' }), deps);
  assert.deepEqual(second.data.orders[0].lines.map((l) => l.description), ['First', 'Second']);
});

test('R-12 updateLine with an invalid price returns the errors and no data', () => {
  const result = updateLine(dataWith([line()]), input({ lineId: 'l1', unitPrice: '1,234.50' }), deps);
  assert.equal(result.ok, false);
  assert.equal(result.data, undefined);
  assert.equal(result.errors[0].field, 'unitPrice');
});

test('R-13 removeLine of the only line leaves an order that totals 0', () => {
  const result = removeLine(dataWith([line()]), { orderId: 'o1', lineId: 'l1' }, deps);
  assert.equal(result.ok, true);
  assert.equal(orderTotalCents(result.data.orders[0]), 0);
});

test('R-15 addLine accepts a total of exactly Number.MAX_SAFE_INTEGER', () => {
  const data = dataWith([line({ quantity: 1, unitPriceCents: 9007199254740990 })]);
  const result = addLine(data, input({ quantity: '1', unitPrice: '0.01' }), deps);
  assert.equal(result.ok, true);
  assert.equal(orderTotalCents(result.data.orders[0]), Number.MAX_SAFE_INTEGER);
});

test('R-15 addLine refuses a total one cent above Number.MAX_SAFE_INTEGER', () => {
  const data = dataWith([line({ quantity: 1, unitPriceCents: 9007199254740990 })]);
  const result = addLine(data, input({ quantity: '1', unitPrice: '0.02' }), deps);
  assert.equal(result.errors[0].code, 'line.total.too-large');
});

test('R-15 updateLine refuses a total beyond a safe integer on unitPrice', () => {
  const data = dataWith([line({ id: 'a', quantity: 1, unitPriceCents: 9007199254740990 }), line({ id: 'b', quantity: 1, unitPriceCents: 1 })]);
  const result = updateLine(data, input({ lineId: 'b', quantity: '1', unitPrice: '0.02' }), deps);
  assert.equal(result.errors[0].code, 'line.total.too-large');
  assert.equal(result.errors[0].field, 'unitPrice');
});

test('R-15 addLine refuses a total beyond a safe integer on unitPrice', () => {
  const big = Array.from({ length: 9008 }, (_, i) => line({ id: `b${i}`, quantity: 9999, unitPriceCents: 100000000 }));
  const result = addLine(dataWith(big), input({ quantity: '1001', unitPrice: '1000000.00' }), deps);
  assert.equal(result.errors[0].code, 'line.total.too-large');
  assert.equal(result.errors[0].field, 'unitPrice');
});
