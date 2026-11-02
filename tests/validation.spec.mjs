import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

// The plan names the path src/domain/validation.js (S2) but no export of it, so the rules are proved through the
// commands that must call them (ADR-007). Each group skips until the module of its commands exists: S3, S4, S5.
// Commands take raw strings from the form, in the shape command(data, input, deps) of ADR-003.
const built = (file) => existsSync(new URL(`../src/domain/${file}`, import.meta.url));
const skipCustomers = built('customers.js') ? false : 'S3 not built yet';
const skipOrders = built('orders.js') ? false : 'S4 not built yet';
const skipLines = built('lines.js') ? false : 'S5 not built yet';
const { createCustomer, updateCustomer } = built('customers.js') ? await import('../src/domain/customers.js') : {};
const { createOrder, updateOrder } = built('orders.js') ? await import('../src/domain/orders.js') : {};
const { addLine, updateLine } = built('lines.js') ? await import('../src/domain/lines.js') : {};

const NAME_ERROR = 'Name must be 1 to 100 characters.';
const EMAIL_ERROR = 'Email must have one @ with text on both sides and a dot after it.';
const EMAIL_LENGTH_ERROR = 'Email must be at most 200 characters.';
const PHONE_ERROR = 'Phone must be at most 200 characters.';
const ADDRESS_ERROR = 'Address must be at most 200 characters.';
const CUSTOMER_ERROR = 'Choose a customer.';
const DATE_ERROR = 'Date must be a real calendar date.';
const NOTES_ERROR = 'Notes must be at most 500 characters.';
const DESCRIPTION_ERROR = 'Description must be 1 to 200 characters.';
const QUANTITY_ERROR = 'Quantity must be a whole number from 1 to 9999.';
const PRICE_ERROR = 'Unit price must be 0.00 to 1000000.00, with at most two decimals.';

const deps = { newId: () => 'new-id', today: '2026-10-30' };

const aCustomer = (over = {}) => ({ id: 'c1', name: 'Ana Pop', email: '', phone: '', address: '', ...over });
const anOrder = (over = {}) => ({
  id: 'o1',
  number: 'ORD-0001',
  customerId: 'c1',
  date: '2026-10-30',
  notes: '',
  lines: [],
  ...over,
});
const aLine = (over = {}) => ({ id: 'l1', description: 'Widget', quantity: 1, unitPriceCents: 100, ...over });

const someData = () => ({
  nextOrderNumber: 2,
  customers: [aCustomer()],
  orders: [anOrder({ lines: [aLine()] })],
});

const customerInput = (over = {}) => ({ name: 'Ana Pop', email: '', phone: '', address: '', ...over });
const orderInput = (over = {}) => ({ customerId: 'c1', date: '2026-10-30', notes: '', ...over });
const lineInput = (over = {}) => ({ orderId: 'o1', description: 'Widget', quantity: '3', unitPrice: '19.99', ...over });

const saveCustomer = (input) => createCustomer(someData(), input, deps);
const saveOrder = (input) => createOrder(someData(), input, deps);
const saveLine = (input) => addLine(someData(), input, deps);

const savedCustomer = (result) => result.data.customers.find((customer) => customer.id === 'new-id');
const savedOrder = (result) => result.data.orders.find((order) => order.id === 'new-id');
const savedLine = (result) => result.data.orders[0].lines.find((line) => line.id === 'new-id');

const shown = (result) => result.errors.map(({ field, message }) => ({ field, message }));
const messages = (result) => result.errors.map(({ message }) => message);

test('R-01 a name of 1 character is valid', { skip: skipCustomers }, () => {
  assert.equal(savedCustomer(saveCustomer(customerInput({ name: 'A' }))).name, 'A');
});

test('R-01 a name of 100 characters after trimming is valid and stored trimmed', { skip: skipCustomers }, () => {
  const name = 'a'.repeat(100);

  const result = saveCustomer(customerInput({ name: `  ${name}  ` }));

  assert.equal(savedCustomer(result).name, name);
});

test('R-01 an empty name gives customer.name.length', { skip: skipCustomers }, () => {
  const result = saveCustomer(customerInput({ name: '' }));

  assert.deepEqual(result, {
    ok: false,
    errors: [{ field: 'name', code: 'customer.name.length', message: NAME_ERROR }],
  });
});

test('R-01 a name of spaces only gives customer.name.length', { skip: skipCustomers }, () => {
  const result = saveCustomer(customerInput({ name: '    ' }));

  assert.equal(result.errors[0].code, 'customer.name.length');
});

test('R-01 a name of 101 characters gives customer.name.length', { skip: skipCustomers }, () => {
  const result = saveCustomer(customerInput({ name: 'a'.repeat(101) }));

  assert.equal(result.errors[0].code, 'customer.name.length');
});

test('R-01 email a@b.c is valid', { skip: skipCustomers }, () => {
  assert.equal(savedCustomer(saveCustomer(customerInput({ email: 'a@b.c' }))).email, 'a@b.c');
});

