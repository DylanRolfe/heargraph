import { describe, it, expect } from 'vitest';
import { decodeWorksheet, encodeWorksheet } from '@/lib/share';
import { samples, getSample } from '@/lib/samples';
import { generateQuestions } from '@/lib/questions';
import type { DecodeResult, Worksheet } from '@/lib/types';

const DAMAGED = 'This link is incomplete or damaged. Ask your teacher to send it again.';
const cart = getSample('cart')!.worksheet;

/** Builds a "v1." hash from any JSON-like value or raw text, without validation. */
function hashOf(value: unknown, raw = false): string {
  const text = raw ? String(value) : JSON.stringify(value);
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return 'v1.' + btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function good(): Record<string, unknown> {
  return {
    t: 'Title',
    x: ['Time', 's'],
    s: [['Speed', 'm/s']],
    d: [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
  };
}

function expectDamaged(r: DecodeResult) {
  expect(r).toEqual({ ok: false, error: DAMAGED });
}

describe('encodeWorksheet', () => {
  it('starts with v1. and uses only URL-safe characters', () => {
    for (const s of samples) {
      expect(encodeWorksheet(s.worksheet)).toMatch(/^v1\.[A-Za-z0-9_-]+$/);
    }
  });
  it('uses the compact schema from the plan', () => {
    const payload = encodeWorksheet(cart).slice(3).replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(payload), (c) => c.charCodeAt(0))));
    expect(json.t).toBe(cart.title);
    expect(json.x).toEqual(['Time', 's']);
    expect(json.s).toEqual([['Velocity', 'm/s']]);
    expect(json.d[4]).toEqual([4, 0]);
    expect(json.q[0].slice(0, 5)).toEqual(['n', 'At what time does the cart stop?', 4, 0.05, 's']);
    expect(json.q[1][0]).toBe('c');
  });
  it('throws with the validation messages for an invalid worksheet', () => {
    expect(() => encodeWorksheet({ ...cart, title: '' })).toThrow('The title is empty.');
    expect(() => encodeWorksheet({ ...cart, x: { ...cart.x, values: [1, 0] } })).toThrow(Error);
  });
});

describe('round trip', () => {
  it('round-trips every sample exactly', () => {
    for (const s of samples) {
      expect(decodeWorksheet(encodeWorksheet(s.worksheet))).toEqual({ ok: true, worksheet: s.worksheet });
    }
  });
  it('round-trips samples with generated questions and accepts a leading #', () => {
    for (const s of samples) {
      const w = { ...s.worksheet, questions: generateQuestions(s.worksheet) };
      expect(decodeWorksheet('#' + encodeWorksheet(w))).toEqual({ ok: true, worksheet: w });
    }
  });
  it('round-trips non-Latin text, symbols and all question kinds', () => {
    const w: Worksheet = {
      title: 'Température 🌡️ 温度 — «test»',
      x: { label: 'Время', unit: 'ч', values: [-1.5, 0, 1e-7, 2.25] },
      series: [
        { label: 'Temperature', unit: '°C', values: [-3.25, 0, 0.1 + 0.2, 1234567.891] },
        { label: 'درجة', unit: 'm/s²', values: [1, 2, 3, 4] },
      ],
      questions: [
        { kind: 'number', prompt: 'Combien ?', answer: -2.5, tolerance: 0, unit: '°C', explanation: '' },
        { kind: 'choice', prompt: 'Which?', choices: ['上', '下'], answer: '下', explanation: 'Because "quotes" \\ and\nnewlines.' },
        { kind: 'text', prompt: 'Name it', answer: 'Dish A', explanation: 'e' },
      ],
    };
    const hash = encodeWorksheet(w);
    expect(hash).toMatch(/^v1\.[A-Za-z0-9_-]+$/);
    expect(decodeWorksheet(hash)).toEqual({ ok: true, worksheet: w });
  });
  it('accepts a payload with no questions key and ignores unknown keys', () => {
    const r = decodeWorksheet(hashOf({ ...good(), extra: { a: 1 }, zz: [1, 2] }));
    expect(r).toEqual({
      ok: true,
      worksheet: {
        title: 'Title',
        x: { label: 'Time', unit: 's', values: [0, 1, 2] },
        series: [{ label: 'Speed', unit: 'm/s', values: [1, 2, 3] }],
        questions: [],
      },
    });
  });
});

