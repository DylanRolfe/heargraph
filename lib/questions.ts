/**
 * Practice-question templates and answer checking.
 * Pure functions: no DOM, no Node APIs.
 */
import { MAX_EXPLANATION_LENGTH, MAX_PROMPT_LENGTH } from './types';
import type { CheckResult, ChoiceQuestion, NumberQuestion, Question, Worksheet } from './types';
import { analyzeSeries, formatNumber, lowerLabel, valueWithUnit } from './describe';

const TREND_CHOICES = ['Increasing', 'Decreasing', 'Staying the same'];

function clamp(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/** Removes floating-point noise such as 1.1400000000000001. */
function tidy(n: number): number {
  return Number(n.toPrecision(12));
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** A point near the middle that is not the zero crossing, the highest or the lowest point, when possible. */
function pickReadIndex(n: number, avoid: Set<number>): number {
  const mid = Math.floor(n / 2);
  for (let d = 0; d < n; d++) {
    for (const i of [mid + d, mid - d]) {
      if (i >= 1 && i <= n - 2 && !avoid.has(i)) return i;
    }
  }
  return Math.min(mid, n - 1);
}

export function generateQuestions(w: Worksheet): Question[] {
  const series = w?.series?.[0];
  const x = w?.x?.values;
  if (!series || !Array.isArray(x) || !Array.isArray(series.values)) return [];
  const y = series.values;
  const n = Math.min(x.length, y.length);
  if (n < 2) return [];

  const a = analyzeSeries(x, y);
  const xLabel = lowerLabel(w.x.label);
  const yLabel = lowerLabel(series.label);
  const xUnit = w.x.unit.trim();
  const yUnit = series.unit.trim();
  const xText = (v: number) => valueWithUnit(v, xUnit);
  const yText = (v: number) => valueWithUnit(v, yUnit);
  const xRange = x[n - 1] - x[0];
  const yRange = a.max.y - a.min.y;
  const questions: Question[] = [];

  // 1. Read a value at a middle point.
  {
    const avoid = new Set<number>([a.max.index, a.min.index]);
    for (const z of a.zeroCrossings) if (z.exact) avoid.add(z.index);
    const i = pickReadIndex(n, avoid);
    const q: NumberQuestion = {
      kind: 'number',
      prompt: clamp(`What is the ${yLabel} when the ${xLabel} is ${xText(x[i])}?`, MAX_PROMPT_LENGTH),
      answer: y[i],
      tolerance: tidy(Math.max(0.02 * yRange, 1e-9)),
      unit: yUnit,
      explanation: clamp(
        `Move to the point where ${xLabel} is ${xText(x[i])} with the arrow keys, or find the row for ${xText(x[i])} in the data table. The ${yLabel} there is ${yText(y[i])}.`,
        MAX_EXPLANATION_LENGTH,
      ),
    };
    questions.push(q);
  }

  // 2. Zero crossing, or else the position of the highest value.
  const allZero = y.slice(0, n).every((v) => v === 0);
  if (a.zeroCrossings.length > 0 && !allZero) {
    const z = a.zeroCrossings[0];
    const first = a.zeroCrossings.length > 1 ? 'first ' : '';
    const spacings: number[] = [];
    for (let i = 1; i < n; i++) spacings.push(x[i] - x[i - 1]);
    const answer = z.exact ? z.x : Number(z.x.toPrecision(3));
    const explanation = z.exact
      ? `Press Z in the graph to jump to the zero crossing, or look for 0 in the ${yLabel} column of the data table. The ${yLabel} ${first}reaches zero at ${xText(answer)}.`
      : `Press Z in the graph to jump to the zero crossing. The ${yLabel} changes sign between ${formatNumber(x[z.index])} and ${xText(x[z.index + 1])}, so it ${first}reaches zero at about ${xText(answer)}.`;
    const q: NumberQuestion = {
      kind: 'number',
      prompt: clamp(`At what ${xLabel} does the ${yLabel} ${first}reach zero?`, MAX_PROMPT_LENGTH),
      answer,
      tolerance: tidy(Math.max(z.exact ? 0.01 * xRange : median(spacings) / 2, 1e-9)),
      unit: xUnit,
      explanation: clamp(explanation, MAX_EXPLANATION_LENGTH),
    };
    questions.push(q);
  } else if (yRange > 0 && y.filter((v) => v === a.max.y).length === 1) {
    const q: NumberQuestion = {
      kind: 'number',
      prompt: clamp(`At what ${xLabel} is the ${yLabel} highest?`, MAX_PROMPT_LENGTH),
      answer: a.max.x,
      tolerance: tidy(Math.max(0.01 * xRange, 1e-9)),
      unit: xUnit,
      explanation: clamp(
        `Press M in the graph to jump to the highest value, or look for the largest number in the ${yLabel} column of the data table. The highest ${yLabel} is ${yText(a.max.y)}, at ${xText(a.max.x)}.`,
        MAX_EXPLANATION_LENGTH,
      ),
    };
    questions.push(q);
  }

  // 3. Trend inside the first segment, so the answer is unambiguous.
  const seg = a.segments[0];
  if (seg && seg.to > seg.from) {
    const from = x[seg.from];
    const to = x[seg.to];
    const answer =
      seg.trend === 'increasing' ? TREND_CHOICES[0] : seg.trend === 'decreasing' ? TREND_CHOICES[1] : TREND_CHOICES[2];
    const q: ChoiceQuestion = {
      kind: 'choice',
      prompt: clamp(
        `Between ${formatNumber(from)} and ${xText(to)}, is the ${yLabel} increasing, decreasing, or staying the same?`,
        MAX_PROMPT_LENGTH,
      ),
      choices: [...TREND_CHOICES],
      answer,
      explanation: clamp(
        `Move from ${xText(from)} to ${xText(to)} with the Right Arrow key and listen to the pitch, or compare the values in the data table. The ${yLabel} goes from ${yText(y[seg.from])} to ${yText(y[seg.to])}, so it is ${answer.toLowerCase()}.`,
        MAX_EXPLANATION_LENGTH,
      ),
    };
    questions.push(q);
  }

  return questions;
}

// ---------- answer checking ----------

const LEAD_WORDS_RE = /^(?:about|approximately|approx\.?|around|roughly|~|≈|=)\s*/;
const NUMBER_TOKEN_RE = /\d[\d,]*(?:\.\d+)?|\.\d+/g;

function normalizeInput(input: string): string {
  let text = String(input ?? '')
    .trim()
    .toLowerCase()
    .replace(/[−–—]/g, '-');
  let previous: string;
  do {
    previous = text;
    text = text.replace(LEAD_WORDS_RE, '');
  } while (text !== previous);
  return text;
}

function interpretToken(token: string): number {
  let body = token;
  if (body.includes(',')) {
    if (/^[1-9]\d{0,2}(?:,\d{3})+(?:\.\d+)?$/.test(body) && !/^\d+,\d{1,2}$/.test(body)) {
      body = body.replace(/,/g, '');
    } else if (/^\d+,\d+$/.test(body)) {
      body = body.replace(',', '.');
    } else {
      body = body.slice(0, body.indexOf(','));
    }
  }
  return Number(body);
}

/** Position and value of the first number in already-normalized text, or null. */
function firstNumber(text: string): { start: number; value: number } | null {
  NUMBER_TOKEN_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = NUMBER_TOKEN_RE.exec(text)) !== null) {
    const before = match.index > 0 ? text[match.index - 1] : '';
    // Digits that belong to a word or a unit ("m/s^2", "h2o") are not the answer.
    if (before !== '' && /[\p{L}\d^._]/u.test(before)) {
      // Skip the rest of this run of digits.
      continue;
    }
    let value = interpretToken(match[0].replace(/,+$/, ''));
    if (!Number.isFinite(value)) return null;
    let start = match.index;
    const signMatch = /([+-])\s*$/.exec(text.slice(0, match.index));
    if (signMatch) {
      start = signMatch.index;
      if (signMatch[1] === '-') value = -value;
    }
    return { start, value: value === 0 ? 0 : value };
  }
  return null;
}

