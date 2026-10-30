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
  assert.ok(result.purpose.endsWith('The data is used for nothing else.'));
  assert.ok(result.retention.includes('there is no fixed period'));
});

test('R-29 buildCustomerExport with an unknown id returns not-found', () => {
  assert.deepEqual(buildCustomerExport(data, 'zz'), { ok: false, reason: 'not-found' });
});

test('R-31 exportFileName holds the id and no name', () => {
  assert.equal(exportFileName('c1'), 'customer-c1.json');
});
