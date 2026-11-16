import { describe, it, expect } from 'vitest';
import { parseCsv, parseHeaderCell, tableToCsv, validateWorksheet } from '@/lib/data';
import { MAX_POINTS } from '@/lib/types';
import type { ParseResult, Question, Worksheet } from '@/lib/types';

function okTable(r: ParseResult) {
  if (!r.ok) throw new Error(`expected ok, got: ${r.errors.join(' | ')}`);
  return r;
}
function errorsOf(r: ParseResult): string[] {
  if (r.ok) throw new Error('expected errors');
  return r.errors;
}

const base: Worksheet = {
  title: 'Test',
  x: { label: 'Time', unit: 's', values: [0, 1, 2] },
  series: [{ label: 'Speed', unit: 'm/s', values: [1, 2, 3] }],
  questions: [],
};
function ws(patch: Partial<Worksheet>): Worksheet {
  return { ...base, ...patch };
}

describe('parseHeaderCell', () => {
  it('splits label and unit', () => {
    expect(parseHeaderCell('Time (s)')).toEqual({ label: 'Time', unit: 's' });
    expect(parseHeaderCell('Time [s]')).toEqual({ label: 'Time', unit: 's' });
    expect(parseHeaderCell('  Velocity (m/s)  ')).toEqual({ label: 'Velocity', unit: 'm/s' });
    expect(parseHeaderCell('Temperature (°C)')).toEqual({ label: 'Temperature', unit: '°C' });
    expect(parseHeaderCell('Dish A (thousand cells)')).toEqual({ label: 'Dish A', unit: 'thousand cells' });
  });
  it('leaves cells without a unit alone', () => {
    expect(parseHeaderCell('Time')).toEqual({ label: 'Time', unit: '' });
    expect(parseHeaderCell('Time, s')).toEqual({ label: 'Time, s', unit: '' });
    expect(parseHeaderCell('(s)')).toEqual({ label: '(s)', unit: '' });
    expect(parseHeaderCell('')).toEqual({ label: '', unit: '' });
  });
});

describe('parseCsv: valid input', () => {
  it('parses commas with a header and units', () => {
    const r = okTable(parseCsv('Time (s),Velocity (m/s)\n0,6\n1,4.5\n2,3\n'));
    expect(r.table.x).toEqual({ label: 'Time', unit: 's', values: [0, 1, 2] });
    expect(r.table.series).toEqual([{ label: 'Velocity', unit: 'm/s', values: [6, 4.5, 3] }]);
    expect(r.notices).toEqual([]);
  });
  it('uses default labels when there is no header', () => {
    const r = okTable(parseCsv('0,1,10\n1,2,20'));
    expect(r.table.x.label).toBe('x');
    expect(r.table.x.unit).toBe('');
    expect(r.table.series.map((s) => s.label)).toEqual(['y', 'y2']);
    expect(r.table.series[1].values).toEqual([10, 20]);
  });
  it('accepts tabs, CRLF, blank lines and surrounding spaces', () => {
    const r = okTable(parseCsv('Time (s)\tSpeed (m/s)\r\n\r\n 0 \t 1 \r\n1\t2\r\n\r\n'));
    expect(r.table.x.values).toEqual([0, 1]);
    expect(r.table.series[0]).toEqual({ label: 'Speed', unit: 'm/s', values: [1, 2] });
  });
  it('accepts semicolons, including decimal commas', () => {
    const r = okTable(parseCsv('t;v\n0;1,5\n1;2,5'));
    expect(r.table.series[0].values).toEqual([1.5, 2.5]);
    expect(okTable(parseCsv('0;1\n1;2')).table.x.values).toEqual([0, 1]);
  });
  it('accepts quoted cells', () => {
    const r = okTable(parseCsv('"Time, total (s)","Speed ""fast"" (m/s)"\n"0","1"\n1,2'));
    expect(r.table.x).toEqual({ label: 'Time, total', unit: 's', values: [0, 1] });
    expect(r.table.series[0].label).toBe('Speed "fast"');
  });
  it('accepts Unicode minus, a leading plus and exponents', () => {
    const r = okTable(parseCsv('0,−3\n+1,+2.5\n2,1e2\n3,.5'));
    expect(r.table.x.values).toEqual([0, 1, 2, 3]);
    expect(r.table.series[0].values).toEqual([-3, 2.5, 100, 0.5]);
  });
  it('sorts unsorted x and adds a notice', () => {
    const r = okTable(parseCsv('Time (s),v\n2,30\n0,10\n1,20'));
    expect(r.table.x.values).toEqual([0, 1, 2]);
    expect(r.table.series[0].values).toEqual([10, 20, 30]);
    expect(r.notices).toEqual(['Rows were sorted by Time from smallest to largest.']);
  });
  it('truncates long labels and units with a notice', () => {
    const r = okTable(parseCsv(`${'L'.repeat(50)} (${'u'.repeat(30)}),y\n0,1\n1,2`));
    expect(r.table.x.label).toHaveLength(40);
    expect(r.table.x.unit).toHaveLength(20);
    expect(r.notices).toHaveLength(2);
    expect(r.notices[0]).toContain('shortened to 40 characters');
    expect(r.notices[1]).toContain('shortened to 20 characters');
  });
  it('accepts exactly MAX_POINTS rows', () => {
    const text = Array.from({ length: MAX_POINTS }, (_, i) => `${i},${i * 2}`).join('\n');
    expect(okTable(parseCsv(text)).table.x.values).toHaveLength(MAX_POINTS);
  });
  it('strips a byte-order mark', () => {
    expect(okTable(parseCsv('﻿0,1\n1,2')).table.x.values).toEqual([0, 1]);
  });
});

