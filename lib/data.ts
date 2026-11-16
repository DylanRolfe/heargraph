/**
 * CSV parsing, worksheet validation and CSV export.
 * Pure functions: no DOM, no Node APIs.
 */
import {
  MAX_ANSWER_LENGTH,
  MAX_EXPLANATION_LENGTH,
  MAX_LABEL_LENGTH,
  MAX_POINTS,
  MAX_PROMPT_LENGTH,
  MAX_QUESTIONS,
  MAX_SERIES,
  MAX_TITLE_LENGTH,
  MAX_UNIT_LENGTH,
  MIN_POINTS,
} from './types';
import type { ParseResult, Series, Worksheet, XAxis } from './types';

const MAX_ERRORS = 10;
const NUMBER_RE = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
const DECIMAL_COMMA_RE = /^[+-]?\d+,\d+$/;
const DEFAULT_LABELS = ['x', 'y', 'y2'];

type Delimiter = ',' | '\t' | ';';

/** Splits one line into trimmed cells, honouring double-quoted cells ("" is a literal quote). */
function splitLine(line: string, delimiter: Delimiter): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"' && current.trim() === '') {
      inQuotes = true;
      current = '';
    } else if (ch === delimiter) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function countOutsideQuotes(line: string, ch: string): number {
  let count = 0;
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') inQuotes = !inQuotes;
    else if (!inQuotes && line[i] === ch) count++;
  }
  return count;
}

function detectDelimiter(line: string): Delimiter {
  if (countOutsideQuotes(line, '\t') > 0) return '\t';
  if (countOutsideQuotes(line, ';') > 0) return ';';
  return ',';
}

type CellValue = { kind: 'number'; value: number } | { kind: 'empty' } | { kind: 'bad' } | { kind: 'huge' } | { kind: 'unclear' };

function parseCell(raw: string, allowDecimalComma: boolean): CellValue {
  let text = raw.trim().replace(/−/g, '-');
  if (text === '') return { kind: 'empty' };
  if (/^[+-]?[0-9]{1,3},[0-9]{3}$/.test(text)) {
    // "1,200" could mean 1200 or 1.2. Ask rather than guess.
    return { kind: 'unclear' };
  }
  if (allowDecimalComma && DECIMAL_COMMA_RE.test(text)) text = text.replace(',', '.');
  if (!NUMBER_RE.test(text)) return { kind: 'bad' };
  const value = Number(text);
  if (Number.isNaN(value)) return { kind: 'bad' };
  if (!Number.isFinite(value)) return { kind: 'huge' };
  return { kind: 'number', value: value === 0 ? 0 : value };
}

