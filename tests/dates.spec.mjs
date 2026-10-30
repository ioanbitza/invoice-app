import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

// S1 not built yet: every test below is skipped until the builder creates the module, then it runs and must pass.
const built = existsSync(new URL('../src/domain/dates.js', import.meta.url));
const skip = built ? false : 'S1 not built yet';
const { isRealDate, todayIso } = built ? await import('../src/domain/dates.js') : {};

// The clock is a function that returns epoch milliseconds, as JS-06 writes it: `now = () => Date.now()`.
const clockAt = (...localDateParts) => () => new Date(...localDateParts).getTime();

/** Runs the rest of a test in a fixed zone, so the local day differs from the UTC day on any machine (TS-09). */
function useTimeZone(t, zone) {
  const original = process.env.TZ;
  process.env.TZ = zone;
  t.after(() => {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  });
}

for (const text of ['2026-02-28', '2024-02-29', '2000-02-29', '2026-12-31', '2026-01-01']) {
  test(`R-06 isRealDate accepts ${text}`, { skip }, () => {
    assert.equal(isRealDate(text), true);
  });
}

const notRealDates = [
  '2026-02-30',
  '2026-02-29',
  '2100-02-29',
  '2026-04-31',
  '2026-13-01',
  '2026-00-10',
  '2026-01-00',
  '2026-01-32',
  '26-02-01',
  '2026-2-01',
  '2026-02-1',
  '2026/02/01',
  '2026-02-01T00:00',
  'today',
  '',
];

for (const text of notRealDates) {
  test(`R-06 isRealDate refuses "${text}"`, { skip }, () => {
    assert.equal(isRealDate(text), false);
  });
}

test('R-06 todayIso keeps the local date 30 minutes before local midnight, west of UTC', { skip }, (t) => {
  useTimeZone(t, 'America/New_York');

  assert.equal(todayIso(clockAt(2026, 9, 30, 23, 30)), '2026-10-30');
});

test('R-06 todayIso keeps the local date 30 minutes after local midnight, east of UTC', { skip }, (t) => {
  useTimeZone(t, 'Asia/Tokyo');

  assert.equal(todayIso(clockAt(2026, 9, 30, 0, 30)), '2026-10-30');
});

test('R-06 todayIso pads the month and the day to two digits', { skip }, () => {
  assert.equal(todayIso(clockAt(2026, 0, 5, 12, 0)), '2026-01-05');
});
