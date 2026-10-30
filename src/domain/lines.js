import { validateLine } from './validation.js';
import { lineTotalCents } from './money.js';

const NOT_FOUND = Object.freeze({ ok: false, reason: 'not-found' });
const TOO_LARGE = Object.freeze({
  field: 'unitPrice',
  code: 'line.total.too-large',
  message: 'This would make the order total too large. Lower the price or the quantity.',
});

function findOrder(data, orderId) {
  return data.orders.find((o) => o.id === orderId);
}

function hasLine(order, lineId) {
  return order.lines.some((l) => l.id === lineId);
}

function sumIsExact(lines) {
  const sum = lines.reduce((total, line) => total + lineTotalCents(line.quantity, line.unitPriceCents), 0);
  return Number.isSafeInteger(sum);
}

function withLines(data, order, lines) {
  const orders = data.orders.map((o) => (o.id === order.id ? { ...o, lines } : o));
  return { ok: true, data: { ...data, orders } };
}

function saveLines(data, order, lines) {
  if (!sumIsExact(lines)) return { ok: false, errors: [TOO_LARGE] };
  return withLines(data, order, lines);
}

/** Appends a line to the order input.orderId (R-11); refuses a total that is not exact (R-15). */
export function addLine(data, input, deps) {
  const order = findOrder(data, input.orderId);
  if (order === undefined) return NOT_FOUND;
  const checked = validateLine(input);
  if (!checked.ok) return { ok: false, errors: checked.errors };
  return saveLines(data, order, [...order.lines, { id: deps.newId(), ...checked.value }]);
}

/** Changes the line input.lineId in place, keeping its id and position (R-12, R-15). */
export function updateLine(data, input, deps) {
  const order = findOrder(data, input.orderId);
  if (order === undefined || !hasLine(order, input.lineId)) return NOT_FOUND;
  const checked = validateLine(input);
  if (!checked.ok) return { ok: false, errors: checked.errors };
  const lines = order.lines.map((l) => (l.id === input.lineId ? { id: l.id, ...checked.value } : l));
  return saveLines(data, order, lines);
}

/** Takes the line input.lineId out of the order (R-13). */
export function removeLine(data, input, deps) {
  const order = findOrder(data, input.orderId);
  if (order === undefined || !hasLine(order, input.lineId)) return NOT_FOUND;
  return withLines(data, order, order.lines.filter((l) => l.id !== input.lineId));
}