test('R-01 an email is stored trimmed', { skip: skipCustomers }, () => {
  assert.equal(savedCustomer(saveCustomer(customerInput({ email: '  a@b.c  ' }))).email, 'a@b.c');
});

test('R-01 an empty email is stored as an empty string', { skip: skipCustomers }, () => {
  assert.equal(savedCustomer(saveCustomer(customerInput({ email: '' }))).email, '');
});

for (const email of ['ab.c', 'a@b', '@b.c', 'a@bc', 'a@b@c.d', 'a@']) {
  test(`R-01 email ${email} gives the email error`, { skip: skipCustomers }, () => {
    assert.deepEqual(shown(saveCustomer(customerInput({ email }))), [{ field: 'email', message: EMAIL_ERROR }]);
  });
}

for (const email of ['a@.c', 'a@b.']) {
  test(`R-01 email ${email} is valid because R-01 asks only for a dot after the @`, { skip: skipCustomers }, () => {
    assert.equal(savedCustomer(saveCustomer(customerInput({ email }))).email, email);
  });
}

test('R-01 an email of 200 characters is valid', { skip: skipCustomers }, () => {
  const email = `a@b.${'c'.repeat(196)}`;

  assert.equal(savedCustomer(saveCustomer(customerInput({ email }))).email, email);
});

test('R-01 an email of 201 characters gives a length error', { skip: skipCustomers }, () => {
  const email = `a@b.${'c'.repeat(197)}`;

  assert.deepEqual(shown(saveCustomer(customerInput({ email }))), [{ field: 'email', message: EMAIL_LENGTH_ERROR }]);
});

for (const [field, message] of [['phone', PHONE_ERROR], ['address', ADDRESS_ERROR]]) {
  test(`R-01 a ${field} of 200 characters is valid`, { skip: skipCustomers }, () => {
    const text = 'a'.repeat(200);

    assert.equal(savedCustomer(saveCustomer(customerInput({ [field]: text })))[field], text);
  });

  test(`R-01 a ${field} of 201 characters gives a length error`, { skip: skipCustomers }, () => {
    assert.deepEqual(shown(saveCustomer(customerInput({ [field]: 'a'.repeat(201) }))), [{ field, message }]);
  });
}

test('R-02 the customer check gives the same errors for an edit as for a new customer', { skip: skipCustomers }, () => {
  const invalid = customerInput({ name: '', email: 'ab.c' });

  const onEdit = updateCustomer(someData(), { id: 'c1', ...invalid }, deps);

  assert.deepEqual(onEdit.errors, saveCustomer(invalid).errors);
  assert.deepEqual(messages(onEdit), [NAME_ERROR, EMAIL_ERROR]);
});

for (const date of ['2026-02-30', '', 'yesterday']) {
  test(`R-06 an order date of "${date}" gives Date must be a real calendar date.`, { skip: skipOrders }, () => {
    assert.deepEqual(shown(saveOrder(orderInput({ date }))), [{ field: 'date', message: DATE_ERROR }]);
  });
}

test('R-06 notes of 500 characters after trimming are valid and stored trimmed', { skip: skipOrders }, () => {
  const notes = 'n'.repeat(500);

  assert.equal(savedOrder(saveOrder(orderInput({ notes: `  ${notes}  ` }))).notes, notes);
});

test('R-06 notes of 501 characters give a length error', { skip: skipOrders }, () => {
  const result = saveOrder(orderInput({ notes: 'n'.repeat(501) }));

  assert.deepEqual(shown(result), [{ field: 'notes', message: NOTES_ERROR }]);
});

test('R-06 empty notes are stored as an empty string', { skip: skipOrders }, () => {
  assert.equal(savedOrder(saveOrder(orderInput({ notes: '' }))).notes, '');
});

test('R-06 an order with no customer chosen gives Choose a customer.', { skip: skipOrders }, () => {
  assert.deepEqual(messages(saveOrder(orderInput({ customerId: '' }))), [CUSTOMER_ERROR]);
});

test('R-07 the order edit check refuses the same date as the create check', { skip: skipOrders }, () => {
  const onEdit = updateOrder(someData(), { id: 'o1', date: '2026-02-30', notes: '' }, deps);

  assert.deepEqual(shown(onEdit), [{ field: 'date', message: DATE_ERROR }]);
});

test('R-07 the order edit check refuses the same notes as the create check', { skip: skipOrders }, () => {
  const onEdit = updateOrder(someData(), { id: 'o1', date: '2026-10-30', notes: 'n'.repeat(501) }, deps);

  assert.deepEqual(shown(onEdit), [{ field: 'notes', message: NOTES_ERROR }]);
});

test('R-11 a description of 1 character is valid', { skip: skipLines }, () => {
  assert.equal(savedLine(saveLine(lineInput({ description: 'W' }))).description, 'W');
});

