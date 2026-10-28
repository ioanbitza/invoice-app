import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/storage/store.js';

const KEY = 'invoice-app';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
  };
}

const sample = {
  version: 1,
  nextOrderNumber: 3,
  customers: [{ id: 'c1', name: 'Ana', email: '', phone: '' }],
  orders: [{
    id: 'o1', number: 2, customerId: 'c1', date: '2026-01-02',
    lines: [{ id: 'l1', description: 'Design', quantity: 2, unitPriceCents: 1250 }],
  }],
};

test('R-17 a missing key loads the empty state with version 1 and nextOrderNumber 1', () => {
  const store = createStore(fakeStorage());
  const result = store.load();
  assert.equal(result.ok, true);
  assert.deepEqual(result.state, { version: 1, nextOrderNumber: 1, customers: [], orders: [] });
  assert.deepEqual(store.current(), result.state);
});

test('R-17 a saved state loads back equal after a new store is created on the same storage', () => {
  const storage = fakeStorage();
  const first = createStore(storage);
  first.load();
  const saved = first.save(sample);
  assert.equal(saved.ok, true);
  assert.deepEqual(first.current(), sample);
  assert.ok(KEY in storage.data);
  const second = createStore(storage);
  const loaded = second.load();
  assert.equal(loaded.ok, true);
  assert.deepEqual(loaded.state, sample);
});

test('R-17 after loading existing data a save succeeds and a new store reads it back', () => {
  const storage = fakeStorage({ [KEY]: JSON.stringify(sample) });
  const store = createStore(storage);
  assert.equal(store.load().ok, true);
  const next = { ...sample, nextOrderNumber: 4 };
  const saved = store.save(next);
  assert.equal(saved.ok, true);
  assert.deepEqual(store.current(), next);
  assert.equal(storage.data[KEY], JSON.stringify(next));
  assert.deepEqual(createStore(storage).load().state, next);
});

test('R-18 unparsable JSON loads as an error and the stored text is left unchanged', () => {
  const storage = fakeStorage({ [KEY]: '{bad' });
  const result = createStore(storage).load();
  assert.equal(result.ok, false);
  assert.ok(result.error.length > 0);
  assert.equal(storage.data[KEY], '{bad');
});

test('R-18 wrong shape or a version other than 1 loads as an error', () => {
  const broken = [
    { ...sample, version: 2 },
    { ...sample, nextOrderNumber: 1.5 },
    { ...sample, customers: 'x' },
    { ...sample, orders: null },
    { ...sample, customers: [{ id: 'c1', name: 5, email: '', phone: '' }] },
    { ...sample, orders: [{ ...sample.orders[0], lines: [{ id: 'l1', description: 'x', quantity: 'two', unitPriceCents: 1 }] }] },
    { ...sample, orders: [{ ...sample.orders[0], date: 20260102 }] },
    [],
    null,
    'text',
  ];
  for (const value of broken) {
    const text = JSON.stringify(value);
    const storage = fakeStorage({ [KEY]: text });
    const result = createStore(storage).load();
    assert.equal(result.ok, false, text);
    assert.equal(storage.data[KEY], text);
  }
});

test('R-18 after a failed load every save is refused and the stored text is unchanged', () => {
  const storage = fakeStorage({ [KEY]: '{bad' });
  const store = createStore(storage);
  store.load();
  const result = store.save(sample);
  assert.equal(result.ok, false);
  assert.ok(result.error.length > 0);
  assert.equal(storage.data[KEY], '{bad');
  assert.equal(store.current(), null);
});

test('R-18 a throwing getItem loads as an error', () => {
  const storage = { getItem() { throw new Error('denied'); }, setItem() {} };
  const result = createStore(storage).load();
  assert.equal(result.ok, false);
  assert.match(result.error, /denied/);
});

test('R-19 a throwing setItem returns an error and the store keeps the previous state', () => {
  const storage = fakeStorage();
  const store = createStore(storage);
  store.load();
  store.save(sample);
  const before = storage.data[KEY];
  storage.setItem = () => { throw new Error('quota exceeded'); };
  const result = store.save({ ...sample, nextOrderNumber: 99 });
  assert.equal(result.ok, false);
  assert.match(result.error, /quota exceeded/);
  assert.deepEqual(store.current(), sample);
  assert.equal(storage.data[KEY], before);
});
