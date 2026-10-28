const MAX_CENTS = 100000000;
const COMMA_MESSAGE = 'Use a dot for decimals, e.g. 12.50';
const FORMAT_MESSAGE = 'Enter an amount like 12.50, with at most two decimals';
const RANGE_MESSAGE = 'Amount must be between 0.00 and 1000000.00';
const PRICE_PATTERN = /^(\d+)(?:\.(\d{1,2}))?$/;

export function parseEuros(text) {
  if (text.includes(',')) return { ok: false, error: COMMA_MESSAGE };
  const match = PRICE_PATTERN.exec(text.trim());
  if (!match) return { ok: false, error: FORMAT_MESSAGE };
  const euros = Number(match[1]);
  const cents = Number((match[2] ?? '').padEnd(2, '0'));
  const total = euros * 100 + cents;
  if (total > MAX_CENTS) return { ok: false, error: RANGE_MESSAGE };
  return { ok: true, cents: total };
}

export function lineTotalCents(line) {
  return line.quantity * line.unitPriceCents;
}

export function orderTotalCents(order) {
  return order.lines.reduce((sum, line) => sum + lineTotalCents(line), 0);
}

export function formatEuros(cents) {
  const euros = Math.floor(cents / 100);
  const rest = String(cents % 100).padStart(2, '0');
  const grouped = String(euros).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `€${grouped}.${rest}`;
}
