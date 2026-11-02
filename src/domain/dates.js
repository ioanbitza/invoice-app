const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True when the text is YYYY-MM-DD and names a day that exists (R-06, A-07). */
export function isRealDate(text) {
  const match = DATE_PATTERN.exec(text);
  if (match === null) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCFullYear(year);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** The local calendar date of the clock, as YYYY-MM-DD; never from toISOString, which is UTC. */
export function todayIso(now = () => Date.now()) {
  const date = new Date(now());
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
