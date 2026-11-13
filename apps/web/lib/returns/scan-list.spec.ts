import { describe, expect, it } from 'vitest';
import { addScan, parseDeclared } from './scan-list';

describe('addScan', () => {
  it('puts the newest scan on top as intact', () => {
    const rows = addScan(addScan([], 'TRK-1'), ' TRK-2 ');
    expect(rows).toEqual([
      { trackingNumber: 'TRK-2', condition: 'intact' },
      { trackingNumber: 'TRK-1', condition: 'intact' },
    ]);
  });

  it('moves a repeated scan to the top and keeps its condition', () => {
    const rows = addScan(
      [
        { trackingNumber: 'A-1', condition: 'damaged' },
        { trackingNumber: 'B-2', condition: 'intact' },
      ],
      'B-2',
    );
    expect(rows.map((row) => row.trackingNumber)).toEqual(['B-2', 'A-1']);
    expect(addScan(rows, 'A-1')[0]).toEqual({ trackingNumber: 'A-1', condition: 'damaged' });
  });

  it('ignores blanks and fragments', () => {
    expect(addScan([], '  ')).toEqual([]);
    expect(addScan([], 'ab')).toEqual([]);
  });
});

describe('parseDeclared', () => {
  it('splits lines, commas and spaces and drops duplicates', () => {
    expect(parseDeclared('TRK-1\nTRK-2, TRK-3\n\nTRK-1')).toEqual(['TRK-1', 'TRK-2', 'TRK-3']);
  });
});
