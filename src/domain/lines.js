import { parseEuros } from './money.js';

const MAX_DESCRIPTION = 200;
const MAX_QUANTITY = 9999;
const WHOLE_NUMBER = /^\d+$/;

export function validateLine(input) {
  const errors = {};
  const description = String(input.description ?? '').trim();
  if (description === '') errors.description = 'Description is required';
  else if (description.length > MAX_DESCRIPTION) {
    errors.description = `Description must be at most ${MAX_DESCRIPTION} characters`;
  }

  const quantityText = String(input.quantity ?? '').trim();
  const quantity = Number(quantityText);
  if (!WHOLE_NUMBER.test(quantityText) || quantity < 1 || quantity > MAX_QUANTITY) {
    errors.quantity = `Quantity must be a whole number from 1 to ${MAX_QUANTITY}`;
  }

  const price = parseEuros(String(input.unitPrice ?? ''));
  if (!price.ok) errors.unitPrice = price.error;

  if (Object.keys(errors).length > 0) return { errors };
  return { errors, line: { description, quantity, unitPriceCents: price.cents } };
}

function changeOrder(state, orderId, change) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, errors: { order: 'Order not found' } };
  const changed = change(order);
  if (!changed.ok) return changed;
  const orders = state.orders.map((o) => (o.id === orderId ? { ...o, lines: changed.lines } : o));
  return { ok: true, state: { ...state, orders } };
}

export function addLine(state, orderId, input, newId) {
  return changeOrder(state, orderId, (order) => {
    const { errors, line } = validateLine(input);
    if (!line) return { ok: false, errors };
    return { ok: true, lines: [...order.lines, { id: newId, ...line }] };
  });
}

export function updateLine(state, orderId, lineId, input) {
  return changeOrder(state, orderId, (order) => {
    if (!order.lines.some((l) => l.id === lineId)) {
      return { ok: false, errors: { line: 'Line not found' } };
    }
    const { errors, line } = validateLine(input);
    if (!line) return { ok: false, errors };
    return { ok: true, lines: order.lines.map((l) => (l.id === lineId ? { id: lineId, ...line } : l)) };
  });
}

export function removeLine(state, orderId, lineId) {
  return changeOrder(state, orderId, (order) => {
    if (!order.lines.some((l) => l.id === lineId)) {
      return { ok: false, errors: { line: 'Line not found' } };
    }
    return { ok: true, lines: order.lines.filter((l) => l.id !== lineId) };
  });
}
