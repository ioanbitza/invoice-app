import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

// S7 not built yet: every test below is skipped until the builder creates the module, then it runs and must pass.
// The plan names no export of src/storage/shape.js, so the shape rules are proved through load() (ADR-004, Reading).
const built = existsSync(new URL('../src/storage/storage.js', import.meta.url));
const skip = built ? false : 'S7 not built yet';
const { createStorage, openBrowserStorage } = built ? await import('../src/storage/storage.js') : {};

const KEY = 'invoice-app';
const EMPTY_DATA = { nextOrderNumber: 1, customers: [], orders: [] };

/** An in-memory object with the `Storage` interface (JS-17). */
function fakeStorage(initial = {}) {
  const items = new Map(Object.entries(initial));
  let writes = 0;
  return {
    get writes() {
      return writes;
    },
    get length() {
      return items.size;
    },
    key: (index) => [...items.keys()][index] ?? null,
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => {
      writes += 1;
      items.set(key, String(value));
    },
    removeItem: (key) => {
      items.delete(key);
    },
    clear: () => items.clear(),
  };
}

const aCustomer = (over = {}) => ({ id: 'c1', name: 'Ana Pop', email: '', phone: '', address: '', ...over });
const aLine = (over = {}) => ({ id: 'l1', description: 'Widget', quantity: 2, unitPriceCents: 1999, ...over });
const anOrder = (over = {}) => ({
  id: 'o1',
  number: 'ORD-0001',
  customerId: 'c1',
  date: '2026-10-30',
  notes: '',
  lines: [aLine()],
  ...over,
});
const someData = () => ({
  nextOrderNumber: 3,
  customers: [aCustomer()],
  orders: [anOrder(), anOrder({ id: 'o2', number: 'ORD-0002', lines: [] })],
});
const aDocument = () => ({ version: 1, ...someData() });

const storedAs = (document) => fakeStorage({ [KEY]: JSON.stringify(document) });

/** A storage that has loaded the given backing, so a save is allowed when that load succeeded. */
function loaded(backing) {
  const storage = createStorage(backing);
  storage.load();
  return storage;
}

const assertCorrupt = (document) => {
  const text = JSON.stringify(document);

  const result = createStorage(fakeStorage({ [KEY]: text })).load();

  assert.deepEqual(result, { ok: false, reason: 'corrupt', text });
};

const assertAccepted = (document) => {
  const result = createStorage(storedAs(document)).load();

  assert.equal(result.ok, true);
};

test('R-19 data saved through one storage is loaded equal through a new storage on the same backing', { skip }, () => {
  const backing = fakeStorage();

  const saved = loaded(backing).save(someData());
  const reloaded = createStorage(backing).load();

  assert.deepEqual(saved, { ok: true });
  assert.deepEqual(reloaded, { ok: true, data: someData() });
});

test('R-19 save writes one key, invoice-app, with version 1', { skip }, () => {
  const backing = fakeStorage();

  loaded(backing).save(someData());

  assert.equal(backing.length, 1);
  assert.deepEqual(JSON.parse(backing.getItem(KEY)), aDocument());
});

test('R-19 save writes the whole document with one setItem', { skip }, () => {
  const backing = fakeStorage();

  loaded(backing).save(someData());

  assert.equal(backing.writes, 1);
});

test('R-19 load removes version, so the domain value has only nextOrderNumber, customers and orders', { skip }, () => {
  const result = createStorage(storedAs(aDocument())).load();

  assert.deepEqual(Object.keys(result.data).sort(), ['customers', 'nextOrderNumber', 'orders']);
});

test('R-19 load with no stored value returns empty data', { skip }, () => {
  const result = createStorage(fakeStorage()).load();

  assert.deepEqual(result, { ok: true, data: EMPTY_DATA });
});

test('R-19 load with no stored value writes nothing', { skip }, () => {
  const backing = fakeStorage();

  createStorage(backing).load();

  assert.equal(backing.writes, 0);
  assert.equal(backing.length, 0);
});

test('R-19 a second save replaces the first', { skip }, () => {
  const backing = fakeStorage();
  const storage = loaded(backing);
  storage.save(EMPTY_DATA);

  storage.save(someData());

  assert.deepEqual(createStorage(backing).load(), { ok: true, data: someData() });
});