function capErrors(errors: string[]): string[] {
  if (errors.length <= MAX_ERRORS) return errors;
  const extra = errors.length - MAX_ERRORS;
  return [...errors.slice(0, MAX_ERRORS), `…and ${extra} more.`];
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

/** "Time (s)" -> { label: "Time", unit: "s" }. Also accepts "Time [s]". */
export function parseHeaderCell(cell: string): { label: string; unit: string } {
  const text = String(cell ?? '').trim();
  const match = /^(.*?)\s*(?:\(([^()]*)\)|\[([^[\]]*)\])$/.exec(text);
  if (match) {
    const label = match[1].trim();
    const unit = (match[2] ?? match[3] ?? '').trim();
    if (label !== '') return { label, unit };
  }
  return { label: text, unit: '' };
}

export function parseCsv(text: string): ParseResult {
  const source = String(text ?? '').replace(/^﻿/, '');
  const lines = source.split(/\r\n|\n|\r/);
  const rows: { rowNumber: number; line: string }[] = [];
  lines.forEach((line, i) => {
    if (line.trim() !== '') rows.push({ rowNumber: i + 1, line });
  });

  if (rows.length === 0) {
    return {
      ok: false,
      errors: ['Nothing was pasted. Paste at least 2 rows of numbers, with x first and then y, for example: 0, 6'],
    };
  }

  const delimiter = detectDelimiter(rows[0].line);
  const allowDecimalComma = delimiter !== ',';
  const split = rows.map((r) => ({ rowNumber: r.rowNumber, cells: splitLine(r.line, delimiter) }));

  const first = split[0];
  const columnCount = first.cells.length;
  if (columnCount < 2) {
    return {
      ok: false,
      errors: [
        `Row ${first.rowNumber} has only 1 column. Each row needs 2 or 3 columns (x, y, and an optional second y), separated by commas, tabs or semicolons.`,
      ],
    };
  }
  if (columnCount > 1 + MAX_SERIES) {
    return {
      ok: false,
      errors: [
        `Row ${first.rowNumber} has ${columnCount} columns. Use 2 or 3 columns: x, y, and an optional second y.`,
      ],
    };
  }

  const hasHeader = first.cells.some((c) => {
    const kind = parseCell(c, allowDecimalComma).kind;
    return kind === 'bad' || kind === 'unclear';
  });

  const notices: string[] = [];
  const heads: { label: string; unit: string }[] = [];
  for (let c = 0; c < columnCount; c++) {
    let head = { label: DEFAULT_LABELS[c], unit: '' };
    if (hasHeader) {
      const parsed = parseHeaderCell(first.cells[c]);
      if (parsed.label === '') {
        notices.push(`Column ${c + 1} had no heading, so it is called "${DEFAULT_LABELS[c]}".`);
      } else {
        head = parsed;
      }
    }
    if (head.label.length > MAX_LABEL_LENGTH) {
      head.label = head.label.slice(0, MAX_LABEL_LENGTH).trim();
      notices.push(`The heading "${head.label}" was shortened to ${MAX_LABEL_LENGTH} characters.`);
    }
    if (head.unit.length > MAX_UNIT_LENGTH) {
      head.unit = head.unit.slice(0, MAX_UNIT_LENGTH).trim();
      notices.push(`The unit "${head.unit}" was shortened to ${MAX_UNIT_LENGTH} characters.`);
    }
    heads.push(head);
  }

  const dataRows = hasHeader ? split.slice(1) : split;
  const errors: string[] = [];

  if (dataRows.length === 0) {
    errors.push(`Only a heading row was found. Add at least ${MIN_POINTS} rows of numbers below it.`);
  } else if (dataRows.length < MIN_POINTS) {
    errors.push(
      `Only ${plural(dataRows.length, 'row')} of numbers was found. A graph needs at least ${MIN_POINTS}.`,
    );
  } else if (dataRows.length > MAX_POINTS) {
    errors.push(
      `There are ${dataRows.length} rows of numbers. HearGraph can use at most ${MAX_POINTS}. Remove some rows.`,
    );
  }

  const columnName = (c: number) => (hasHeader ? `the "${heads[c].label}" column` : `column ${c + 1}`);
  const good: number[][] = [];
  const seenX = new Map<number, number>();

  for (const row of dataRows) {
    if (row.cells.length !== columnCount) {
      errors.push(
        `Row ${row.rowNumber} has ${plural(row.cells.length, 'column')}, but row ${first.rowNumber} has ${columnCount}. Every row needs the same number of columns.`,
      );
      continue;
    }
    const values: number[] = [];
    let rowOk = true;
    for (let c = 0; c < columnCount; c++) {
      const cell = parseCell(row.cells[c], allowDecimalComma);
      if (cell.kind === 'number') {
        values.push(cell.value);
        continue;
      }
      rowOk = false;
      if (cell.kind === 'empty') {
        errors.push(`Row ${row.rowNumber}: ${columnName(c)} is empty. Type a number there.`);
      } else if (cell.kind === 'unclear') {
        const digits = row.cells[c].replace(/−/g, '-');
        errors.push(
          `Row ${row.rowNumber}: "${row.cells[c]}" is unclear. Type ${digits.replace(',', '')} or ${Number(digits.replace(',', '.'))}, without a comma.`,
        );
      } else if (cell.kind === 'huge') {
        errors.push(`Row ${row.rowNumber}: "${row.cells[c]}" is too large to use.`);
      } else {
        errors.push(`Row ${row.rowNumber}: "${row.cells[c]}" is not a number.`);
      }
    }
    const xCell = parseCell(row.cells[0], allowDecimalComma);
    if (xCell.kind === 'number') {
      const earlier = seenX.get(xCell.value);
      if (earlier !== undefined) {
        rowOk = false;
        errors.push(
          `Row ${row.rowNumber}: the ${heads[0].label} value ${row.cells[0]} is already used in row ${earlier}. Each ${heads[0].label} value can appear only once.`,
        );
      } else {
        seenX.set(xCell.value, row.rowNumber);
      }
    }
    if (rowOk) good.push(values);
  }

  if (errors.length > 0) return { ok: false, errors: capErrors(errors) };

  let sorted = true;
  for (let i = 1; i < good.length; i++) {
    if (good[i][0] < good[i - 1][0]) {
      sorted = false;
      break;
    }
  }
  if (!sorted) {
    good.sort((a, b) => a[0] - b[0]);
    notices.push(`Rows were sorted by ${heads[0].label} from smallest to largest.`);
  }

  const x: XAxis = { label: heads[0].label, unit: heads[0].unit, values: good.map((r) => r[0]) };
  const series: Series[] = [];
  for (let c = 1; c < columnCount; c++) {
    series.push({ label: heads[c].label, unit: heads[c].unit, values: good.map((r) => r[c]) });
  }
  return { ok: true, table: { x, series }, notices };
}

// ---------- validation ----------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function checkText(
  errors: string[],
  value: unknown,
  name: string,
  max: number,
  required: boolean,
): value is string {
  if (typeof value !== 'string') {
    errors.push(`${name} must be text.`);
    return false;
  }
  if (required && value.trim() === '') errors.push(`${name} is empty.`);
  if (value.length > max) errors.push(`${name} is longer than ${max} characters.`);
  return true;
}

