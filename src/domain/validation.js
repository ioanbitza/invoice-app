import { parsePriceToCents, MAX_QUANTITY } from './money.js';
import { isRealDate } from './dates.js';

const NAME_MAX = 100;
const FIELD_MAX = 200;
const NOTES_MAX = 500;
const INVISIBLE_ONLY = /^[\p{Cf}\p{Z}\s]*$/u;
const QUANTITY_PATTERN = /^\d+$/;

const MESSAGES = Object.freeze({
  'customer.name.length': 'Name must be 1 to 100 characters.',
  'customer.email.format': 'Email must have one @ with text on both sides and a dot after it.',
  'customer.email.length': 'Email must be at most 200 characters.',
  'customer.phone.length': 'Phone must be at most 200 characters.',
  'customer.address.length': 'Address must be at most 200 characters.',
  'order.customer.required': 'Choose a customer.',
  'order.date.invalid': 'Date must be a real calendar date.',
  'order.notes.length': 'Notes must be at most 500 characters.',
  'line.description.length': 'Description must be 1 to 200 characters.',
  'line.quantity.invalid': 'Quantity must be a whole number from 1 to 9999.',
  'line.unitPrice.invalid': 'Unit price must be 0.00 to 1000000.00, with at most two decimals.',
});

function fieldError(field, code) {
  return { field, code, message: MESSAGES[code] };
}

function outcome(errors, value) {
  return errors.length === 0 ? { ok: true, value } : { ok: false, errors };
}

function textOf(input, field) {
  const raw = input[field];
  return typeof raw === 'string' ? raw.trim() : '';
}

function untrimmedOf(input, field) {
  const raw = input[field];
  return typeof raw === 'string' ? raw : '';
}

function lengthError(field, code, text, min, max) {
  if (min > 0 && INVISIBLE_ONLY.test(text)) return fieldError(field, code);
  return text.length < min || text.length > max ? fieldError(field, code) : null;
}

function emailError(email) {
  if (email === '') return null;
  if (email.length > FIELD_MAX) return fieldError('email', 'customer.email.length');
  const parts = email.split('@');
  const valid = parts.length === 2 && parts[0].length > 0 && parts[1].includes('.');
  return valid ? null : fieldError('email', 'customer.email.format');
}

/** Checks raw customer form strings (R-01, R-02); returns the cleaned value or every field error. */
export function validateCustomer(input) {
  const value = {
    name: textOf(input, 'name'),
    email: textOf(input, 'email'),
    phone: textOf(input, 'phone'),
    address: textOf(input, 'address'),
  };
  const errors = [
    lengthError('name', 'customer.name.length', value.name, 1, NAME_MAX),
    emailError(value.email),
    lengthError('phone', 'customer.phone.length', value.phone, 0, FIELD_MAX),
    lengthError('address', 'customer.address.length', value.address, 0, FIELD_MAX),
  ].filter(Boolean);
  return outcome(errors, value);
}

function dateAndNotesErrors(date, notes) {
  return [
    isRealDate(date) ? null : fieldError('date', 'order.date.invalid'),
    lengthError('notes', 'order.notes.length', notes, 0, NOTES_MAX),
  ].filter(Boolean);
}

/** Checks the fields of a new order (R-06): the customer, the date and the notes. */
export function validateNewOrder(input) {
  const value = {
    customerId: untrimmedOf(input, 'customerId'),
    date: untrimmedOf(input, 'date'),
    notes: textOf(input, 'notes'),
  };
  const errors = [
    value.customerId === '' ? fieldError('customerId', 'order.customer.required') : null,
    ...dateAndNotesErrors(value.date, value.notes),
  ].filter(Boolean);
  return outcome(errors, value);
}

/** Checks the fields an order edit may change (R-07): date and notes only. */
export function validateOrderEdit(input) {
  const value = { date: untrimmedOf(input, 'date'), notes: textOf(input, 'notes') };
  return outcome(dateAndNotesErrors(value.date, value.notes), value);
}

function parseQuantity(text) {
  if (!QUANTITY_PATTERN.test(text)) return null;
  const quantity = Number(text);
  return quantity >= 1 && quantity <= MAX_QUANTITY ? quantity : null;
}

/** Checks raw line form strings (R-11, R-12); the value holds quantity and unitPriceCents as integers. */
export function validateLine(input) {
  const description = textOf(input, 'description');
  const quantity = parseQuantity(textOf(input, 'quantity'));
  const unitPriceCents = parsePriceToCents(textOf(input, 'unitPrice'));
  const errors = [
    lengthError('description', 'line.description.length', description, 1, FIELD_MAX),
    quantity === null ? fieldError('quantity', 'line.quantity.invalid') : null,
    unitPriceCents === null ? fieldError('unitPrice', 'line.unitPrice.invalid') : null,
  ].filter(Boolean);
  return outcome(errors, { description, quantity, unitPriceCents });
}
