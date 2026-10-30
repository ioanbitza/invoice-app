import { hasValidShape } from './shape.js';

const STORAGE_KEY = 'invoice-app';
const VERSION = 1;

const emptyData = () => ({ nextOrderNumber: 1, customers: [], orders: [] });
const unavailable = { ok: false, reason: 'unavailable' };

function parseDocument(text) {
  let document;
  try {
    document = JSON.parse(text);
  } catch (error) {
    if (error instanceof SyntaxError) return { ok: false, reason: 'corrupt', text };
    throw error;
  }
  if (typeof document !== 'object' || document === null || Array.isArray(document)) {
    return { ok: false, reason: 'corrupt', text };
  }
  if (Number.isInteger(document.version) && document.version > VERSION) return { ok: false, reason: 'newer', text };
  if (document.version !== VERSION) return { ok: false, reason: 'corrupt', text };
  const { version, ...data } = document;
  return hasValidShape(data) ? { ok: true, data } : { ok: false, reason: 'corrupt', text };
}

/** Wraps a `Storage`-shaped object: safe load, whole-document save, erase (ADR-004). */
export function createStorage(backing) {
  let canWrite = false;

  function load() {
    canWrite = false;
    let text;
    try {
      text = backing.getItem(STORAGE_KEY);
    } catch {
      return unavailable;
    }
    if (text === null) {
      canWrite = true;
      return { ok: true, data: emptyData() };
    }
    const result = parseDocument(text);
    canWrite = result.ok;
    return result;
  }

  function save(data) {
    if (!canWrite) return { ok: false, reason: 'blocked' };
    try {
      backing.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, ...data }));
    } catch (error) {
      const full = error instanceof DOMException && error.name === 'QuotaExceededError';
      return { ok: false, reason: full ? 'quota' : 'unavailable' };
    }
    return { ok: true };
  }

  function erase() {
    try {
      backing.removeItem(STORAGE_KEY);
    } catch {
      return unavailable;
    }
    canWrite = true;
    return { ok: true, data: emptyData() };
  }

  return { load, save, erase };
}

const unavailableStorage = {
  load: () => unavailable,
  save: () => unavailable,
  erase: () => unavailable,
};

/** The one place that touches `window.localStorage`; if the access throws, every call answers unavailable. */
export function openBrowserStorage() {
  let backing;
  try {
    backing = window.localStorage;
  } catch {
    return unavailableStorage;
  }
  return createStorage(backing);
}
