import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCustomerExport, exportFileName } from '../src/domain/export.js';

const ana = { id: 'c1', name: 'Ana', email: 'a@x.ro', phone: '1', address: 'Cluj' };
const other = { id: 'c2', name: 'Bob', email: '', phone: '', address: '' };
const orderOf = (id, customerId) => ({ id, number: 'ORD-0001', customerId, date: '2026-10-30', notes: '', lines: [{ id: `l-${id}`, description: 'x', quantity: 1, unitPriceCents: 5 }] });
const data = { nextOrderNumber: 3, customers: [ana, other], orders: [orderOf('o1', 'c1'), orderOf('o2', 'c2')] };

test('R-29 buildCustomerExport holds the customer and only their orders with lines', () => {
  const result = buildCustomerExport(data, 'c1');
  assert.deepEqual(result.customer, ana);
  assert.deepEqual(result.orders, [orderOf('o1', 'c1')]);
  assert.equal(result.currency, 'EUR');
});

test('R-29 buildCustomerExport states A-13 purpose and A-14 retention', () => {
  const result = buildCustomerExport(data, 'c1');
  assert.equal(result.purpose, '`name`, `email`, `phone` and `address` identify and contact the customer an order belongs to; `id` and `customerId` link orders to that customer; `notes` and line `description` record what the order is about and should not hold details about other people. The data is used for nothing else.');
  assert.equal(result.retention, 'a customer and their orders are kept until the user deletes them; there is no fixed period. The app deletes nothing by itself; the user applies this rule with R-04 and R-08. No legal retention applies while the app issues no invoices (A-10).');
});

test('R-29 buildCustomerExport with an unknown id returns not-found', () => {
  assert.deepEqual(buildCustomerExport(data, 'zz'), { ok: false, reason: 'not-found' });
});

test('R-31 exportFileName holds the id and no name', () => {
  assert.equal(exportFileName('c1'), 'customer-c1.json');
});
