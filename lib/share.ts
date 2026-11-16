/**
 * Worksheet <-> URL hash. The hash is untrusted input: decodeWorksheet never throws.
 * Pure functions: no DOM, no Node APIs (btoa/atob/TextEncoder/TextDecoder exist in browsers and Node).
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
} from './types';
import type { DecodeResult, Question, Series, Worksheet } from './types';
import { validateWorksheet } from './data';

const VERSION_PREFIX = 'v1.';
const MAX_HASH_LENGTH = 20000;

const DAMAGED = 'This link is incomplete or damaged. Ask your teacher to send it again.';
const NEWER = 'This link was made with a newer version of HearGraph. Ask your teacher to send a new link.';
const EMPTY = 'No worksheet in this link.';
const TOO_LONG = 'This link is too long to open. Ask your teacher to send it again.';

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(payload: string): string {
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export function encodeWorksheet(w: Worksheet): string {
  const problems = validateWorksheet(w);
  if (problems.length > 0) throw new Error(problems.join(' '));
  const compact: Record<string, unknown> = {
    t: w.title,
    x: [w.x.label, w.x.unit],
    s: w.series.map((s) => [s.label, s.unit]),
    d: w.x.values.map((xv, i) => [xv, ...w.series.map((s) => s.values[i])]),
  };
  if (w.questions.length > 0) {
    compact.q = w.questions.map((q) => {
      if (q.kind === 'number') return ['n', q.prompt, q.answer, q.tolerance, q.unit, q.explanation];
      if (q.kind === 'choice') return ['c', q.prompt, q.choices, q.answer, q.explanation];
      return ['t', q.prompt, q.answer, q.explanation];
    });
  }
  return VERSION_PREFIX + toBase64Url(JSON.stringify(compact));
}

class Malformed extends Error {}

function own(obj: object, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(obj, key) ? (obj as Record<string, unknown>)[key] : undefined;
}

function str(v: unknown, max: number): string {
  if (typeof v !== 'string' || v.length > max) throw new Malformed();
  return v;
}

function num(v: unknown): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Malformed();
  return v;
}

function arr(v: unknown, min: number, max: number): unknown[] {
  if (!Array.isArray(v) || v.length < min || v.length > max) throw new Malformed();
  return v;
}

function labelUnit(v: unknown): [string, string] {
  const pair = arr(v, 2, 2);
  return [str(pair[0], MAX_LABEL_LENGTH), str(pair[1], MAX_UNIT_LENGTH)];
}

function readQuestion(v: unknown): Question {
  const q = arr(v, 4, 6);
  const prompt = str(q[1], MAX_PROMPT_LENGTH);
  if (q[0] === 'n' && q.length === 6) {
    return {
      kind: 'number',
      prompt,
      answer: num(q[2]),
      tolerance: num(q[3]),
      unit: str(q[4], MAX_UNIT_LENGTH),
      explanation: str(q[5], MAX_EXPLANATION_LENGTH),
    };
  }
  if (q[0] === 'c' && q.length === 5) {
    return {
      kind: 'choice',
      prompt,
      choices: arr(q[2], 2, 4).map((c) => str(c, MAX_ANSWER_LENGTH)),
      answer: str(q[3], MAX_ANSWER_LENGTH),
      explanation: str(q[4], MAX_EXPLANATION_LENGTH),
    };
  }
  if (q[0] === 't' && q.length === 4) {
    return {
      kind: 'text',
      prompt,
      answer: str(q[2], MAX_ANSWER_LENGTH),
      explanation: str(q[3], MAX_EXPLANATION_LENGTH),
    };
  }
  throw new Malformed();
}

function readWorksheet(data: unknown): Worksheet {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) throw new Malformed();
  const title = str(own(data, 't'), MAX_TITLE_LENGTH);
  const [xLabel, xUnit] = labelUnit(own(data, 'x'));
  const heads = arr(own(data, 's'), 1, MAX_SERIES).map(labelUnit);
  const rows = arr(own(data, 'd'), 0, MAX_POINTS);
  const xValues: number[] = [];
  const series: Series[] = heads.map(([label, unit]) => ({ label, unit, values: [] }));
  for (const rowValue of rows) {
    const row = arr(rowValue, 1 + series.length, 1 + series.length);
    xValues.push(num(row[0]));
    series.forEach((s, i) => s.values.push(num(row[i + 1])));
  }
  const rawQuestions = own(data, 'q');
  const questions =
    rawQuestions === undefined ? [] : arr(rawQuestions, 0, MAX_QUESTIONS).map(readQuestion);
  return { title, x: { label: xLabel, unit: xUnit, values: xValues }, series, questions };
}

export function decodeWorksheet(hash: string): DecodeResult {
  try {
    if (typeof hash !== 'string') return { ok: false, error: EMPTY };
    let text = hash.trim();
    if (text.startsWith('#')) text = text.slice(1).trim();
    if (text === '') return { ok: false, error: EMPTY };
    if (text.length > MAX_HASH_LENGTH) return { ok: false, error: TOO_LONG };
    if (!text.startsWith(VERSION_PREFIX)) {
      return { ok: false, error: /^v\d+\./.test(text) ? NEWER : DAMAGED };
    }
    const payload = text.slice(VERSION_PREFIX.length);
    if (!/^[A-Za-z0-9_-]+$/.test(payload)) return { ok: false, error: DAMAGED };
    const worksheet = readWorksheet(JSON.parse(fromBase64Url(payload)));
    if (validateWorksheet(worksheet).length > 0) return { ok: false, error: DAMAGED };
    return { ok: true, worksheet };
  } catch {
    return { ok: false, error: DAMAGED };
  }
}