describe('parseCsv: errors', () => {
  it('rejects empty input', () => {
    for (const text of ['', '   ', '\n\r\n  \n']) {
      const e = errorsOf(parseCsv(text));
      expect(e).toHaveLength(1);
      expect(e[0]).toMatch(/^Nothing was pasted/);
    }
  });
  it('rejects a header with no rows', () => {
    expect(errorsOf(parseCsv('Time (s),Velocity (m/s)'))[0]).toMatch(/Only a heading row/);
  });
  it('rejects fewer than MIN_POINTS rows', () => {
    expect(errorsOf(parseCsv('Time,Speed\n0,1'))[0]).toBe(
      'Only 1 row of numbers was found. A graph needs at least 2.',
    );
    expect(errorsOf(parseCsv('0,1'))[0]).toMatch(/Only 1 row/);
  });
  it('rejects more than MAX_POINTS rows', () => {
    const text = Array.from({ length: MAX_POINTS + 1 }, (_, i) => `${i},${i}`).join('\n');
    expect(errorsOf(parseCsv(text))[0]).toMatch(/There are 51 rows of numbers.*at most 50/);
  });
  it('rejects one column', () => {
    expect(errorsOf(parseCsv('1\n2\n3'))[0]).toMatch(/Row 1 has only 1 column/);
  });
  it('rejects more than three columns', () => {
    expect(errorsOf(parseCsv('0,1,2,3\n1,2,3,4'))[0]).toMatch(/Row 1 has 4 columns/);
  });
  it('rejects ragged rows and names the row', () => {
    const e = errorsOf(parseCsv('x,y\n0,1\n1\n2,3,4'));
    expect(e).toHaveLength(2);
    expect(e[0]).toMatch(/^Row 3 has 1 column, but row 1 has 2/);
    expect(e[1]).toMatch(/^Row 4 has 3 columns, but row 1 has 2/);
  });
  it('rejects non-numeric cells with the row number as pasted', () => {
    const e = errorsOf(parseCsv('Time (s),Speed\n0,1\n\n1,abc\n2,3'));
    expect(e).toEqual(['Row 4: "abc" is not a number.']);
  });
  it('rejects empty, NaN and Infinity cells', () => {
    const e = errorsOf(parseCsv('t,v\n0,\n1,NaN\n2,Infinity\n3,-Infinity\n4,1e999'));
    expect(e).toEqual([
      'Row 2: the "v" column is empty. Type a number there.',
      'Row 3: "NaN" is not a number.',
      'Row 4: "Infinity" is not a number.',
      'Row 5: "-Infinity" is not a number.',
      'Row 6: "1e999" is too large to use.',
    ]);
  });
  it('names the column by number when there is no header', () => {
    expect(errorsOf(parseCsv('0,1\n1,\n2,3'))).toEqual(['Row 2: column 2 is empty. Type a number there.']);
  });
  it('rejects duplicate x values', () => {
    const e = errorsOf(parseCsv('Time (s),v\n0,1\n1,2\n1.0,3'));
    expect(e).toHaveLength(1);
    expect(e[0]).toMatch(/^Row 4: the Time value 1\.0 is already used in row 3/);
  });
  it('collects all errors and caps the list at 10', () => {
    const rows = Array.from({ length: 14 }, (_, i) => `${i},bad${i}`).join('\n');
    const e = errorsOf(parseCsv(rows));
    // The first row is read as a header, leaving 13 bad rows.
    expect(e).toHaveLength(11);
    expect(e[0]).toBe('Row 2: "bad1" is not a number.');
    expect(e[10]).toBe('…and 3 more.');
  });
  it('reports several kinds of error together', () => {
    const e = errorsOf(parseCsv('x,y\n0,1\n0,2\n1,zz\n3'));
    expect(e).toHaveLength(3);
  });
  it('does not guess at thousands separators or read other text as numbers', () => {
    expect(errorsOf(parseCsv('x\ty\n0\t1,200\n1\t0x10'))).toEqual([
      'Row 2: "1,200" is unclear. Type 1200 or 1.2, without a comma.',
      'Row 3: "0x10" is not a number.',
    ]);
  });
});

