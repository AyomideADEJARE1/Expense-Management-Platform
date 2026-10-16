import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeCsvCell } from '../src/utils/csv.js';

test('CSV formula prefixes are neutralized in untrusted text', () => {
  for (const value of ['=1+1', '+SUM(A1:A2)', '-1+2', '@SUM(A1)', '  =1+1']) {
    assert.equal(escapeCsvCell(value), `"${"'" + value.replace(/"/g, '""')}"`);
  }
});

test('CSV cells preserve safe text and escape embedded quotes', () => {
  assert.equal(escapeCsvCell('Lunch "with team"'), '"Lunch ""with team"""');
  assert.equal(escapeCsvCell('2026-10-12'), '"2026-10-12"');
  assert.equal(escapeCsvCell(125.5), '"125.5"');
  assert.equal(escapeCsvCell(null), '""');
});
