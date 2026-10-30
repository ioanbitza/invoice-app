import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCustomer, validateNewOrder, validateOrderEdit, validateLine } from '../src/domain/validation.js';

const customer = (over = {}) => ({ name: 'Ana Pop', email: '', phone: '', address: '', ...over });
const newOrder = (over = {}) => ({ customerId: 'c1', date: '2026-10-30', notes: '', ...over });
const line = (over = {}) => ({ description: 'Widget', quantity: '3', unitPrice: '19.99', ...over });

const codes = (result) => result.errors.map((error) => error.code);
const fields = (result) => result.errors.map((error) => error.field);

test('R-01 a name of 1 and of 100 characters after trimming is valid, stored trimmed', () => {
  assert.equal(validateCustomer(customer({ name: 'A' })).value.name, 'A');
  const name = 'a'.repeat(100);
  assert.equal(validateCustomer(customer({ name: `  ${name}  ` })).value.name, name);
});

test('R-01 an empty name and a name of 101 characters give customer.name.length', () => {
  const empty = validateCustomer(customer({ name: '  ' }));
  assert.equal(empty.ok, false);
  assert.deepEqual(empty.errors, [
    { field: 'name', code: 'customer.name.length', message: 'Name must be 1 to 100 characters.' },
  ]);
  assert.deepEqual(codes(validateCustomer(customer({ name: 'a'.repeat(101) }))), ['customer.name.length']);
});

test('R-01 email a@b.c is valid and empty email is stored as an empty string', () => {
  assert.equal(validateCustomer(customer({ email: ' a@b.c ' })).value.email, 'a@b.c');
  assert.equal(validateCustomer(customer({ email: '' })).value.email, '');
});

test('R-01 emails ab.c, a@b, @b.c, a@bc, a@b@c.d and a@ each give an email error', () => {
  for (const email of ['ab.c', 'a@b', '@b.c', 'a@bc', 'a@b@c.d', 'a@']) {
    const result = validateCustomer(customer({ email }));
    assert.deepEqual(codes(result), ['customer.email.format'], email);
    assert.equal(
      result.errors[0].message,
      'Email must have one @ with text on both sides and a dot after it.',
    );
  }
});

test('R-01 email a@.c is valid because R-01 asks only for a dot after the @', () => {
  assert.equal(validateCustomer(customer({ email: 'a@.c' })).ok, true);
  assert.equal(validateCustomer(customer({ email: 'a@b.' })).ok, true);
});

test('R-01 email, phone and address of 200 characters are valid and of 201 characters give a length error', () => {
  const email200 = `a@b.${'c'.repeat(196)}`;
  const valid = validateCustomer(customer({ email: email200, phone: 'p'.repeat(200), address: 'a'.repeat(200) }));
  assert.equal(valid.ok, true);
  const email201 = `a@b.${'c'.repeat(197)}`;
  const result = validateCustomer(customer({ email: email201, phone: 'p'.repeat(201), address: 'a'.repeat(201) }));
  assert.deepEqual(codes(result), ['customer.email.length', 'customer.phone.length', 'customer.address.length']);
  assert.equal(result.errors[0].message, 'Email must be at most 200 characters.');
  assert.equal(result.errors[1].message, 'Phone must be at most 200 characters.');
  assert.equal(result.errors[2].message, 'Address must be at most 200 characters.');
});

test('R-02 the customer check gives the same errors for an edit as for a new customer', () => {
  const invalid = customer({ name: '', email: 'ab.c' });
  assert.deepEqual(validateCustomer({ id: 'c1', ...invalid }).errors, validateCustomer(invalid).errors);
  assert.deepEqual(validateCustomer({ id: 'c1', name: 'B' }).value, {
    name: 'B',
    email: '',
    phone: '',
    address: '',
  });
});

test('R-06 an order date of 2026-02-30 gives Date must be a real calendar date.', () => {
  for (const date of ['2026-02-30', '', 'yesterday']) {
    const result = validateNewOrder(newOrder({ date }));
    assert.deepEqual(result.errors, [
      { field: 'date', code: 'order.date.invalid', message: 'Date must be a real calendar date.' },
    ]);
  }
});

test('R-06 notes of 500 characters after trimming are valid and of 501 give a length error', () => {
  const notes = 'n'.repeat(500);
  assert.equal(validateNewOrder(newOrder({ notes: ` ${notes} ` })).value.notes, notes);
  const result = validateNewOrder(newOrder({ notes: 'n'.repeat(501) }));
  assert.deepEqual(result.errors, [
    { field: 'notes', code: 'order.notes.length', message: 'Notes must be at most 500 characters.' },
  ]);
});

test('R-06 an order with no customer chosen gives Choose a customer.', () => {
  const result = validateNewOrder(newOrder({ customerId: '' }));
  assert.deepEqual(result.errors, [
    { field: 'customerId', code: 'order.customer.required', message: 'Choose a customer.' },
  ]);
  assert.equal(validateNewOrder(newOrder()).value.customerId, 'c1');
});