for (const text of ['{ not json', '{"version":1,"customers":[', '', 'null', '42', '[]', '"text"']) {
  test(`R-20 load of the text ${JSON.stringify(text)} returns corrupt with the stored text`, { skip }, () => {
    const result = createStorage(fakeStorage({ [KEY]: text })).load();

    assert.deepEqual(result, { ok: false, reason: 'corrupt', text });
  });
}

test('R-20 load of version 2 returns newer with the stored text', { skip }, () => {
  const text = JSON.stringify({ ...aDocument(), version: 2 });

  const result = createStorage(fakeStorage({ [KEY]: text })).load();

  assert.deepEqual(result, { ok: false, reason: 'newer', text });
});

test('R-20 load checks version first, so a newer document of another shape returns newer', { skip }, () => {
  const text = JSON.stringify({ version: 7, somethingNew: true });

  const result = createStorage(fakeStorage({ [KEY]: text })).load();

  assert.deepEqual(result, { ok: false, reason: 'newer', text });
});

for (const version of [0, -1, 1.5, 2.5, '1', '2', null]) {
  test(`R-20 load of version ${JSON.stringify(version)} returns corrupt`, { skip }, () => {
    assertCorrupt({ ...aDocument(), version });
  });
}

test('R-20 load of a document with no version returns corrupt', { skip }, () => {
  assertCorrupt(someData());
});

for (const field of ['nextOrderNumber', 'customers', 'orders']) {
  test(`R-20 shape refuses a document with no ${field}`, { skip }, () => {
    const document = aDocument();
    delete document[field];

    assertCorrupt(document);
  });
}

for (const field of ['id', 'name', 'email', 'phone', 'address']) {
  test(`R-20 shape refuses a customer with no ${field}`, { skip }, () => {
    const document = aDocument();
    delete document.customers[0][field];

    assertCorrupt(document);
  });

  test(`R-20 shape refuses a customer whose ${field} is not a string`, { skip }, () => {
    const document = aDocument();
    document.customers[0][field] = 5;

    assertCorrupt(document);
  });
}

for (const field of ['id', 'number', 'customerId', 'date', 'notes', 'lines']) {
  test(`R-20 shape refuses an order with no ${field}`, { skip }, () => {
    const document = aDocument();
    delete document.orders[0][field];

    assertCorrupt(document);
  });

  test(`R-20 shape refuses an order whose ${field} has the wrong type`, { skip }, () => {
    const document = aDocument();
    document.orders[0][field] = 5;

    assertCorrupt(document);
  });
}

for (const field of ['id', 'description', 'quantity', 'unitPriceCents']) {
  test(`R-20 shape refuses a line with no ${field}`, { skip }, () => {
    const document = aDocument();
    delete document.orders[0].lines[0][field];

    assertCorrupt(document);
  });
}

for (const field of ['id', 'description']) {
  test(`R-20 shape refuses a line whose ${field} is not a string`, { skip }, () => {
    const document = aDocument();
    document.orders[0].lines[0][field] = 5;

    assertCorrupt(document);
  });
}

test('R-20 shape refuses customers that is not a list', { skip }, () => {
  assertCorrupt({ ...aDocument(), customers: {} });
});

test('R-20 shape refuses orders that is not a list', { skip }, () => {
  assertCorrupt({ ...aDocument(), orders: 'none' });
});

for (const field of ['quantity', 'unitPriceCents']) {
  for (const value of ['2', 1.5, 2 ** 53]) {
    test(`R-20 shape refuses a ${field} of ${JSON.stringify(value)}, which is not a safe integer`, { skip }, () => {
      const document = aDocument();
      document.orders[0].lines[0][field] = value;

      assertCorrupt(document);
    });
  }
}

for (const value of ['3', 2.5, 2 ** 53]) {
  test(`R-20 shape refuses a nextOrderNumber of ${JSON.stringify(value)}, which is not a safe integer`, { skip }, () => {
    assertCorrupt({ ...aDocument(), nextOrderNumber: value });
  });
}

test('R-20 shape refuses a duplicate customer id', { skip }, () => {
  const document = aDocument();
  document.customers.push(aCustomer({ name: 'Bob' }));

  assertCorrupt(document);
});

test('R-20 shape refuses a duplicate order id', { skip }, () => {
  const document = aDocument();
  document.orders[1].id = document.orders[0].id;

  assertCorrupt(document);
});

test('R-20 shape refuses a duplicate line id within an order', { skip }, () => {
  const document = aDocument();
  document.orders[0].lines.push(aLine());

  assertCorrupt(document);
});

