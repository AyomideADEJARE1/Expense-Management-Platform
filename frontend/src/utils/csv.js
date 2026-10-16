export function escapeCsvCell(value) {
  const raw = String(value ?? '');
  // Prefix spreadsheet formulas with an apostrophe before CSV quoting.
  const safe = /^\s*[=+@-]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}