function validateQuestion(errors: string[], q: unknown, n: number): void {
  const name = `Question ${n}`;
  if (!isRecord(q)) {
    errors.push(`${name} is not a valid question.`);
    return;
  }
  checkText(errors, q.prompt, `${name}: the question text`, MAX_PROMPT_LENGTH, true);
  checkText(errors, q.explanation, `${name}: the explanation`, MAX_EXPLANATION_LENGTH, false);
  if (q.kind === 'number') {
    if (!isFiniteNumber(q.answer)) errors.push(`${name}: the answer must be a number.`);
    if (!isFiniteNumber(q.tolerance) || q.tolerance < 0) {
      errors.push(`${name}: the allowed difference must be a number that is 0 or more.`);
    }
    checkText(errors, q.unit, `${name}: the unit`, MAX_UNIT_LENGTH, false);
  } else if (q.kind === 'choice') {
    const answerOk = checkText(errors, q.answer, `${name}: the answer`, MAX_ANSWER_LENGTH, true);
    if (!Array.isArray(q.choices)) {
      errors.push(`${name}: the choices are missing.`);
      return;
    }
    if (q.choices.length < 2 || q.choices.length > 4) {
      errors.push(`${name}: give 2 to 4 choices.`);
    }
    let allText = true;
    q.choices.forEach((choice, i) => {
      if (!checkText(errors, choice, `${name}: choice ${i + 1}`, MAX_ANSWER_LENGTH, true)) allText = false;
    });
    if (allText) {
      const seen = new Set<string>();
      let duplicate = false;
      for (const choice of q.choices as string[]) {
        const key = choice.trim().toLowerCase();
        if (seen.has(key)) duplicate = true;
        seen.add(key);
      }
      if (duplicate) errors.push(`${name}: two choices are the same. Each choice must be different.`);
      if (answerOk && !(q.choices as string[]).includes(q.answer as string)) {
        errors.push(`${name}: the answer must be one of the choices.`);
      }
    }
  } else if (q.kind === 'text') {
    checkText(errors, q.answer, `${name}: the answer`, MAX_ANSWER_LENGTH, true);
  } else {
    errors.push(`${name} has an unknown type.`);
  }
}

