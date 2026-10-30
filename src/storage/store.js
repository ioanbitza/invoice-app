const KEY = 'invoice-app';

function emptyState() {
  return { version: 1, nextOrderNumber: 1, customers: [], orders: [] };
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function allStrings(item, fields) {
  return isObject(item) && fields.every((f) => typeof item[f] === 'string');
}

function isLine(line) {
  return allStrings(line, ['id', 'description'])
    && Number.isInteger(line.quantity) && Number.isInteger(line.unitPriceCents);
}

function isOrder(order) {
  return allStrings(order, ['id', 'customerId', 'date']) && Number.isInteger(order.number)
    && Array.isArray(order.lines) && order.lines.every(isLine);
}

function hasValidShape(data) {
  return isObject(data) && data.version === 1 && Number.isInteger(data.nextOrderNumber)
    && Array.isArray(data.customers) && data.customers.every((c) => allStrings(c, ['id', 'name', 'email', 'phone']))
    && Array.isArray(data.orders) && data.orders.every(isOrder);
}

function readableError(prefix, error) {
  return `${prefix}: ${error instanceof Error ? error.message : String(error)}`;
}

export function createStore(storage) {
  let state = null;
  let loaded = false;

  function load() {
    let text;
    try {
      text = storage.getItem(KEY);
    } catch (error) {
      return { ok: false, error: readableError('Could not read saved data', error) };
    }
    if (text === null) {
      state = emptyState();
      loaded = true;
      return { ok: true, state };
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      return { ok: false, error: readableError('Saved data is not valid JSON', error) };
    }
    if (!hasValidShape(data)) {
      return { ok: false, error: 'Saved data has an unexpected shape or version and was left untouched' };
    }
    state = data;
    loaded = true;
    return { ok: true, state };
  }

  function save(nextState) {
    if (!loaded) {
      return { ok: false, error: 'Saved data could not be loaded, so nothing is written over it' };
    }
    try {
      storage.setItem(KEY, JSON.stringify(nextState));
    } catch (error) {
      return { ok: false, error: readableError('Could not save', error) };
    }
    state = nextState;
    return { ok: true };
  }

  function current() {
    return state;
  }

  return { load, save, current };
}
