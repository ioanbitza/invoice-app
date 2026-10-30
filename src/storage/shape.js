import { isRealDate } from '../domain/dates.js';

const ORDER_NUMBER = /^ORD-(\d{4,})$/;
const ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const RESERVED_ID = 'new';

const ROOT_KEYS = ['nextOrderNumber', 'customers', 'orders'];
const CUSTOMER_KEYS = ['id', 'name', 'email', 'phone', 'address'];
const ORDER_KEYS = ['id', 'number', 'customerId', 'date', 'notes', 'lines'];
const LINE_KEYS = ['id', 'description', 'quantity', 'unitPriceCents'];

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value) => typeof value === 'string';
const isCount = (value) => Number.isSafeInteger(value) && value >= 0;
const isId = (value) => isText(value) && ID_PATTERN.test(value) && value !== RESERVED_ID;

function hasExactKeys(record, names) {
  const keys = Object.keys(record);
  return keys.length === names.length && names.every((name) => keys.includes(name));
}

function hasTextFields(record, names) {
  return names.every((name) => isText(record[name]));
}

function isLine(line) {
  return (
    isObject(line) &&
    hasExactKeys(line, LINE_KEYS) &&
    isId(line.id) &&
    isText(line.description) &&
    isCount(line.quantity) &&
    isCount(line.unitPriceCents) &&
    Number.isSafeInteger(line.quantity * line.unitPriceCents)
  );
}

function hasSafeTotal(order) {
  return Number.isSafeInteger(order.lines.reduce((total, line) => total + line.quantity * line.unitPriceCents, 0));
}

function orderNumberValue(order) {
  const match = ORDER_NUMBER.exec(order.number);
  return match === null ? 0 : Number(match[1]);
}

function hasCanonicalNumber(order) {
  const value = orderNumberValue(order);
  return value >= 1 && order.number === `ORD-${String(value).padStart(4, '0')}`;
}

function isOrder(order) {
  return (
    isObject(order) &&
    hasExactKeys(order, ORDER_KEYS) &&
    isId(order.id) &&
    isId(order.customerId) &&
    hasTextFields(order, ['number', 'date', 'notes']) &&
    hasCanonicalNumber(order) &&
    isRealDate(order.date) &&
    Array.isArray(order.lines) &&
    order.lines.every(isLine) &&
    hasSafeTotal(order)
  );
}

function isCustomer(customer) {
  return (
    isObject(customer) && hasExactKeys(customer, CUSTOMER_KEYS) && isId(customer.id) && hasTextFields(customer, CUSTOMER_KEYS)
  );
}

function allUnique(values) {
  return new Set(values).size === values.length;
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

function hasValidCounter(value) {
  return Number.isSafeInteger(value) && value >= 1 && Number.isSafeInteger(value + 1);
}

/** True when the stored document has every field with its type, no other key, and consistent links (ADR-004, Reading). Form rules are not checked. */
export function hasValidShape(data) {
  return (
    isObject(data) &&
    hasExactKeys(data, ROOT_KEYS) &&
    hasValidCounter(data.nextOrderNumber) &&
    Array.isArray(data.customers) &&
    Array.isArray(data.orders) &&
    data.customers.every(isCustomer) &&
    data.orders.every(isOrder) &&
    hasValidLinks(data)
  );
}
