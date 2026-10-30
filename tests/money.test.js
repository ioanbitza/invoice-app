import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEuros, lineTotalCents, orderTotalCents, formatEuros } from '../src/domain/money.js';

const COMMA_MESSAGE = 'Use a dot for decimals, e.g. 12.50';

test('R-12 parses "12.5" as 1250 cents', () => {
  assert.deepEqual(parseEuros('12.5'), { ok: true, cents: 1250 });
  assert.deepEqual(parseEuros(' 12.50 '), { ok: true, cents: 1250 });
  assert.deepEqual(parseEuros('7'), { ok: true, cents: 700 });
  assert.deepEqual(parseEuros('0.05'), { ok: true, cents: 5 });
});

test('R-12 parses "0", "0.00" and "1000000.00" at the bounds', () => {
  assert.deepEqual(parseEuros('0'), { ok: true, cents: 0 });
  assert.deepEqual(parseEuros('0.00'), { ok: true, cents: 0 });
  assert.deepEqual(parseEuros('1000000.00'), { ok: true, cents: 100000000 });
  assert.equal(parseEuros('1000000.01').ok, false);
});

test('R-12 refuses "12.345" (three decimals)', () => {
  const result = parseEuros('12.345');
  assert.equal(result.ok, false);
  assert.ok(result.error.length > 0);
});

test('R-12 refuses "12,50" and "1,000" with "Use a dot for decimals, e.g. 12.50"', () => {
  assert.deepEqual(parseEuros('12,50'), { ok: false, error: COMMA_MESSAGE });
  assert.deepEqual(parseEuros('1,000'), { ok: false, error: COMMA_MESSAGE });
});

test('R-12 refuses negative, above 1,000,000.00, empty and non-numeric input', () => {
  for (const text of ['-1', '-0.50', '1000001', '', '   ', 'abc', '1e3', '1.', '.5', '12.5.1', '1 000']) {
    assert.equal(parseEuros(text).ok, false, `"${text}" should be refused`);
  }
});

test('R-15 line total is quantity times unit price in cents', () => {
  assert.equal(lineTotalCents({ quantity: 3, unitPriceCents: 10 }), 30);
  assert.equal(lineTotalCents({ quantity: 2, unitPriceCents: 1250 }), 2500);
});

test('R-15 line total stays exact for 9999 × 100000000 cents', () => {
  assert.equal(lineTotalCents({ quantity: 9999, unitPriceCents: 100000000 }), 999900000000);
});

test('R-16 order total sums its line totals', () => {
  const order = {
    lines: [
      { quantity: 1, unitPriceCents: 100000 },
      { quantity: 2, unitPriceCents: 11725 },
    ],
  };
  assert.equal(orderTotalCents(order), 123450);
});

test('R-16 order with no lines totals 0', () => {
  assert.equal(orderTotalCents({ lines: [] }), 0);
});

test('R-16 formats 123450 cents as "€1,234.50"', () => {
  assert.equal(formatEuros(123450), '€1,234.50');
  assert.equal(formatEuros(100000000), '€1,000,000.00');
  assert.equal(formatEuros(99900), '€999.00');
});

test('R-16 formats 0 as "€0.00" and 5 as "€0.05"', () => {
  assert.equal(formatEuros(0), '€0.00');
  assert.equal(formatEuros(5), '€0.05');
});
