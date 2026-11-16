import { describe, it, expect } from 'vitest';
import { samples, getSample } from '@/lib/samples';
import { parseCsv, tableToCsv, validateWorksheet } from '@/lib/data';
import { analyzeSeries, describeWorksheet } from '@/lib/describe';
import { checkAnswer } from '@/lib/questions';
import type { ChoiceQuestion, NumberQuestion } from '@/lib/types';

describe('samples', () => {
  it('has the three samples in order', () => {
    expect(samples.map((s) => s.id)).toEqual(['cart', 'temperature', 'population']);
  });
  it('getSample finds by id and returns undefined otherwise', () => {
    for (const s of samples) expect(getSample(s.id)).toBe(s);
    expect(getSample('nope')).toBeUndefined();
    expect(getSample('')).toBeUndefined();
    expect(getSample('__proto__')).toBeUndefined();
  });
  it('marks every sample as synthetic, in the flag and in the context sentence', () => {
    for (const s of samples) {
      expect(s.synthetic).toBe(true);
      expect(s.context.endsWith('(Synthetic data, made up for this example.)')).toBe(true);
    }
  });
  it('every sample passes validateWorksheet', () => {
    for (const s of samples) expect(validateWorksheet(s.worksheet), s.id).toEqual([]);
  });
  it('every sample survives a CSV round trip and can be described', () => {
    for (const s of samples) {
      const { x, series } = s.worksheet;
      const r = parseCsv(tableToCsv(x, series));
      expect(r).toEqual({ ok: true, table: { x, series }, notices: [] });
      const paragraphs = describeWorksheet(s.worksheet);
      expect(paragraphs).toHaveLength(1 + series.length);
      for (const p of paragraphs) expect(p.length).toBeGreaterThan(20);
    }
  });
});

describe('cart sample', () => {
  const w = getSample('cart')!.worksheet;
  it('has the specified data', () => {
    expect(w.title).toBe('Cart on a track: velocity vs time');
    expect(w.x).toEqual({ label: 'Time', unit: 's', values: [0, 1, 2, 3, 4, 5, 6, 7, 8] });
    expect(w.series).toEqual([{ label: 'Velocity', unit: 'm/s', values: [6, 4.5, 3, 1.5, 0, -1.5, -3, -4.5, -6] }]);
  });
  it('has the three hand-written questions', () => {
    expect(w.questions.map((q) => q.prompt)).toEqual([
      'At what time does the cart stop?',
      'Is the cart speeding up or slowing down between 0 and 4 s?',
      'What is the velocity at 6 s?',
    ]);
    const [a, b, c] = w.questions as [NumberQuestion, ChoiceQuestion, NumberQuestion];
    expect(a).toMatchObject({ kind: 'number', answer: 4, unit: 's', tolerance: 0.05 });
    expect(b).toMatchObject({
      kind: 'choice',
      choices: ['Speeding up', 'Slowing down', 'Staying at the same speed'],
      answer: 'Slowing down',
    });
    expect(c).toMatchObject({ kind: 'number', answer: -3, unit: 'm/s', tolerance: 0.05 });
  });
  it('accepts the right answers and rejects wrong ones', () => {
    const [a, b, c] = w.questions;
    expect(checkAnswer(a, '4 s').correct).toBe(true);
    expect(checkAnswer(a, '5').correct).toBe(false);
    expect(checkAnswer(b, 'Slowing down').correct).toBe(true);
    expect(checkAnswer(b, 'Speeding up').correct).toBe(false);
    expect(checkAnswer(c, '−3 m/s').correct).toBe(true);
    expect(checkAnswer(c, '3').correct).toBe(false);
    expect(checkAnswer(c, '3').feedback).toMatch(/^Not quite\. The answer is -3 m\/s\. /);
  });
});

describe('temperature sample', () => {
  const w = getSample('temperature')!.worksheet;
  it('has 13 points every 2 hours, in °C, with no hand-written questions', () => {
    expect(w.title).toBe('Outdoor temperature over one day');
    expect(w.x.label).toBe('Time');
    expect(w.x.unit).toBe('h');
    expect(w.x.values).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24]);
    expect(w.series).toHaveLength(1);
    expect(w.series[0].label).toBe('Temperature');
    expect(w.series[0].unit).toBe('°C');
    expect(w.questions).toEqual([]);
  });
  it('dips below zero overnight and peaks mid-afternoon, with interpolated crossings only', () => {
    const a = analyzeSeries(w.x.values, w.series[0].values);
    expect(a.zeroCrossings).toHaveLength(2);
    expect(a.zeroCrossings.every((z) => !z.exact)).toBe(true);
    expect(a.min.y).toBeLessThan(0);
    expect(a.min.x).toBeLessThan(8);
    expect(a.max.x).toBeGreaterThanOrEqual(13);
    expect(a.max.x).toBeLessThanOrEqual(16);
  });
});

describe('population sample', () => {
  const w = getSample('population')!.worksheet;
  it('has 11 hourly points and two dishes with no zero crossings', () => {
    expect(w.title).toBe('Bacteria colony growth in two dishes');
    expect(w.x).toEqual({ label: 'Time', unit: 'h', values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] });
    expect(w.series.map((s) => [s.label, s.unit])).toEqual([
      ['Dish A', 'thousand cells'],
      ['Dish B', 'thousand cells'],
    ]);
    expect(w.questions).toHaveLength(3);
    for (const s of w.series) {
      const a = analyzeSeries(w.x.values, s.values);
      expect(a.zeroCrossings).toEqual([]);
      expect(a.segments).toHaveLength(1);
      expect(a.segments[0].trend).toBe('increasing');
    }
  });
  it('Dish A roughly doubles early then levels off; Dish B grows more slowly', () => {
    const [a, b] = w.series.map((s) => s.values);
    expect(a[1] / a[0]).toBe(2);
    expect(a[2] / a[1]).toBe(2);
    expect(a[10] - a[9]).toBeLessThan(a[4] - a[3]);
    for (let i = 1; i < a.length; i++) expect(b[i]).toBeLessThan(a[i]);
  });
});