describe('decodeWorksheet: untrusted input', () => {
  it('reports an empty hash', () => {
    for (const h of ['', '#', '   ', '# ']) {
      expect(decodeWorksheet(h)).toEqual({ ok: false, error: 'No worksheet in this link.' });
    }
    expect(decodeWorksheet(undefined as unknown as string).ok).toBe(false);
    expect(decodeWorksheet(null as unknown as string).ok).toBe(false);
  });
  it('reports an unknown version', () => {
    for (const h of ['v2.abc', '#v2.' + encodeWorksheet(cart).slice(3), 'v10.x']) {
      const r = decodeWorksheet(h);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toMatch(/^This link was made with a newer version of HearGraph\./);
    }
  });
  it('rejects garbage', () => {
    for (const h of ['hello', 'v1.', 'v1', 'v1.!!!!', 'v1.a', 'v1.abc def', 'v1.%7B%7D', '#sample=cart', 'v1.AAAA', 'V1.e30']) {
      expectDamaged(decodeWorksheet(h));
    }
  });
  it('rejects truncated payloads', () => {
    const hash = encodeWorksheet(cart);
    for (const cut of [1, 2, 3, 10, Math.floor(hash.length / 2), hash.length - 5]) {
      expectDamaged(decodeWorksheet(hash.slice(0, hash.length - cut)));
    }
  });
  it('rejects invalid UTF-8 and bad JSON', () => {
    expectDamaged(decodeWorksheet('v1._w')); // byte 0xFF
    expectDamaged(decodeWorksheet(hashOf('{"t":"x",', true)));
    expectDamaged(decodeWorksheet(hashOf('not json', true)));
  });
  it('rejects JSON that is not an object', () => {
    for (const v of [null, 5, 'text', [], [good()], true]) expectDamaged(decodeWorksheet(hashOf(v)));
    expectDamaged(decodeWorksheet(hashOf({})));
  });
  it('rejects wrong types', () => {
    const cases: Record<string, unknown>[] = [
      { ...good(), t: 5 },
      { ...good(), t: null },
      { ...good(), t: '' },
      { ...good(), x: 'Time' },
      { ...good(), x: ['Time'] },
      { ...good(), x: ['Time', 's', 'extra'] },
      { ...good(), x: [1, 's'] },
      { ...good(), x: ['', 's'] },
      { ...good(), s: [] },
      { ...good(), s: 'Speed' },
      { ...good(), s: [['Speed', 'm/s'], ['B', ''], ['C', '']] },
      { ...good(), s: [['Speed']] },
      { ...good(), s: [{ 0: 'Speed', 1: 'm/s', length: 2 }] },
      { ...good(), d: 'rows' },
      { ...good(), d: { length: 3 } },
      { ...good(), d: [[0, 1], [1, '2'], [2, 3]] },
      { ...good(), d: [[0, 1], [1, null], [2, 3]] },
      { ...good(), d: [[0, 1], [1], [2, 3]] },
      { ...good(), d: [[0, 1, 9], [1, 2, 9], [2, 3, 9]] },
      { ...good(), d: [[0, 1], 7, [2, 3]] },
      { ...good(), d: [[0, 1]] },
      { ...good(), d: [] },
      { ...good(), q: 'none' },
      { ...good(), q: [5] },
      { ...good(), q: [['z', 'p', 'a', 'e']] },
      { ...good(), q: [['n', 'p', '4', 0, '', 'e']] },
      { ...good(), q: [['n', 'p', 4, -1, '', 'e']] },
      { ...good(), q: [['n', 'p', 4, 0, '']] },
      { ...good(), q: [['n', '', 4, 0, '', 'e']] },
      { ...good(), q: [['c', 'p', ['a'], 'a', 'e']] },
      { ...good(), q: [['c', 'p', ['a', 'b'], 'z', 'e']] },
      { ...good(), q: [['c', 'p', 'ab', 'a', 'e']] },
      { ...good(), q: [['c', 'p', ['a', 'a'], 'a', 'e']] },
      { ...good(), q: [['t', 'p', '', 'e']] },
      { ...good(), q: [['t', 'p', 5, 'e']] },
      { ...good(), q: [['t', 'p', 'a', 'e'], ['t', 'p', 'a', 'e'], ['t', 'p', 'a', 'e'], ['t', 'p', 'a', 'e']] },
    ];
    for (const c of cases) {
      const r = decodeWorksheet(hashOf(c));
      expect(r, JSON.stringify(c)).toEqual({ ok: false, error: DAMAGED });
    }
  });
  it('rejects NaN and Infinity written into the JSON text', () => {
    expectDamaged(decodeWorksheet(hashOf('{"t":"T","x":["a",""],"s":[["b",""]],"d":[[0,NaN],[1,2]]}', true)));
    expectDamaged(decodeWorksheet(hashOf('{"t":"T","x":["a",""],"s":[["b",""]],"d":[[0,1e999],[1,2]]}', true)));
  });
  it('rejects 51 points, unsorted x and repeated x', () => {
    const rows = Array.from({ length: 51 }, (_, i) => [i, i]);
    expectDamaged(decodeWorksheet(hashOf({ ...good(), d: rows })));
    expect(decodeWorksheet(hashOf({ ...good(), d: rows.slice(0, 50) })).ok).toBe(true);
    expectDamaged(decodeWorksheet(hashOf({ ...good(), d: [[0, 1], [2, 2], [1, 3]] })));
    expectDamaged(decodeWorksheet(hashOf({ ...good(), d: [[0, 1], [1, 2], [1, 3]] })));
  });
  it('rejects strings longer than the caps', () => {
    expectDamaged(decodeWorksheet(hashOf({ ...good(), t: 'a'.repeat(121) })));
    expectDamaged(decodeWorksheet(hashOf({ ...good(), x: ['a'.repeat(41), 's'] })));
    expectDamaged(decodeWorksheet(hashOf({ ...good(), x: ['Time', 'u'.repeat(21)] })));
    expectDamaged(decodeWorksheet(hashOf({ ...good(), s: [['a'.repeat(41), '']] })));
    expectDamaged(decodeWorksheet(hashOf({ ...good(), q: [['t', 'p'.repeat(201), 'a', 'e']] })));
    expectDamaged(decodeWorksheet(hashOf({ ...good(), q: [['t', 'p', 'a'.repeat(81), 'e']] })));
    expectDamaged(decodeWorksheet(hashOf({ ...good(), q: [['t', 'p', 'a', 'e'.repeat(301)]] })));
  });
  it('rejects hashes longer than 20000 characters before decoding', () => {
    const r = decodeWorksheet('v1.' + 'A'.repeat(20000));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/too long/);
    expect(decodeWorksheet('#'.repeat(5) + 'x'.repeat(1_000_000)).ok).toBe(false);
  });
  it('is not affected by __proto__ or constructor keys', () => {
    const raw =
      '{"__proto__":{"polluted":true,"t":"Evil"},"constructor":{"prototype":{"polluted":true}},' +
      '"t":"Title","x":["Time","s"],"s":[["Speed","m/s"]],"d":[[0,1],[1,2]]}';
    const r = decodeWorksheet(hashOf(raw, true));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.worksheet.title).toBe('Title');
      expect(Object.keys(r.worksheet).sort()).toEqual(['questions', 'series', 'title', 'x']);
      expect(Object.getPrototypeOf(r.worksheet)).toBe(Object.prototype);
    }
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect((Object.prototype as Record<string, unknown>).polluted).toBeUndefined();

    // Fields supplied only through __proto__ are not read.
    const onlyProto = '{"__proto__":{"t":"Title","x":["Time","s"],"s":[["Speed","m/s"]],"d":[[0,1],[1,2]]}}';
    expectDamaged(decodeWorksheet(hashOf(onlyProto, true)));
  });
  it('never throws on random input', () => {
    let seed = 12345;
    const next = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff);
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.#=%{}[]",: ';
    const valid = encodeWorksheet(cart);
    for (let i = 0; i < 500; i++) {
      let text = '';
      const length = next() % 200;
      for (let j = 0; j < length; j++) text += alphabet[next() % alphabet.length];
      expect(() => decodeWorksheet(i % 2 ? 'v1.' + text : text)).not.toThrow();
      // Flip one character of a valid link.
      const at = 3 + (next() % (valid.length - 3));
      const mutated = valid.slice(0, at) + alphabet[next() % 64] + valid.slice(at + 1);
      let r: DecodeResult | undefined;
      expect(() => (r = decodeWorksheet(mutated))).not.toThrow();
      expect(typeof r!.ok).toBe('boolean');
    }
  });
});
