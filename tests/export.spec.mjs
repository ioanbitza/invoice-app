import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

// S6 not built yet: every test below is skipped until the builder creates the module, then it runs and must pass.
const built = existsSync(new URL('../src/domain/export.js', import.meta.url));
const skip = built ? false : 'S6 not built yet';
const { buildCustomerExport, exportFileName } = built ? await import('../src/domain/export.js') : {};

const ana = { id: 'id-of-ana', name: 'Ana Pop', email: 'ana@example.com', phone: '0722', address: 'Cluj' };
const zelda = { id: 'id-of-zelda', name: 'Zelda Other', email: 'zelda@other.ro', phone: '0733', address: 'Iasi' };

const anasFirstOrder = {
  id: 'order-a1',
  number: 'ORD-0001',
  customerId: 'id-of-ana',
  date: '2026-10-12',
  notes: 'Rush',
  lines: [
    { id: 'line-a1', description: 'Widget', quantity: 3, unitPriceCents: 1999 },
    { id: 'line-a2', description: 'Gadget', quantity: 1, unitPriceCents: 10 },
  ],
};
const anasSecondOrder = {
  id: 'order-a2',
  number: 'ORD-0003',
  customerId: 'id-of-ana',
  date: '2026-10-30',
  notes: '',
  lines: [],
};
const zeldasOrder = {
  id: 'order-z1',
  number: 'ORD-0002',
  customerId: 'id-of-zelda',
  date: '2026-10-20',
  notes: 'for Zelda',
  lines: [{ id: 'line-z1', description: 'Zelda line', quantity: 1, unitPriceCents: 500 }],
};

const someData = () => ({
  nextOrderNumber: 4,
  customers: [ana, zelda],
  orders: [anasFirstOrder, zeldasOrder, anasSecondOrder],
});

const plainText = (text) => text.replaceAll('`', '');

test('R-29 buildCustomerExport holds the customer\'s fields', { skip }, () => {
  assert.deepEqual(buildCustomerExport(someData(), 'id-of-ana').customer, ana);
});

test('R-29 buildCustomerExport holds all their orders with their lines', { skip }, () => {
  assert.deepEqual(buildCustomerExport(someData(), 'id-of-ana').orders, [anasFirstOrder, anasSecondOrder]);
});

test('R-29 buildCustomerExport of a customer with no orders holds an empty order list', { skip }, () => {
  const data = { nextOrderNumber: 1, customers: [ana], orders: [] };

  assert.deepEqual(buildCustomerExport(data, 'id-of-ana').orders, []);
});

test('R-29 buildCustomerExport holds purpose, retention, currency, customer and orders and nothing else', { skip }, () => {
  const fields = Object.keys(buildCustomerExport(someData(), 'id-of-ana')).sort();

  assert.deepEqual(fields, ['currency', 'customer', 'orders', 'purpose', 'retention']);
});

test('R-29 buildCustomerExport holds no data of another customer', { skip }, () => {
  const text = JSON.stringify(buildCustomerExport(someData(), 'id-of-ana'));

  for (const other of ['Zelda', 'zelda', '0733', 'Iasi', 'ORD-0002', 'order-z1', 'line-z1']) {
    assert.equal(text.includes(other), false, other);
  }
});

test('R-29 buildCustomerExport states the purpose of A-13', { skip }, () => {
  const { purpose } = buildCustomerExport(someData(), 'id-of-ana');

  assert.match(plainText(purpose), /name, email, phone and address identify and contact the customer an order belongs to/);
  assert.match(plainText(purpose), /id and customerId link orders to that customer/);
  assert.match(plainText(purpose), /notes and line description record what the order is about/);
  assert.match(plainText(purpose), /The data is used for nothing else\./);
});

test('R-29 buildCustomerExport states the retention of A-14', { skip }, () => {
  const { retention } = buildCustomerExport(someData(), 'id-of-ana');

  assert.match(plainText(retention), /a customer and their orders are kept until the user deletes them/);
  assert.match(plainText(retention), /there is no fixed period/);
  assert.match(plainText(retention), /No legal retention applies while the app issues no invoices/);
});

test('R-29 buildCustomerExport states the currency EUR', { skip }, () => {
  assert.equal(buildCustomerExport(someData(), 'id-of-ana').currency, 'EUR');
});

test('R-29 buildCustomerExport leaves the input data unchanged', { skip }, () => {
  const data = someData();
  const before = structuredClone(data);

  buildCustomerExport(data, 'id-of-ana');

  assert.deepEqual(data, before);
});

test('R-29 buildCustomerExport with an unknown id returns reason not-found', { skip }, () => {
  assert.deepEqual(buildCustomerExport(someData(), 'nobody'), { ok: false, reason: 'not-found' });
});

test('R-31 exportFileName gives customer-<id>.json and holds no name', { skip }, () => {
  assert.equal(exportFileName('id-of-ana'), 'customer-id-of-ana.json');
});