/** Returns [] when the worksheet is valid, otherwise plain-language problems. */
export function validateWorksheet(w: Worksheet): string[] {
  const errors: string[] = [];
  const ws: unknown = w;
  if (!isRecord(ws)) return ['The worksheet is missing.'];

  checkText(errors, ws.title, 'The title', MAX_TITLE_LENGTH, true);

  let pointCount = -1;
  const x = ws.x;
  if (!isRecord(x)) {
    errors.push('The x column is missing.');
  } else {
    checkText(errors, x.label, 'The x label', MAX_LABEL_LENGTH, true);
    checkText(errors, x.unit, 'The x unit', MAX_UNIT_LENGTH, false);
    if (!Array.isArray(x.values)) {
      errors.push('The x values are missing.');
    } else {
      pointCount = x.values.length;
      if (pointCount < MIN_POINTS) {
        errors.push(`The graph needs at least ${MIN_POINTS} points.`);
      } else if (pointCount > MAX_POINTS) {
        errors.push(`The graph can have at most ${MAX_POINTS} points.`);
      }
      if (!x.values.every(isFiniteNumber)) {
        errors.push('Every x value must be a number.');
      } else {
        for (let i = 1; i < x.values.length; i++) {
          if (!(x.values[i] > x.values[i - 1])) {
            errors.push('The x values must go from smallest to largest, with no repeats.');
            break;
          }
        }
      }
    }
  }

  const series = ws.series;
  if (!Array.isArray(series)) {
    errors.push('The y values are missing.');
  } else {
    if (series.length < 1 || series.length > MAX_SERIES) {
      errors.push(`The graph needs 1 or ${MAX_SERIES} sets of y values.`);
    }
    series.forEach((s: unknown, i: number) => {
      const name = `Series ${i + 1}`;
      if (!isRecord(s)) {
        errors.push(`${name} is not valid.`);
        return;
      }
      checkText(errors, s.label, `${name}: the label`, MAX_LABEL_LENGTH, true);
      checkText(errors, s.unit, `${name}: the unit`, MAX_UNIT_LENGTH, false);
      if (!Array.isArray(s.values)) {
        errors.push(`${name}: the values are missing.`);
        return;
      }
      if (pointCount >= 0 && s.values.length !== pointCount) {
        errors.push(`${name} has ${s.values.length} values, but there are ${pointCount} x values.`);
      }
      if (!s.values.every(isFiniteNumber)) errors.push(`${name}: every value must be a number.`);
    });
  }

  const questions = ws.questions;
  if (!Array.isArray(questions)) {
    errors.push('The questions are missing.');
  } else {
    if (questions.length > MAX_QUESTIONS) {
      errors.push(`There can be at most ${MAX_QUESTIONS} questions.`);
    }
    questions.slice(0, MAX_QUESTIONS + 1).forEach((q: unknown, i: number) => validateQuestion(errors, q, i + 1));
  }

  return errors;
}

// ---------- export ----------

function csvCell(text: string): string {
  if (/[",\n\r\t;]/.test(text) || text !== text.trim()) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function headerCell(label: string, unit: string): string {
  return csvCell(unit === '' ? label : `${label} (${unit})`);
}

/** Comma-separated text with a header row and LF line endings. Round-trips through parseCsv. */
export function tableToCsv(x: XAxis, series: Series[]): string {
  const lines: string[] = [];
  lines.push([headerCell(x.label, x.unit), ...series.map((s) => headerCell(s.label, s.unit))].join(','));
  for (let i = 0; i < x.values.length; i++) {
    lines.push([x.values[i], ...series.map((s) => s.values[i])].map((v) => String(v)).join(','));
  }
  return lines.join('\n');
}
