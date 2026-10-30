import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

// S5 not built yet: every test below is skipped until the builder creates the module, then it runs and must pass.
// orderTotalCents comes from S1, which the plan builds first.
const inDomain = (file) => existsSync(new URL(`../src/domain/${file}`, import.meta.url));
const built = inDomain('lines.js') && inDomain('money.js');
const skip = built ? false : 'S5 not built yet';
const { addLine, updateLine, removeLine } = built ? await import('../src/domain/lines.js') : {};
const { orderTotalCents } = built ? await import('../src/domain/money.js') : {};

// Shapes used here, from ADR-003 `command(data, input, deps)`, with the form's raw strings:
// addLine's input is `{ orderId, description, quantity, unitPrice }`, updateLine's adds `lineId`,
// removeLine's is `{ orderId, lineId }`.
const TOO_LARGE = {
  field: 'unitPrice',
  code: 'line.total.too-large',
  message: 'This would make the order total too large. Lower the price or the quantity.',
};

const countingDeps = () => {
  let count = 0;
  return {
    newId: () => {
      count += 1;
      return `line-${count}`;
    },
    today: '2026-10-30',
  };
};

const aLine = (over = {}) => ({ id: 'l1', description: 'Widget', quantity: 1, unitPriceCents: 100, ...over });
const anOrder = (over = {}) => ({
  id: 'o1',
  number: 'ORD-0001',
  customerId: 'c1',
  date: '2026-10-30',
  notes: '',
  lines: [],
  ...over,
});
const dataWith = (...orders) => ({
  nextOrderNumber: orders.length + 1,
  customers: [{ id: 'c1', name: 'Ana Pop', email: '', phone: '', address: '' }],
  orders,
});
const lineInput = (over = {}) => ({ orderId: 'o1', description: 'Gadget', quantity: '3', unitPrice: '19.99', ...over });

const firstOrder = (result) => result.data.orders[0];
const descriptions = (order) => order.lines.map(({ description }) => description);

// 9008 largest lines total 9007099200000000 cents, 100054740991 below Number.MAX_SAFE_INTEGER (plan S5, Risks).
const nearTheLimit = () =>
  Array.from({ length: 9008 }, (_, index) => aLine({ id: `big-${index}`, quantity: 9999, unitPriceCents: 100000000 }));

test('R-11 addLine appends a line with description, quantity and unitPriceCents and the id from deps.newId', { skip }, () => {
  const result = addLine(dataWith(anOrder()), lineInput(), countingDeps());

  assert.equal(result.ok, true);
  assert.deepEqual(firstOrder(result).lines, [
    { id: 'line-1', description: 'Gadget', quantity: 3, unitPriceCents: 1999 },
  ]);
});

test('R-11 addLine keeps the lines in the order they were added', { skip }, () => {
  const deps = countingDeps();
  const first = addLine(dataWith(anOrder()), lineInput({ description: 'Zebra' }), deps);
  const second = addLine(first.data, lineInput({ description: 'Apple' }), deps);

  const third = addLine(second.data, lineInput({ description: 'Mango' }), deps);

  assert.deepEqual(descriptions(firstOrder(third)), ['Zebra', 'Apple', 'Mango']);
});

test('R-11 addLine adds to the order it names and no other', { skip }, () => {
  const other = anOrder({ id: 'o2', number: 'ORD-0002' });

  const result = addLine(dataWith(anOrder(), other), lineInput(), countingDeps());

  assert.deepEqual(result.data.orders.find(({ id }) => id === 'o2'), other);
});

test('R-11 addLine leaves the input data unchanged', { skip }, () => {
  const data = dataWith(anOrder({ lines: [aLine()] }));
  const before = structuredClone(data);

  addLine(data, lineInput(), countingDeps());

  assert.deepEqual(data, before);
});

test('R-11 addLine with an invalid quantity returns the errors and leaves the order out of the result', { skip }, () => {
  const result = addLine(dataWith(anOrder()), lineInput({ quantity: '0' }), countingDeps());

  assert.equal(result.ok, false);
  assert.deepEqual(result.errors.map(({ field }) => field), ['quantity']);
  assert.equal(result.data, undefined);
});

test('R-11 addLine with an unknown order returns reason not-found', { skip }, () => {
  const result = addLine(dataWith(anOrder()), lineInput({ orderId: 'nothing' }), countingDeps());

  assert.deepEqual(result, { ok: false, reason: 'not-found' });
});

test('R-12 updateLine changes that line', { skip }, () => {
  const data = dataWith(anOrder({ lines: [aLine()] }));
  const input = lineInput({ lineId: 'l1', description: 'Gadget', quantity: '2', unitPrice: '5,50' });

  const result = updateLine(data, input, countingDeps());

  assert.equal(result.ok, true);
  assert.deepEqual(firstOrder(result).lines, [
    { id: 'l1', description: 'Gadget', quantity: 2, unitPriceCents: 550 },
  ]);
});

test('R-12 updateLine leaves the other lines alone and keeps its position', { skip }, () => {
  const before = aLine({ id: 'l1', description: 'First' });
  const after = aLine({ id: 'l3', description: 'Third' });
  const data = dataWith(anOrder({ lines: [before, aLine({ id: 'l2', description: 'Second' }), after] }));

  const result = updateLine(data, lineInput({ lineId: 'l2', description: 'Changed' }), countingDeps());

  assert.deepEqual(descriptions(firstOrder(result)), ['First', 'Changed', 'Third']);
  assert.deepEqual(firstOrder(result).lines[0], before);
  assert.deepEqual(firstOrder(result).lines[2], after);
});