test('R-20 shape refuses a duplicate line id across two orders', { skip }, () => {
  const document = aDocument();
  document.orders[1].lines.push(aLine());

  assertCorrupt(document);
});

test('R-20 shape refuses a duplicate order number', { skip }, () => {
  const document = aDocument();
  document.orders[1].number = document.orders[0].number;

  assertCorrupt(document);
});

test('R-20 shape refuses a customerId with no customer', { skip }, () => {
  const document = aDocument();
  document.orders[1].customerId = 'nobody';

  assertCorrupt(document);
});

test('R-20 shape refuses a nextOrderNumber equal to an order\'s number', { skip }, () => {
  assertCorrupt({ ...aDocument(), nextOrderNumber: 2 });
});

test('R-20 shape refuses a nextOrderNumber below an order\'s number', { skip }, () => {
  assertCorrupt({ ...aDocument(), nextOrderNumber: 1 });
});

test('R-20 shape reads an order number as a number, so ORD-10000 needs a nextOrderNumber above 10000', { skip }, () => {
  const document = aDocument();
  document.orders[0].number = 'ORD-10000';
  document.nextOrderNumber = 9999;

  assertCorrupt(document);
});

test('R-20 shape accepts a nextOrderNumber one above the highest order number', { skip }, () => {
  const document = aDocument();
  document.orders[0].number = 'ORD-10000';
  document.nextOrderNumber = 10001;

  assertAccepted(document);
});

test('R-20 shape accepts a name of 500 characters, because form rules are not checked', { skip }, () => {
  const document = aDocument();
  document.customers[0].name = 'a'.repeat(500);

  assertAccepted(document);
});

test('R-20 shape accepts a quantity above the form limit, because form rules are not checked', { skip }, () => {
  const document = aDocument();
  document.orders[0].lines[0].quantity = 10000;

  assertAccepted(document);
});

test('R-20 save after a corrupt load answers blocked and leaves the stored text unchanged', { skip }, () => {
  const backing = fakeStorage({ [KEY]: '{ not json' });

  const result = loaded(backing).save(someData());

  assert.deepEqual(result, { ok: false, reason: 'blocked' });
  assert.equal(backing.getItem(KEY), '{ not json');
});

test('R-20 save after a newer load answers blocked and leaves the stored text unchanged', { skip }, () => {
  const text = JSON.stringify({ ...aDocument(), version: 2 });
  const backing = fakeStorage({ [KEY]: text });

  const result = loaded(backing).save(someData());

  assert.deepEqual(result, { ok: false, reason: 'blocked' });
  assert.equal(backing.getItem(KEY), text);
});

test('R-20 save before any load answers blocked and writes nothing', { skip }, () => {
  const backing = fakeStorage();

  const result = createStorage(backing).save(someData());

  assert.deepEqual(result, { ok: false, reason: 'blocked' });
  assert.equal(backing.writes, 0);
});

test('R-20 a load of unreadable text writes nothing', { skip }, () => {
  const backing = fakeStorage({ [KEY]: '{ not json' });

  createStorage(backing).load();

  assert.equal(backing.writes, 0);
});

test('R-21 a getItem that throws answers unavailable on load', { skip }, () => {
  const backing = fakeStorage();
  backing.getItem = () => {
    throw new DOMException('denied', 'SecurityError');
  };

  assert.deepEqual(createStorage(backing).load(), { ok: false, reason: 'unavailable' });
});

test('R-21 a setItem that throws QuotaExceededError answers quota', { skip }, () => {
  const backing = storedAs(aDocument());
  const storage = loaded(backing);
  backing.setItem = () => {
    throw new DOMException('full', 'QuotaExceededError');
  };

  assert.deepEqual(storage.save(EMPTY_DATA), { ok: false, reason: 'quota' });
});

test('R-21 a setItem that throws QuotaExceededError leaves the old text', { skip }, () => {
  const backing = storedAs(aDocument());
  const before = backing.getItem(KEY);
  const storage = loaded(backing);
  backing.setItem = () => {
    throw new DOMException('full', 'QuotaExceededError');
  };

  storage.save(EMPTY_DATA);

  assert.equal(backing.getItem(KEY), before);
});

for (const [label, error] of [
  ['an Error', new Error('broken')],
  ['a SecurityError', new DOMException('denied', 'SecurityError')],
]) {
  test(`R-21 a setItem that throws ${label} answers unavailable and leaves the old text`, { skip }, () => {
    const backing = storedAs(aDocument());
    const before = backing.getItem(KEY);
    const storage = loaded(backing);
    backing.setItem = () => {
      throw error;
    };

    const result = storage.save(EMPTY_DATA);

    assert.deepEqual(result, { ok: false, reason: 'unavailable' });
    assert.equal(backing.getItem(KEY), before);
  });
}

