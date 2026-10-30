const ORDER_NUMBER = /^ORD-(\d+)$/;

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value) => typeof value === 'string';
const isCount = (value) => Number.isSafeInteger(value);

function hasTextFields(record, names) {
  return isObject(record) && names.every((name) => isText(record[name]));
}

function isLine(line) {
  return hasTextFields(line, ['id', 'description']) && isCount(line.quantity) && isCount(line.unitPriceCents);
}

function isOrder(order) {
  return (
    hasTextFields(order, ['id', 'number', 'customerId', 'date', 'notes']) &&
    ORDER_NUMBER.test(order.number) &&
    Array.isArray(order.lines) &&
    order.lines.every(isLine)
  );
}

function isCustomer(customer) {
  return hasTextFields(customer, ['id', 'name', 'email', 'phone', 'address']);
}

function allUnique(values) {
  return new Set(values).size === values.length;
}

function orderNumberValue(order) {
  return Number(ORDER_NUMBER.exec(order.number)[1]);
}

function hasValidLinks(data) {
  const customerIds = data.customers.map((customer) => customer.id);
  const lineIds = data.orders.flatMap((order) => order.lines.map((line) => line.id));
  return (
    allUnique(customerIds) &&
    allUnique(data.orders.map((order) => order.id)) &&
    allUnique(data.orders.map((order) => order.number)) &&
    allUnique(lineIds) &&
    data.orders.every((order) => customerIds.includes(order.customerId)) &&
    data.orders.every((order) => orderNumberValue(order) < data.nextOrderNumber)
  );
}

/** True when the stored document has every field with its type and consistent links (ADR-004, Reading). Form rules are not checked. */
export function hasValidShape(data) {
  return (
    isObject(data) &&
    isCount(data.nextOrderNumber) &&
    Array.isArray(data.customers) &&
    Array.isArray(data.orders) &&
    data.customers.every(isCustomer) &&
    data.orders.every(isOrder) &&
    hasValidLinks(data)
  );
}