test('R-12 the order total follows updateLine at once', { skip }, () => {
  const data = dataWith(anOrder({ lines: [aLine({ quantity: 1, unitPriceCents: 100 })] }));

  const result = updateLine(data, lineInput({ lineId: 'l1', quantity: '3', unitPrice: '19.99' }), countingDeps());

  assert.equal(orderTotalCents(firstOrder(result)), 5997);
});

test('R-12 updateLine leaves the input data unchanged', { skip }, () => {
  const data = dataWith(anOrder({ lines: [aLine()] }));
  const before = structuredClone(data);

  updateLine(data, lineInput({ lineId: 'l1' }), countingDeps());

  assert.deepEqual(data, before);
});

test('R-12 updateLine with an invalid price returns the errors and no data', { skip }, () => {
  const data = dataWith(anOrder({ lines: [aLine()] }));

  const result = updateLine(data, lineInput({ lineId: 'l1', unitPrice: '1,234.50' }), countingDeps());

  assert.equal(result.ok, false);
  assert.deepEqual(result.errors.map(({ field }) => field), ['unitPrice']);
  assert.equal(result.data, undefined);
});

test('R-12 updateLine with an unknown line id returns reason not-found', { skip }, () => {
  const data = dataWith(anOrder({ lines: [aLine()] }));

  const result = updateLine(data, lineInput({ lineId: 'nothing' }), countingDeps());

  assert.deepEqual(result, { ok: false, reason: 'not-found' });
});

test('R-12 updateLine with an unknown order returns reason not-found', { skip }, () => {
  const data = dataWith(anOrder({ lines: [aLine()] }));

  const result = updateLine(data, lineInput({ orderId: 'nothing', lineId: 'l1' }), countingDeps());

  assert.deepEqual(result, { ok: false, reason: 'not-found' });
});

test('R-13 removeLine takes the line out and orderTotalCents falls by its line total', { skip }, () => {
  const kept = aLine({ id: 'l1', quantity: 2, unitPriceCents: 500 });
  const removed = aLine({ id: 'l2', quantity: 3, unitPriceCents: 1999 });
  const data = dataWith(anOrder({ lines: [kept, removed] }));

  const result = removeLine(data, { orderId: 'o1', lineId: 'l2' }, countingDeps());

  assert.equal(result.ok, true);
  assert.deepEqual(firstOrder(result).lines, [kept]);
  assert.equal(orderTotalCents(firstOrder(result)), 1000);
});

test('R-13 removeLine of the only line leaves an order that totals 0', { skip }, () => {
  const data = dataWith(anOrder({ lines: [aLine()] }));

  const result = removeLine(data, { orderId: 'o1', lineId: 'l1' }, countingDeps());

  assert.deepEqual(firstOrder(result).lines, []);
  assert.equal(orderTotalCents(firstOrder(result)), 0);
});

test('R-13 removeLine leaves the input data unchanged', { skip }, () => {
  const data = dataWith(anOrder({ lines: [aLine()] }));
  const before = structuredClone(data);

  removeLine(data, { orderId: 'o1', lineId: 'l1' }, countingDeps());

  assert.deepEqual(data, before);
});

test('R-13 removeLine with an unknown line id returns reason not-found', { skip }, () => {
  const data = dataWith(anOrder({ lines: [aLine()] }));

  const result = removeLine(data, { orderId: 'o1', lineId: 'nothing' }, countingDeps());

  assert.deepEqual(result, { ok: false, reason: 'not-found' });
});

test('R-15 addLine returns line.total.too-large on unitPrice when the new order total is not a safe integer', { skip }, () => {
  const data = dataWith(anOrder({ lines: nearTheLimit() }));

  const result = addLine(data, lineInput({ quantity: '1001', unitPrice: '1000000.00' }), countingDeps());

  assert.deepEqual(result, { ok: false, errors: [TOO_LARGE] });
});

test('R-15 addLine accepts a line that keeps the new order total a safe integer', { skip }, () => {
  const data = dataWith(anOrder({ lines: nearTheLimit() }));

  const result = addLine(data, lineInput({ quantity: '1000', unitPrice: '1000000.00' }), countingDeps());

  assert.equal(result.ok, true);
  assert.equal(orderTotalCents(firstOrder(result)), 9007199200000000);
});

test('R-15 updateLine returns line.total.too-large on unitPrice when the new order total is not a safe integer', { skip }, () => {
  const small = aLine({ id: 'small' });
  const data = dataWith(anOrder({ lines: [...nearTheLimit(), small] }));

  const result = updateLine(data, lineInput({ lineId: 'small', quantity: '9999', unitPrice: '1000000.00' }), countingDeps());

  assert.deepEqual(result, { ok: false, errors: [TOO_LARGE] });
});

test('R-15 updateLine counts the new order total without the old value of that line', { skip }, () => {
  const data = dataWith(anOrder({ lines: nearTheLimit() }));

  const result = updateLine(data, lineInput({ lineId: 'big-0', quantity: '9999', unitPrice: '1000000.00' }), countingDeps());

  assert.equal(result.ok, true);
  assert.equal(orderTotalCents(firstOrder(result)), 9007099200000000);
});