test('R-11 a description of 200 characters after trimming is valid and stored trimmed', { skip: skipLines }, () => {
  const description = 'd'.repeat(200);

  assert.equal(savedLine(saveLine(lineInput({ description: `  ${description}  ` }))).description, description);
});

for (const [label, description] of [['an empty', ''], ['a spaces-only', '   '], ['a 201 character', 'd'.repeat(201)]]) {
  test(`R-11 ${label} description gives a length error`, { skip: skipLines }, () => {
    assert.deepEqual(shown(saveLine(lineInput({ description }))), [
      { field: 'description', message: DESCRIPTION_ERROR },
    ]);
  });
}

for (const [text, quantity] of [['1', 1], ['9999', 9999], [' 3 ', 3]]) {
  test(`R-11 quantity "${text}" is valid and stored as the integer ${quantity}`, { skip: skipLines }, () => {
    assert.equal(savedLine(saveLine(lineInput({ quantity: text }))).quantity, quantity);
  });
}

for (const quantity of ['0', '10000', '2.0', '1e3', '-1', '', '+1', 'two']) {
  test(`R-11 quantity "${quantity}" gives a quantity error`, { skip: skipLines }, () => {
    assert.deepEqual(shown(saveLine(lineInput({ quantity }))), [{ field: 'quantity', message: QUANTITY_ERROR }]);
  });
}

for (const [text, cents] of [['19,99', 1999], ['0', 0], ['1000000.00', 100000000]]) {
  test(`R-11 a unit price of ${text} is stored as ${cents} cents`, { skip: skipLines }, () => {
    assert.equal(savedLine(saveLine(lineInput({ unitPrice: text }))).unitPriceCents, cents);
  });
}

for (const unitPrice of ['1,234.50', '1000000.01', '', '5.555']) {
  test(`R-11 a unit price of "${unitPrice}" gives the unit price error next to unitPrice`, { skip: skipLines }, () => {
    assert.deepEqual(shown(saveLine(lineInput({ unitPrice }))), [{ field: 'unitPrice', message: PRICE_ERROR }]);
  });
}

test('R-12 the line check gives the same errors for an edit as for a new line', { skip: skipLines }, () => {
  const invalid = lineInput({ description: '', quantity: '0', unitPrice: '1,234.50' });

  const onEdit = updateLine(someData(), { ...invalid, lineId: 'l1' }, deps);

  assert.deepEqual(onEdit.errors, saveLine(invalid).errors);
  assert.deepEqual(messages(onEdit), [DESCRIPTION_ERROR, QUANTITY_ERROR, PRICE_ERROR]);
});

test('R-17 three invalid customer fields give three errors in form order', { skip: skipCustomers }, () => {
  const result = saveCustomer(customerInput({ name: '', email: 'ab.c', address: 'a'.repeat(201) }));

  assert.deepEqual(shown(result), [
    { field: 'name', message: NAME_ERROR },
    { field: 'email', message: EMAIL_ERROR },
    { field: 'address', message: ADDRESS_ERROR },
  ]);
});

test('R-17 three invalid order fields give three errors in form order', { skip: skipOrders }, () => {
  const result = saveOrder(orderInput({ customerId: '', date: '', notes: 'n'.repeat(501) }));

  assert.deepEqual(messages(result), [CUSTOMER_ERROR, DATE_ERROR, NOTES_ERROR]);
});

test('R-17 three invalid line fields give three errors in form order', { skip: skipLines }, () => {
  const result = saveLine(lineInput({ description: '', quantity: 'two', unitPrice: 'free' }));

  assert.deepEqual(shown(result), [
    { field: 'description', message: DESCRIPTION_ERROR },
    { field: 'quantity', message: QUANTITY_ERROR },
    { field: 'unitPrice', message: PRICE_ERROR },
  ]);
});

const TYPED = 'SECRET';
const typedLong = (length) => TYPED.repeat(Math.ceil(length / TYPED.length));

test('R-31 no customer error contains the text the user typed', { skip: skipCustomers }, () => {
  const result = saveCustomer({
    name: typedLong(101),
    email: TYPED,
    phone: typedLong(201),
    address: typedLong(201),
  });

  assert.equal(result.errors.length, 4);
  assert.equal(JSON.stringify(result).includes(TYPED), false);
});

test('R-31 no order error contains the text the user typed', { skip: skipOrders }, () => {
  const result = saveOrder(orderInput({ date: TYPED, notes: typedLong(501) }));

  assert.equal(result.errors.length, 2);
  assert.equal(JSON.stringify(result).includes(TYPED), false);
});

test('R-31 no line error contains the text the user typed', { skip: skipLines }, () => {
  const result = saveLine(lineInput({ description: typedLong(201), quantity: TYPED, unitPrice: TYPED }));

  assert.equal(result.errors.length, 3);
  assert.equal(JSON.stringify(result).includes(TYPED), false);
});
