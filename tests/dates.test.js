import test from 'node:test';
import assert from 'node:assert/strict';
import { isRealDate, todayIso } from '../src/domain/dates.js';

test('R-06 isRealDate accepts 2026-02-28 and 2024-02-29', () => {
  assert.equal(isRealDate('2026-02-28'), true);
  assert.equal(isRealDate('2024-02-29'), true);
});

test('R-06 isRealDate refuses 2026-02-30, 2026-13-01, 26-02-01 and empty text', () => {
  for (const text of ['2026-02-30', '2026-13-01', '26-02-01', '']) assert.equal(isRealDate(text), false, text);
});

test('R-06 todayIso uses the local calendar date of the injected clock, also 30 minutes before local midnight', () => {
  const beforeMidnight = () => new Date(2026, 9, 30, 23, 30).getTime();
  assert.equal(todayIso(beforeMidnight), '2026-10-30');
});
