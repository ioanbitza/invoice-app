import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateLine, addLine, updateLine, removeLine } from '../src/domain/lines.js';
import { orderTotalCents } from '../src/domain/money.js';

function stateWith(lines = []) {
  const order = { id: 'o1', number: 1, customerId: 'c1', date: '2026-01-01', lines };
  return { version: 1, nextOrderNumber: 2, customers: [], orders: [order] };
}

const good = { description: 'Design', quantity: '2', unitPrice: '12.5' };

test('R-11 adds a line with description, quantity and unit price in cents to its order', () => {
  const result = addLine(stateWith(), 'o1', good, 'l1');
  assert.equal(result.ok, true);
  assert.deepEqual(result.state.orders[0].lines, [
    { id: 'l1', description: 'Design', quantity: 2, unitPriceCents: 1250 },
  ]);
});

test('R-11 lines keep the order in which they were added', () => {
  const first = addLine(stateWith(), 'o1', { ...good, description: 'First' }, 'l1');
  const second = addLine(first.state, 'o1', { ...good, description: 'Second' }, 'l2');
  assert.deepEqual(second.state.orders[0].lines.map((l) => l.id), ['l1', 'l2']);
});

test('R-11 refuses a line for an unknown order and leaves the state alone', () => {
  const state = stateWith();
  const result = addLine(state, 'nope', good, 'l1');
  assert.equal(result.ok, false);
  assert.ok(result.errors.order);
  assert.deepEqual(state.orders[0].lines, []);
});

test('R-12 refuses an empty description and one over 200 characters', () => {
  assert.ok(validateLine({ ...good, description: '   ' }).errors.description);
  assert.ok(validateLine({ ...good, description: 'a'.repeat(201) }).errors.description);
  assert.deepEqual(validateLine({ ...good, description: 'a'.repeat(200) }).errors, {});
  const result = addLine(stateWith(), 'o1', { ...good, description: '' }, 'l1');
  assert.equal(result.ok, false);
  assert.ok(result.errors.description);
});

test('R-12 refuses quantity 0, 10000, "1.5" and non-numbers', () => {
  for (const quantity of ['0', '10000', '1.5', 'abc', '', '-1', '1e2', ' ']) {
    assert.ok(validateLine({ ...good, quantity }).errors.quantity, `quantity ${quantity}`);
  }
  assert.deepEqual(validateLine({ ...good, quantity: '1' }).errors, {});
  assert.deepEqual(validateLine({ ...good, quantity: '9999' }).errors, {});
  assert.equal(validateLine({ ...good, quantity: ' 7 ' }).line.quantity, 7);
});

test('R-12 refuses a unit price with three decimals', () => {
  const result = addLine(stateWith(), 'o1', { ...good, unitPrice: '12.345' }, 'l1');
  assert.equal(result.ok, false);
  assert.ok(result.errors.unitPrice);
});

test('R-12 refuses a price with a comma, saving nothing', () => {
  const result = addLine(stateWith(), 'o1', { ...good, unitPrice: '12,50' }, 'l1');
  assert.equal(result.ok, false);
  assert.equal(result.errors.unitPrice, 'Use a dot for decimals, e.g. 12.50');
});

test('R-12 stores unit price "12.5" as 1250 cents', () => {
  const { errors, line } = validateLine({ ...good, unitPrice: '12.5' });
  assert.deepEqual(errors, {});
  assert.equal(line.unitPriceCents, 1250);
});

test('R-13 edit keeps the line id and position and applies the same validation', () => {
  const lines = [
    { id: 'l1', description: 'A', quantity: 1, unitPriceCents: 100 },
    { id: 'l2', description: 'B', quantity: 1, unitPriceCents: 200 },
    { id: 'l3', description: 'C', quantity: 1, unitPriceCents: 300 },
  ];
  const state = stateWith(lines);
  const result = updateLine(state, 'o1', 'l2', { description: 'B2', quantity: '3', unitPrice: '0.10' });
  assert.equal(result.ok, true);
  assert.deepEqual(result.state.orders[0].lines[1], { id: 'l2', description: 'B2', quantity: 3, unitPriceCents: 10 });
  assert.deepEqual(result.state.orders[0].lines.map((l) => l.id), ['l1', 'l2', 'l3']);
  assert.equal(state.orders[0].lines[1].description, 'B');
  const bad = updateLine(state, 'o1', 'l2', { description: '', quantity: '0', unitPrice: 'x' });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.description && bad.errors.quantity && bad.errors.unitPrice);
});

test('R-13 edit of an unknown line is refused', () => {
  const result = updateLine(stateWith(), 'o1', 'nope', good);
  assert.equal(result.ok, false);
  assert.ok(result.errors.line);
});

test('R-14 removing a line drops it and the order total goes down by its line total', () => {
  const lines = [
    { id: 'l1', description: 'A', quantity: 2, unitPriceCents: 1250 },
    { id: 'l2', description: 'B', quantity: 3, unitPriceCents: 100 },
  ];
  const state = stateWith(lines);
  const result = removeLine(state, 'o1', 'l1');
  assert.equal(result.ok, true);
  assert.deepEqual(result.state.orders[0].lines.map((l) => l.id), ['l2']);
  assert.equal(orderTotalCents(state.orders[0]) - orderTotalCents(result.state.orders[0]), 2500);
  assert.equal(removeLine(state, 'o1', 'nope').ok, false);
});
