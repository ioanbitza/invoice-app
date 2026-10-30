import { CURRENCY } from './money.js';

const PURPOSE = '`name`, `email`, `phone` and `address` identify and contact the customer an order belongs to; `id` and `customerId` link orders to that customer; `notes` and line `description` record what the order is about and should not hold details about other people. The data is used for nothing else.';

const RETENTION = 'a customer and their orders are kept until the user deletes them; there is no fixed period. The app deletes nothing by itself; the user applies this rule with R-04 and R-08. No legal retention applies while the app issues no invoices (A-10).';

export function buildCustomerExport(data, customerId) {
  const customer = data.customers.find((c) => c.id === customerId);
  if (!customer) return { ok: false, reason: 'not-found' };
  const orders = data.orders.filter((o) => o.customerId === customerId);
  return structuredClone({ purpose: PURPOSE, retention: RETENTION, currency: CURRENCY, customer, orders });
}

export function exportFileName(customerId) {
  return `customer-${customerId}.json`;
}
