const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_PHONE = 30;

function clean(input) {
  return {
    name: String(input.name ?? '').trim(),
    email: String(input.email ?? '').trim(),
    phone: String(input.phone ?? '').trim(),
  };
}

function isValidEmail(email) {
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  return local.length > 0 && domain.length > 0 && domain.includes('.')
    && !domain.startsWith('.') && !domain.endsWith('.');
}

export function validateCustomer(input) {
  const { name, email, phone } = clean(input);
  const errors = {};
  if (name === '') errors.name = 'Name is required';
  else if (name.length > MAX_NAME) errors.name = `Name must be at most ${MAX_NAME} characters`;
  if (email.length > MAX_EMAIL) errors.email = `Email must be at most ${MAX_EMAIL} characters`;
  else if (email !== '' && !isValidEmail(email)) errors.email = 'Enter an email like name@example.com';
  if (phone.length > MAX_PHONE) errors.phone = `Phone must be at most ${MAX_PHONE} characters`;
  return errors;
}

function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

export function addCustomer(state, input, newId) {
  const errors = validateCustomer(input);
  if (hasErrors(errors)) return { ok: false, errors };
  const customer = { id: newId, ...clean(input) };
  return { ok: true, state: { ...state, customers: [...state.customers, customer] } };
}

export function updateCustomer(state, id, input) {
  if (!state.customers.some((c) => c.id === id)) {
    return { ok: false, errors: { customer: 'Customer not found' } };
  }
  const errors = validateCustomer(input);
  if (hasErrors(errors)) return { ok: false, errors };
  const customers = state.customers.map((c) => (c.id === id ? { id, ...clean(input) } : c));
  return { ok: true, state: { ...state, customers } };
}

export function deleteCustomer(state, id) {
  const orderCount = state.orders.filter((o) => o.customerId === id).length;
  if (orderCount > 0) {
    const noun = orderCount === 1 ? 'order' : 'orders';
    const errors = { orders: `This customer has ${orderCount} ${noun}. They must be deleted first.` };
    return { ok: false, errors, orderCount };
  }
  return { ok: true, state: { ...state, customers: state.customers.filter((c) => c.id !== id) } };
}

export function searchCustomers(customers, text) {
  const needle = text.trim().toLowerCase();
  if (needle === '') return customers;
  return customers.filter((c) => c.name.toLowerCase().includes(needle)
    || c.email.toLowerCase().includes(needle));
}

export function sortCustomers(customers) {
  return [...customers].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
}