test('R-21 a save can be retried after a failed save', { skip }, () => {
  const backing = storedAs(aDocument());
  const storage = loaded(backing);
  const realSetItem = backing.setItem;
  backing.setItem = () => {
    throw new DOMException('full', 'QuotaExceededError');
  };
  storage.save(EMPTY_DATA);
  backing.setItem = realSetItem;

  const retried = storage.save(EMPTY_DATA);

  assert.deepEqual(retried, { ok: true });
  assert.deepEqual(createStorage(backing).load(), { ok: true, data: EMPTY_DATA });
});

/** Puts a `window` on the global scope for one test; Node has none. */
function useWindow(t, fakeWindow) {
  Object.defineProperty(globalThis, 'window', { value: fakeWindow, configurable: true });
  t.after(() => {
    delete globalThis.window;
  });
}

test('R-21 openBrowserStorage answers unavailable on every call when the access to localStorage throws', { skip }, (t) => {
  useWindow(t, {
    get localStorage() {
      throw new DOMException('denied', 'SecurityError');
    },
  });

  const storage = openBrowserStorage();

  assert.deepEqual(storage.load(), { ok: false, reason: 'unavailable' });
  assert.deepEqual(storage.save(someData()), { ok: false, reason: 'unavailable' });
  assert.deepEqual(storage.erase(), { ok: false, reason: 'unavailable' });
});

test('R-19 openBrowserStorage saves to window.localStorage when the access works', { skip }, (t) => {
  const backing = fakeStorage();
  useWindow(t, { localStorage: backing });

  const storage = openBrowserStorage();
  storage.load();
  storage.save(someData());

  assert.deepEqual(JSON.parse(backing.getItem(KEY)), aDocument());
});

test('R-32 erase removes only invoice-app and leaves other keys', { skip }, () => {
  const backing = fakeStorage({ [KEY]: JSON.stringify(aDocument()), 'another-app': 'keep me' });

  loaded(backing).erase();

  assert.equal(backing.getItem(KEY), null);
  assert.equal(backing.getItem('another-app'), 'keep me');
});

test('R-32 erase returns empty data', { skip }, () => {
  const result = loaded(storedAs(aDocument())).erase();

  assert.deepEqual(result, { ok: true, data: EMPTY_DATA });
});

test('R-32 erase works after a corrupt load and then save succeeds', { skip }, () => {
  const backing = fakeStorage({ [KEY]: '{ not json' });
  const storage = loaded(backing);

  const erased = storage.erase();
  const saved = storage.save(someData());

  assert.deepEqual(erased, { ok: true, data: EMPTY_DATA });
  assert.deepEqual(saved, { ok: true });
  assert.deepEqual(createStorage(backing).load(), { ok: true, data: someData() });
});

test('R-32 erase works after a newer load and then save succeeds', { skip }, () => {
  const backing = fakeStorage({ [KEY]: JSON.stringify({ ...aDocument(), version: 2 }) });
  const storage = loaded(backing);

  storage.erase();

  assert.deepEqual(storage.save(EMPTY_DATA), { ok: true });
});

test('R-32 a removeItem that throws answers unavailable', { skip }, () => {
  const backing = storedAs(aDocument());
  backing.removeItem = () => {
    throw new Error('broken');
  };

  const result = loaded(backing).erase();

  assert.deepEqual(result, { ok: false, reason: 'unavailable' });
});

test('R-32 a failed erase after a corrupt load keeps save blocked', { skip }, () => {
  const backing = fakeStorage({ [KEY]: '{ not json' });
  backing.removeItem = () => {
    throw new Error('broken');
  };
  const storage = loaded(backing);
  storage.erase();

  const result = storage.save(someData());

  assert.deepEqual(result, { ok: false, reason: 'blocked' });
  assert.equal(backing.getItem(KEY), '{ not json');
});

test('R-06 after erase the next order starts again at number 1', { skip }, () => {
  const backing = storedAs(aDocument());
  const storage = loaded(backing);

  const erased = storage.erase();

  assert.equal(erased.data.nextOrderNumber, 1);
  assert.equal(createStorage(backing).load().data.nextOrderNumber, 1);
});