export function parseNumberInput(input: string): number | null {
  const text = normalizeInput(input);
  if (text === '') return null;
  const found = firstNumber(text);
  if (found) return found.value;
  if (/^zero(?![\p{L}\d])/u.test(text)) return 0;
  return null;
}

/** The number a text answer starts with ("4.0 s" -> 4), or null when it starts with words. */
function leadingNumber(input: string): number | null {
  const text = normalizeInput(input);
  const found = firstNumber(text);
  return found && found.start === 0 ? found.value : null;
}

function normalizeText(input: string): string {
  return String(input ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*\.$/, '')
    .toLowerCase();
}

function sentence(text: string): string {
  const t = text.trim();
  if (t === '') return '';
  return /[.!?…]$/.test(t) ? t : `${t}.`;
}

function feedback(correct: boolean, answerText: string, explanation: string): string {
  const parts = correct ? ['Correct.'] : ['Not quite.', sentence(`The answer is ${answerText}`)];
  const extra = sentence(String(explanation ?? ''));
  if (extra !== '') parts.push(extra);
  return parts.join(' ');
}

export function checkAnswer(q: Question, input: string): CheckResult {
  const raw = String(input ?? '');
  if (q.kind === 'number') {
    const value = parseNumberInput(raw);
    if (value === null) {
      return { correct: false, understood: false, feedback: 'Type a number, for example 4 or -2.5.' };
    }
    const slack = 1e-12 * Math.max(1, Math.abs(q.answer));
    const correct = Math.abs(value - q.answer) <= q.tolerance + slack;
    return { correct, understood: true, feedback: feedback(correct, valueWithUnit(q.answer, q.unit), q.explanation) };
  }
  if (q.kind === 'choice') {
    if (raw.trim() === '') return { correct: false, understood: false, feedback: 'Choose an answer first.' };
    const correct = raw.trim().toLowerCase() === q.answer.trim().toLowerCase();
    return { correct, understood: true, feedback: feedback(correct, q.answer.trim(), q.explanation) };
  }
  if (raw.trim() === '') return { correct: false, understood: false, feedback: 'Type an answer first.' };
  let correct = normalizeText(raw) === normalizeText(q.answer);
  if (!correct) {
    const expected = leadingNumber(q.answer);
    const given = leadingNumber(raw);
    if (expected !== null && given !== null) correct = Math.abs(expected - given) <= 1e-9;
  }
  return { correct, understood: true, feedback: feedback(correct, q.answer.trim(), q.explanation) };
}
