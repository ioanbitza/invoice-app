export const CURRENCY = 'EUR';
export const MAX_UNIT_PRICE_CENTS = 100000000;
export const MAX_QUANTITY = 9999;

const PRICE_PATTERN = /^(\d+)(?:[.,](\d{1,2}))?$/;

/** Returns whole cents, or null when the text is not an accepted price (R-11). */
export function parsePriceToCents(text) {
  const match = PRICE_PATTERN.exec(text.trim());
  if (match === null) return null;
  const whole = Number(match[1]);
  const decimals = Number((match[2] ?? '').padEnd(2, '0'));
  const cents = whole * 100 + decimals;
  if (!Number.isSafeInteger(cents) || cents > MAX_UNIT_PRICE_CENTS) return null;
  return cents;
}

export function priceInputText(cents) {
  const whole = Math.floor(cents / 100);
  const decimals = String(cents % 100).padStart(2, '0');
  return `${whole}.${decimals}`;
}

function requireSafeInteger(value, what) {
  if (!Number.isSafeInteger(value)) throw new Error(`${what} is not a safe integer`);
  return value;
}

export function lineTotalCents(quantity, unitPriceCents) {
  return requireSafeInteger(quantity * unitPriceCents, 'Line total');
}

export function orderTotalCents(order) {
  const sum = order.lines.reduce((total, line) => total + lineTotalCents(line.quantity, line.unitPriceCents), 0);
  return requireSafeInteger(sum, 'Order total');
}
