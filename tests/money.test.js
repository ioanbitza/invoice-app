import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CURRENCY,
  MAX_UNIT_PRICE_CENTS,
  MAX_QUANTITY,
  parsePriceToCents,
  priceInputText,
  lineTotalCents,
  orderTotalCents,
} from '../src/domain/money.js';

test('R-11 the currency is EUR and the limits are 100000000 cents and 9999', () => {
  assert.equal(CURRENCY, 'EUR');
  assert.equal(MAX_UNIT_PRICE_CENTS, 100000000);
  assert.equal(MAX_QUANTITY, 9999);
});

test('R-11 parsePriceToCents accepts 5, 5.5, 5,50, 0, 0.00 and 1000000.00 and returns 500, 550, 550, 0, 0 and 100000000', () => {
  const cases = [['5', 500], ['5.5', 550], ['5,50', 550], ['0', 0], ['0.00', 0], ['1000000.00', 100000000]];
  for (const [text, cents] of cases) assert.equal(parsePriceToCents(text), cents, text);
});

test('R-11 parsePriceToCents refuses empty text, 1,234.50, 1.234,50, 12,345, 1 234, .5, 5., -1, 1e3, €5 and 1000000.01', () => {
  const texts = ['', '1,234.50', '1.234,50', '12,345', '1 234', '.5', '5.', '-1', '1e3', '€5', '1000000.01'];
  for (const text of texts) assert.equal(Number.isInteger(parsePriceToCents(text)), false, text);
});

test('R-11 parsePriceToCents refuses a price whose whole part is too long to be safe', () => {
  assert.equal(Number.isInteger(parsePriceToCents('9'.repeat(30))), false);
});

test('R-11 priceInputText(1999) gives 19.99 and priceInputText(500) gives 5.00', () => {
  assert.equal(priceInputText(1999), '19.99');
  assert.equal(priceInputText(500), '5.00');
});

test('R-11 priceInputText output parses back to the same cents for 0, 1, 1999 and 100000000', () => {
  for (const cents of [0, 1, 1999, 100000000]) assert.equal(parsePriceToCents(priceInputText(cents)), cents);
});

test('R-14 lineTotalCents(3, 10) is 30 and lineTotalCents(3, 1999) is 5997', () => {
  assert.equal(lineTotalCents(3, 10), 30);
  assert.equal(lineTotalCents(3, 1999), 5997);
});

test('R-14 lineTotalCents throws when the product is not a safe integer', () => {
  assert.throws(() => lineTotalCents(2, Number.MAX_SAFE_INTEGER), Error);
});

test('R-15 orderTotalCents sums 5997 and 30 to 6027', () => {
  const order = { lines: [{ quantity: 3, unitPriceCents: 1999 }, { quantity: 3, unitPriceCents: 10 }] };
  assert.equal(orderTotalCents(order), 6027);
});

test('R-15 orderTotalCents of an order with no lines is 0', () => {
  assert.equal(orderTotalCents({ lines: [] }), 0);
});

test('R-15 orderTotalCents throws when the sum is not a safe integer', () => {
  const order = {
    lines: [{ quantity: 1, unitPriceCents: Number.MAX_SAFE_INTEGER }, { quantity: 1, unitPriceCents: 1 }],
  };
  assert.throws(() => orderTotalCents(order), Error);
});
