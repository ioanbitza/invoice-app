import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorage, openBrowserStorage } from '../src/storage/storage.js';

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

const key = 'invoice-app';
const stored = (extra = {}) => JSON.stringify({ version: 1, ...data, ...extra });

test('R-20 save after a load whose getItem throws answers blocked and does not call setItem', () => {
  const backing = memory();
  backing.getItem = () => {
    throw new Error('denied');
  };
  let writes = 0;
  backing.setItem = () => writes++;
  const storage = createStorage(backing);
  assert.deepEqual(storage.load(), { ok: false, reason: 'unavailable' });
  assert.deepEqual(storage.save(data), { ok: false, reason: 'blocked' });
  assert.equal(writes, 0);
});

test('R-19 save writes one key, invoice-app, with version 1', () => {
  const backing = memory();
  const storage = createStorage(backing);
  storage.load();
  storage.save(data);
  assert.deepEqual(JSON.parse(backing.getItem(key)), { version: 1, ...data });
});

test('R-19 load with no stored value returns empty data and writes nothing', () => {
  const backing = memory();
  let writes = 0;
  backing.setItem = () => writes++;
  assert.deepEqual(createStorage(backing).load(), { ok: true, data });
  assert.equal(writes, 0);
});

test('R-19 load removes version, so the value has only nextOrderNumber, customers and orders', () => {
  const result = createStorage(memory({ [key]: stored() })).load();
  assert.deepEqual(Object.keys(result.data).sort(), ['customers', 'nextOrderNumber', 'orders']);
});

test('R-20 load of text that does not parse returns corrupt with the stored text', () => {
  assert.deepEqual(createStorage(memory({ [key]: '{ bad' })).load(), { ok: false, reason: 'corrupt', text: '{ bad' });
});

test('R-20 load of version 2 returns newer and of version 0 or "1" returns corrupt', () => {
  const newer = stored({ version: 2 });
  assert.deepEqual(createStorage(memory({ [key]: newer })).load(), { ok: false, reason: 'newer', text: newer });
  for (const version of [0, '1']) {
    const text = stored({ version });
    assert.deepEqual(createStorage(memory({ [key]: text })).load(), { ok: false, reason: 'corrupt', text });
  }
});

test('R-20 save after a corrupt or newer load answers blocked and leaves the stored text unchanged', () => {
  for (const text of ['{ bad', stored({ version: 2 })]) {
    const backing = memory({ [key]: text });
    const storage = createStorage(backing);
    storage.load();
    assert.deepEqual(storage.save(data), { ok: false, reason: 'blocked' });
    assert.equal(backing.getItem(key), text);
  }
});

test('R-21 a setItem that throws QuotaExceededError leaves the old text', () => {
  const old = stored();
  const backing = memory({ [key]: old });
  const storage = createStorage(backing);
  storage.load();
  backing.setItem = () => {
    throw new DOMException('full', 'QuotaExceededError');
  };
  assert.deepEqual(storage.save({ ...data, nextOrderNumber: 2 }), { ok: false, reason: 'quota' });
  assert.equal(backing.getItem(key), old);
});

test('R-21 any other setItem error answers unavailable and leaves the old text', () => {
  const old = stored();
  const backing = memory({ [key]: old });
  const storage = createStorage(backing);
  storage.load();
  backing.setItem = () => {
    throw new Error('denied');
  };
  assert.deepEqual(storage.save(data), { ok: false, reason: 'unavailable' });
  assert.equal(backing.getItem(key), old);
});

test('R-21 openBrowserStorage answers unavailable on every call when the access to localStorage throws', () => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      get localStorage() {
        throw new DOMException('denied', 'SecurityError');
      },
    },
  });
  try {
    const storage = openBrowserStorage();
    const unavailable = { ok: false, reason: 'unavailable' };
    assert.deepEqual(storage.load(), unavailable);
    assert.deepEqual(storage.save(data), unavailable);
    assert.deepEqual(storage.erase(), unavailable);
  } finally {
    delete globalThis.window;
  }
});

test('R-32 erase removes only invoice-app and leaves other keys', () => {
  const backing = memory({ [key]: stored(), other: 'keep' });
  const storage = createStorage(backing);
  storage.load();
  storage.erase();
  assert.equal(backing.getItem(key), null);
  assert.equal(backing.getItem('other'), 'keep');
});

test('R-32 erase works after a corrupt load and then save succeeds', () => {
  const backing = memory({ [key]: '{ bad' });
  const storage = createStorage(backing);
  storage.load();
  storage.erase();
  assert.deepEqual(storage.save(data), { ok: true });
});

test('R-32 a removeItem that throws answers unavailable', () => {
  const backing = memory({ [key]: stored() });
  backing.removeItem = () => {
    throw new Error('denied');
  };
  assert.deepEqual(createStorage(backing).erase(), { ok: false, reason: 'unavailable' });
});