describe('tableToCsv', () => {
  it('writes a header with units and LF line endings', () => {
    const csv = tableToCsv(base.x, base.series);
    expect(csv).toBe('Time (s),Speed (m/s)\n0,1\n1,2\n2,3');
  });
  it('omits parentheses when the unit is empty', () => {
    const csv = tableToCsv({ label: 'n', unit: '', values: [1, 2] }, [{ label: 'Count', unit: '', values: [3, 4] }]);
    expect(csv.split('\n')[0]).toBe('n,Count');
  });
  it('round-trips through parseCsv', () => {
    const x = { label: 'Time, total', unit: 's', values: [-1.5, 0, 1e-7, 2.25] };
    const series = [
      { label: 'Temperature', unit: '°C', values: [-3, 0, 0.1 + 0.2, 1234567] },
      { label: 'Dish "B"', unit: 'thousand cells', values: [1, 2, 3, 4] },
    ];
    const r = okTable(parseCsv(tableToCsv(x, series)));
    expect(r.table).toEqual({ x, series });
    expect(r.notices).toEqual([]);
  });
});

describe('validateWorksheet', () => {
  const numberQ: Question = { kind: 'number', prompt: 'p', answer: 1, tolerance: 0, unit: '', explanation: 'e' };
  const choiceQ: Question = { kind: 'choice', prompt: 'p', choices: ['a', 'b'], answer: 'a', explanation: '' };
  const textQ: Question = { kind: 'text', prompt: 'p', answer: 'a', explanation: 'e' };
  const withQ = (q: unknown) => ws({ questions: [q as Question] });

  it('accepts a valid worksheet', () => {
    expect(validateWorksheet(base)).toEqual([]);
    expect(validateWorksheet(ws({ questions: [numberQ, choiceQ, textQ] }))).toEqual([]);
    expect(
      validateWorksheet(ws({ series: [base.series[0], { label: 'B', unit: '', values: [0, 0, 0] }] })),
    ).toEqual([]);
  });
  it('checks the title', () => {
    expect(validateWorksheet(ws({ title: '  ' }))).toEqual(['The title is empty.']);
    expect(validateWorksheet(ws({ title: 'a'.repeat(121) }))).toEqual(['The title is longer than 120 characters.']);
  });
  it('checks the number of series', () => {
    expect(validateWorksheet(ws({ series: [] }))).toHaveLength(1);
    const s = base.series[0];
    expect(validateWorksheet(ws({ series: [s, s, s] }))).toHaveLength(1);
  });
  it('checks lengths and point counts', () => {
    expect(validateWorksheet(ws({ series: [{ label: 'S', unit: '', values: [1, 2] }] }))).toEqual([
      'Series 1 has 2 values, but there are 3 x values.',
    ]);
    expect(
      validateWorksheet(ws({ x: { label: 'x', unit: '', values: [0] }, series: [{ label: 'S', unit: '', values: [1] }] })),
    ).toEqual(['The graph needs at least 2 points.']);
    const many = Array.from({ length: 51 }, (_, i) => i);
    expect(
      validateWorksheet(ws({ x: { label: 'x', unit: '', values: many }, series: [{ label: 'S', unit: '', values: many }] })),
    ).toEqual(['The graph can have at most 50 points.']);
  });
  it('checks numbers are finite and x is strictly increasing', () => {
    expect(validateWorksheet(ws({ x: { ...base.x, values: [0, NaN, 2] } }))).toHaveLength(1);
    expect(validateWorksheet(ws({ x: { ...base.x, values: [0, 2, 1] } }))).toHaveLength(1);
    expect(validateWorksheet(ws({ x: { ...base.x, values: [0, 1, 1] } }))).toHaveLength(1);
    expect(validateWorksheet(ws({ series: [{ label: 'S', unit: '', values: [1, Infinity, 3] }] }))).toHaveLength(1);
    expect(
      validateWorksheet(ws({ series: [{ label: 'S', unit: '', values: [1, '2', 3] as unknown as number[] }] })),
    ).toHaveLength(1);
  });
  it('checks labels and units', () => {
    expect(validateWorksheet(ws({ x: { ...base.x, label: '' } }))).toHaveLength(1);
    expect(validateWorksheet(ws({ x: { ...base.x, label: 'a'.repeat(41) } }))).toHaveLength(1);
    expect(validateWorksheet(ws({ x: { ...base.x, unit: 'a'.repeat(21) } }))).toHaveLength(1);
    expect(validateWorksheet(ws({ series: [{ label: ' ', unit: '', values: [1, 2, 3] }] }))).toHaveLength(1);
    expect(validateWorksheet(ws({ series: [{ label: 'S', unit: 'u'.repeat(21), values: [1, 2, 3] }] }))).toHaveLength(1);
  });
  it('checks the number of questions', () => {
    expect(validateWorksheet(ws({ questions: [textQ, textQ, textQ, textQ] }))).toEqual([
      'There can be at most 3 questions.',
    ]);
  });
  it('checks number questions', () => {
    expect(validateWorksheet(withQ({ ...numberQ, prompt: '' }))).toHaveLength(1);
    expect(validateWorksheet(withQ({ ...numberQ, prompt: 'p'.repeat(201) }))).toHaveLength(1);
    expect(validateWorksheet(withQ({ ...numberQ, answer: NaN }))).toHaveLength(1);
    expect(validateWorksheet(withQ({ ...numberQ, answer: '4' }))).toHaveLength(1);
    expect(validateWorksheet(withQ({ ...numberQ, tolerance: -1 }))).toHaveLength(1);
    expect(validateWorksheet(withQ({ ...numberQ, tolerance: Infinity }))).toHaveLength(1);
    expect(validateWorksheet(withQ({ ...numberQ, unit: 'u'.repeat(21) }))).toHaveLength(1);
    expect(validateWorksheet(withQ({ ...numberQ, explanation: 'e'.repeat(301) }))).toHaveLength(1);
  });
  it('checks choice questions', () => {
    expect(validateWorksheet(withQ({ ...choiceQ, choices: ['a'] }))).toHaveLength(1);
    expect(validateWorksheet(withQ({ ...choiceQ, choices: ['a', 'b', 'c', 'd', 'e'] }))).toHaveLength(1);
    expect(validateWorksheet(withQ({ ...choiceQ, choices: ['a', 'A '] }))).toHaveLength(1);
    expect(validateWorksheet(withQ({ ...choiceQ, choices: ['a', ''] }))).toHaveLength(1);
    expect(validateWorksheet(withQ({ ...choiceQ, answer: 'z' }))).toEqual([
      'Question 1: the answer must be one of the choices.',
    ]);
    expect(validateWorksheet(withQ({ ...choiceQ, choices: ['a', 'c'.repeat(81)] }))).toHaveLength(1);
    expect(validateWorksheet(withQ({ ...choiceQ, choices: 'ab' }))).toHaveLength(1);
  });
  it('checks text questions', () => {
    expect(validateWorksheet(withQ({ ...textQ, answer: ' ' }))).toHaveLength(1);
    expect(validateWorksheet(withQ({ ...textQ, answer: 'a'.repeat(81) }))).toHaveLength(1);
  });
  it('rejects malformed shapes without throwing', () => {
    expect(validateWorksheet(withQ({ kind: 'essay', prompt: 'p', explanation: '' }))).toHaveLength(1);
    expect(validateWorksheet(withQ(null))).toHaveLength(1);
    expect(validateWorksheet(null as unknown as Worksheet).length).toBeGreaterThan(0);
    expect(validateWorksheet({} as Worksheet).length).toBeGreaterThan(0);
    expect(validateWorksheet({ title: 1, x: [], series: {}, questions: 'q' } as unknown as Worksheet).length).toBeGreaterThan(0);
  });
});
