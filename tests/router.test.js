import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute, routeToHash, routeTitle, ROUTE_TITLES } from '../src/ui/router.js';

const HASHES = [
  '#/customers',
  '#/customers/new',
  '#/customers/c1',
  '#/customers/c1/edit',
  '#/customers/c1/orders/new',
  '#/orders',
  '#/orders/new',
  '#/orders/o1',
  '#/orders/o1/edit',
];

test('R-28 parseRoute reads each of the nine routes of ADR-005 and routeToHash gives the same hash back', () => {
  const names = new Set();
  for (const hash of HASHES) {
    const route = parseRoute(hash);
    assert.notEqual(route.name, 'not-found', hash);
    assert.equal(routeToHash(route), hash);
    names.add(route.name);
  }
  assert.equal(names.size, 9);
  assert.deepEqual(parseRoute('#/customers/c1/edit'), { name: 'customer-edit', id: 'c1' });
  assert.deepEqual(parseRoute('#/orders/new'), { name: 'order-new' });
});

test('R-28 parseRoute of #/nothing and #/orders/1/2/3 gives not-found', () => {
  assert.deepEqual(parseRoute('#/nothing'), { name: 'not-found' });
  assert.deepEqual(parseRoute('#/orders/1/2/3'), { name: 'not-found' });
  assert.deepEqual(parseRoute('#/customers/c1/orders'), { name: 'not-found' });
  assert.deepEqual(parseRoute('#/orders/o1/edit/x'), { name: 'not-found' });
});

test('R-31 parseRoute keeps no text of an unknown hash in its result', () => {
  const route = parseRoute('#/secret-ana@example.com');
  assert.deepEqual(route, { name: 'not-found' });
  assert.equal(JSON.stringify(route).includes('secret'), false);
  assert.equal(routeToHash(route).includes('secret'), false);
});

test('R-31 the title of every route comes from the frozen table and holds no id', () => {
  assert.ok(Object.isFrozen(ROUTE_TITLES));
  for (const hash of HASHES) {
    const title = routeTitle(parseRoute(hash));
    assert.ok(title.endsWith(' - Invoice app'), title);
    assert.equal(title.includes('c1') || title.includes('o1'), false);
  }
  assert.equal(routeTitle(parseRoute('#/customers')), 'Customers - Invoice app');
  assert.equal(routeTitle(parseRoute('#/customers/c1/edit')), 'Edit customer - Invoice app');
  assert.equal(routeTitle(parseRoute('#/orders/o1')), 'Order - Invoice app');
  assert.equal(routeTitle(parseRoute('#/zzz')), 'Not found - Invoice app');
});
