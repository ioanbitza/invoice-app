import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorage } from '../src/storage/storage.js';

function memory(initial = {}) {
  const items = new Map(Object.entries(initial));
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, String(value)),
    removeItem: (key) => items.delete(key),
  };
}

const data = { nextOrderNumber: 1, customers: [], orders: [] };

test('R-19 save then load through a new storage gives the same data', () => {
  const backing = memory();
  const first = createStorage(backing);
  first.load();
  first.save(data);
  assert.deepEqual(createStorage(backing).load(), { ok: true, data });
});

test('R-20 save before load is blocked', () => {
  assert.deepEqual(createStorage(memory()).save(data), { ok: false, reason: 'blocked' });
});

test('R-21 a setItem that throws QuotaExceededError answers quota', () => {
  const backing = memory();
  backing.setItem = () => {
    throw new DOMException('full', 'QuotaExceededError');
  };
  const storage = createStorage(backing);
  storage.load();
  assert.deepEqual(storage.save(data), { ok: false, reason: 'quota' });
});

test('R-32 erase removes the key and returns empty data', () => {
  const backing = memory({ 'invoice-app': '{ bad' });
  const storage = createStorage(backing);
  storage.load();
  assert.deepEqual(storage.erase(), { ok: true, data });
  assert.equal(backing.getItem('invoice-app'), null);
});

test('R-06 erase restarts numbering at 1', () => {
  const storage = createStorage(memory());
  storage.load();
  assert.equal(storage.erase().data.nextOrderNumber, 1);
});
