import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNameCompare, formatMoney, formatDate } from '../src/ui/format.js';

const sorted = (locale, names) => [...names].sort(createNameCompare(locale));

test('R-03 createNameCompare(en) sorts ana, Bogdan, Zoe whatever the case', () => {
  assert.deepEqual(sorted('en', ['Zoe', 'ana', 'Bogdan']), ['ana', 'Bogdan', 'Zoe']);
  assert.deepEqual(sorted('en', ['zoe', 'Ana', 'bogdan']), ['Ana', 'bogdan', 'zoe']);
});

test('R-03 createNameCompare(ro) sorts Șerban after Radu and before Tudor', () => {
  assert.deepEqual(sorted('ro', ['Tudor', 'Șerban', 'Radu']), ['Radu', 'Șerban', 'Tudor']);
});

test('R-16 formatMoney(123450, en) gives €1,234.50', () => {
  assert.equal(formatMoney(123450, 'en'), '€1,234.50');
});

test("R-16 formatMoney(123450, ro) gives 1.234,50 € with the locale's spaces", () => {
  assert.equal(formatMoney(123450, 'ro').replace(/\s/g, ' '), '1.234,50 €');
});

test('R-16 formatMoney(0, en) gives €0.00', () => {
  assert.equal(formatMoney(0, 'en'), '€0.00');
});

test('R-14 formatMoney shows the exact cents of a safe total above 2^46 cents', () => {
  assert.equal(formatMoney(9007199254740987, 'en'), '€90,071,992,547,409.87');
  assert.equal(formatMoney(5, 'en'), '€0.05');
});

test('R-28 formatDate shows 0099-01-01 as year 99 and keeps a leap day', () => {
  assert.equal(formatDate('0099-01-01', 'en-GB').includes('99'), true);
  assert.equal(formatDate('2024-02-29', 'en-GB'), '29 Feb 2024');
});

test('R-28 formatDate(2026-10-30, en-GB) gives 30 Oct 2026 in any time zone of the process', () => {
  const saved = process.env.TZ;
  try {
    for (const zone of ['Pacific/Kiritimati', 'Pacific/Pago_Pago', 'UTC']) {
      process.env.TZ = zone;
      assert.equal(formatDate('2026-10-30', 'en-GB'), '30 Oct 2026');
    }
  } finally {
    if (saved === undefined) delete process.env.TZ;
    else process.env.TZ = saved;
  }
});
