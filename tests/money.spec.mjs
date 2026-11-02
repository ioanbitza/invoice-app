import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

// S1 not built yet: every test below is skipped until the builder creates the module, then it runs and must pass.
const built = existsSync(new URL('../src/domain/money.js', import.meta.url));
const skip = built ? false : 'S1 not built yet';
const { MAX_UNIT_PRICE_CENTS, MAX_QUANTITY, parsePriceToCents, priceInputText, lineTotalCents, orderTotalCents } = built
  ? await import('../src/domain/money.js')
  : {};

const LARGEST_SAFE = Number.MAX_SAFE_INTEGER;

test('R-11 the limits are a quantity of 9999 and a unit price of 100000000 cents', { skip }, () => {
  assert.equal(MAX_QUANTITY, 9999);
  assert.equal(MAX_UNIT_PRICE_CENTS, 100000000);
});

const acceptedPrices = [
  ['5', 500],
  ['5.5', 550],
  ['5,50', 550],
  ['0', 0],
  ['0.00', 0],
  ['1000000.00', 100000000],
  ['1000000,00', 100000000],
  ['1000000', 100000000],
  ['0.01', 1],
  ['0,05', 5],
  ['19.99', 1999],
  ['4.35', 435],
  ['1.15', 115],
  ['  19,99  ', 1999],
];

for (const [text, cents] of acceptedPrices) {
  test(`R-11 parsePriceToCents reads "${text}" as ${cents} cents`, { skip }, () => {
    assert.equal(parsePriceToCents(text), cents);
  });
}

// ADR-006 fixes which texts are refused, not the refused value, and ADR-007 says the domain does not throw for an
// expected failure. So a refusal is any value that is not a whole number of cents, returned and not thrown.
const refusedPrices = [
  '',
  '   ',
  '1,234.50',
  '1.234,50',
  '12,345',
  '1 234',
  '.5',
  '5.',
  '-1',
  '1e3',
  '€5',
  '1000000.01',
  '1000001',
  '5.555',
  '+5',
  '5,5,5',
  'abc',
  '٥',
];

for (const text of refusedPrices) {
  test(`R-11 parsePriceToCents refuses "${text}"`, { skip }, () => {
    assert.equal(Number.isInteger(parsePriceToCents(text)), false);
  });
}

const priceTexts = [
  [1999, '19.99'],
  [500, '5.00'],
  [0, '0.00'],
  [1, '0.01'],
  [10, '0.10'],
  [100000000, '1000000.00'],
];

for (const [cents, text] of priceTexts) {
  test(`R-11 priceInputText(${cents}) gives ${text}`, { skip }, () => {
    assert.equal(priceInputText(cents), text);
  });
}

for (const cents of [0, 1, 435, 1999, 100000000]) {
  test(`R-11 priceInputText output parses back to ${cents} cents`, { skip }, () => {
    assert.equal(parsePriceToCents(priceInputText(cents)), cents);
  });
}

test('R-14 lineTotalCents(3, 10) is 30', { skip }, () => {
  assert.equal(lineTotalCents(3, 10), 30);
});

test('R-14 lineTotalCents(3, 1999) is 5997', { skip }, () => {
  assert.equal(lineTotalCents(3, 1999), 5997);
});

test('R-14 lineTotalCents of the largest quantity and price is 999900000000', { skip }, () => {
  assert.equal(lineTotalCents(9999, 100000000), 999900000000);
});

test('R-14 lineTotalCents returns a product that is exactly the largest safe integer', { skip }, () => {
  assert.equal(lineTotalCents(1, LARGEST_SAFE), LARGEST_SAFE);
});

test('R-14 lineTotalCents throws when the product is not a safe integer', { skip }, () => {
  assert.throws(() => lineTotalCents(2, LARGEST_SAFE), Error);
});

test('R-15 orderTotalCents sums 5997 and 30 to 6027', { skip }, () => {
  const order = {
    lines: [
      { quantity: 3, unitPriceCents: 1999 },
      { quantity: 3, unitPriceCents: 10 },
    ],
  };

  assert.equal(orderTotalCents(order), 6027);
});

test('R-15 orderTotalCents of an order with no lines is 0', { skip }, () => {
  assert.equal(orderTotalCents({ lines: [] }), 0);
});

test('R-15 orderTotalCents returns a sum that is exactly the largest safe integer', { skip }, () => {
  const order = {
    lines: [
      { quantity: 1, unitPriceCents: LARGEST_SAFE - 1 },
      { quantity: 1, unitPriceCents: 1 },
    ],
  };

  assert.equal(orderTotalCents(order), LARGEST_SAFE);
});

test('R-15 orderTotalCents throws when the sum is not a safe integer', { skip }, () => {
  const order = {
    lines: [
      { quantity: 1, unitPriceCents: LARGEST_SAFE },
      { quantity: 1, unitPriceCents: 1 },
    ],
  };

  assert.throws(() => orderTotalCents(order), Error);
});