test('R-07 the order edit check refuses the same date and notes as the create check', () => {
  const input = { date: '2026-02-30', notes: 'n'.repeat(501) };
  const onEdit = validateOrderEdit(input);
  assert.deepEqual(onEdit.errors, validateNewOrder(newOrder(input)).errors);
  assert.deepEqual(validateOrderEdit({ date: '2026-10-30', notes: ' x ' }).value, { date: '2026-10-30', notes: 'x' });
});

test('R-11 a description of 1 and of 200 characters is valid and empty or 201 characters gives a length error', () => {
  assert.equal(validateLine(line({ description: 'W' })).ok, true);
  const description = 'd'.repeat(200);
  assert.equal(validateLine(line({ description: `  ${description} ` })).value.description, description);
  for (const bad of ['', '   ', 'd'.repeat(201)]) {
    assert.deepEqual(validateLine(line({ description: bad })).errors, [
      { field: 'description', code: 'line.description.length', message: 'Description must be 1 to 200 characters.' },
    ]);
  }
});

test('R-11 quantities 1 and 9999 are valid; 0, 10000, 2.0, 1e3, -1 and empty each give a quantity error', () => {
  assert.equal(validateLine(line({ quantity: '1' })).value.quantity, 1);
  assert.equal(validateLine(line({ quantity: ' 9999 ' })).value.quantity, 9999);
  for (const quantity of ['0', '10000', '2.0', '1e3', '-1', '', '+1', 'two']) {
    assert.deepEqual(validateLine(line({ quantity })).errors, [
      {
        field: 'quantity',
        code: 'line.quantity.invalid',
        message: 'Quantity must be a whole number from 1 to 9999.',
      },
    ]);
  }
});

test('R-11 a unit price of 19,99 is stored as 1999 cents and 1,234.50 gives the unit price error next to unitPrice', () => {
  assert.equal(validateLine(line({ unitPrice: '19,99' })).value.unitPriceCents, 1999);
  assert.equal(validateLine(line({ unitPrice: '0' })).value.unitPriceCents, 0);
  for (const unitPrice of ['1,234.50', '1000000.01', '', '5.555']) {
    assert.deepEqual(validateLine(line({ unitPrice })).errors, [
      {
        field: 'unitPrice',
        code: 'line.unitPrice.invalid',
        message: 'Unit price must be 0.00 to 1000000.00, with at most two decimals.',
      },
    ]);
  }
});

test('R-12 the line check gives the same errors for an edit as for a new line', () => {
  const invalid = line({ description: '', quantity: '0', unitPrice: '1,234.50' });
  assert.deepEqual(validateLine({ ...invalid, lineId: 'l1' }).errors, validateLine(invalid).errors);
  assert.deepEqual(validateLine(line()).value, { description: 'Widget', quantity: 3, unitPriceCents: 1999 });
});

test('R-17 three invalid fields give three errors in form order', () => {
  assert.deepEqual(
    fields(validateCustomer(customer({ name: '', email: 'ab.c', address: 'a'.repeat(201) }))),
    ['name', 'email', 'address'],
  );
  assert.deepEqual(
    fields(validateNewOrder(newOrder({ customerId: '', date: '', notes: 'n'.repeat(501) }))),
    ['customerId', 'date', 'notes'],
  );
  assert.deepEqual(
    fields(validateLine(line({ description: '', quantity: 'two', unitPrice: 'free' }))),
    ['description', 'quantity', 'unitPrice'],
  );
});

test('R-31 no error message contains the text the user typed', () => {
  const typed = 'SECRET';
  const long = (length) => typed.repeat(Math.ceil(length / typed.length));
  const results = [
    validateCustomer({ name: long(101), email: typed, phone: long(201), address: long(201) }),
    validateNewOrder({ customerId: '', date: typed, notes: long(501) }),
    validateLine({ description: long(201), quantity: typed, unitPrice: typed }),
  ];
  for (const result of results) {
    assert.ok(result.errors.length >= 2);
    assert.equal(JSON.stringify(result).includes(typed), false);
  }
});

test('R-11 a zero-padded quantity 000005 is stored as 5 and 100000 is refused by the range', () => {
  assert.equal(validateLine(line({ quantity: '000005' })).value.quantity, 5);
  assert.equal(validateLine(line({ quantity: '0009999' })).value.quantity, 9999);
  for (const quantity of ['100000', '0010000', '00000']) {
    assert.equal(validateLine(line({ quantity })).errors[0].code, 'line.quantity.invalid');
  }
});

test('R-01 a customer name made only of invisible characters gives the name length error', () => {
  for (const name of ['​', ' ​﻿ ', '‍⁠']) {
    assert.equal(validateCustomer({ name }).errors[0].code, 'customer.name.length');
  }
  assert.equal(validateCustomer({ name: 'A​' }).ok, true);
});

test('R-11 a line description made only of invisible characters gives the description length error', () => {
  for (const description of ['​', '​ ­']) {
    assert.equal(validateLine(line({ description })).errors[0].code, 'line.description.length');
  }
});
