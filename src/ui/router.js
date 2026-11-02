export const ROUTE_TITLES = Object.freeze({
  customers: 'Customers - Invoice app',
  'customer-new': 'New customer - Invoice app',
  customer: 'Customer - Invoice app',
  'customer-edit': 'Edit customer - Invoice app',
  'customer-order-new': 'New order - Invoice app',
  orders: 'Orders - Invoice app',
  'order-new': 'New order - Invoice app',
  order: 'Order - Invoice app',
  'order-edit': 'Edit order - Invoice app',
  'not-found': 'Not found - Invoice app',
});

const NOT_FOUND = Object.freeze({ name: 'not-found' });

function customerRoute(parts) {
  if (parts.length === 1) return { name: 'customers' };
  if (parts.length === 2) {
    return parts[1] === 'new' ? { name: 'customer-new' } : { name: 'customer', id: parts[1] };
  }
  if (parts.length === 3 && parts[2] === 'edit') return { name: 'customer-edit', id: parts[1] };
  if (parts.length === 4 && parts[2] === 'orders' && parts[3] === 'new') {
    return { name: 'customer-order-new', id: parts[1] };
  }
  return null;
}

function orderRoute(parts) {
  if (parts.length === 1) return { name: 'orders' };
  if (parts.length === 2) {
    return parts[1] === 'new' ? { name: 'order-new' } : { name: 'order', id: parts[1] };
  }
  if (parts.length === 3 && parts[2] === 'edit') return { name: 'order-edit', id: parts[1] };
  return null;
}

/** Reads a location hash into a route; an unknown hash gives not-found with none of its text (R-31). */
export function parseRoute(hash) {
  if (!hash.startsWith('#/')) return { ...NOT_FOUND };
  const parts = hash.slice(2).split('/');
  if (parts.some((part) => part === '')) return { ...NOT_FOUND };
  let route = null;
  if (parts[0] === 'customers') route = customerRoute(parts);
  if (parts[0] === 'orders') route = orderRoute(parts);
  return route ?? { ...NOT_FOUND };
}

const HASH_BUILDERS = {
  customers: () => '#/customers',
  'customer-new': () => '#/customers/new',
  customer: (r) => `#/customers/${r.id}`,
  'customer-edit': (r) => `#/customers/${r.id}/edit`,
  'customer-order-new': (r) => `#/customers/${r.id}/orders/new`,
  orders: () => '#/orders',
  'order-new': () => '#/orders/new',
  order: (r) => `#/orders/${r.id}`,
  'order-edit': (r) => `#/orders/${r.id}/edit`,
};

export function routeToHash(route) {
  if (!HASH_BUILDERS[route.name]) throw new Error(`No address for route ${route.name}`);
  return HASH_BUILDERS[route.name](route);
}

export function routeTitle(route) {
  return ROUTE_TITLES[route.name];
}
