import { describe, it, expect } from 'vitest';
import {
  analyzeSeries,
  describePoint,
  describeSeries,
  describeWorksheet,
  formatNumber,
  pointTags,
  spokenUnit,
} from '@/lib/describe';
import { getSample } from '@/lib/samples';
import type { Worksheet } from '@/lib/types';

const cart = getSample('cart')!.worksheet;
const temperature = getSample('temperature')!.worksheet;
const population = getSample('population')!.worksheet;

function sheet(y: number[], unit = '', xUnit = ''): Worksheet {
  return {
    title: 'T',
    x: { label: 'X', unit: xUnit, values: y.map((_, i) => i) },
    series: [{ label: 'Height', unit, values: y }],
    questions: [],
  };
}

describe('formatNumber', () => {
  it('handles the edge cases', () => {
    expect(formatNumber(-0)).toBe('0');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(0.1 + 0.2)).toBe('0.3');
    expect(formatNumber(1234567)).toBe('1234567');
    expect(formatNumber(1e-7)).toBe('0.0000001');
  });
  it('rounds to at most 3 decimals and strips trailing zeros', () => {
    expect(formatNumber(3.14159)).toBe('3.142');
    expect(formatNumber(2.5)).toBe('2.5');
    expect(formatNumber(2.0)).toBe('2');
    expect(formatNumber(100)).toBe('100');
    expect(formatNumber(1.0004)).toBe('1');
    expect(formatNumber(0.001)).toBe('0.001');
  });
  it('uses an ASCII hyphen for negatives and never prints -0', () => {
    expect(formatNumber(-3)).toBe('-3');
    expect(formatNumber(-1.5)).toBe('-1.5');
    expect(formatNumber(-0.0001)).toBe('-0.0001');
    expect(formatNumber(-0.0004)).toBe('-0.0004');
  });
  it('uses 3 significant digits for small magnitudes', () => {
    expect(formatNumber(0.000123456)).toBe('0.000123');
    expect(formatNumber(0.0009996)).toBe('0.001');
    expect(formatNumber(-2.5e-10)).toBe('-0.00000000025');
  });
  it('never uses exponent notation or separators below 1e15', () => {
    expect(formatNumber(123456789012345)).toBe('123456789012345');
    expect(formatNumber(-999999999999.5)).toBe('-999999999999.5');
  });
});

describe('spokenUnit', () => {
  it('expands units, plural by default', () => {
    expect(spokenUnit('s', 4)).toBe('seconds');
    expect(spokenUnit('ms', 2)).toBe('milliseconds');
    expect(spokenUnit('min', 0)).toBe('minutes');
    expect(spokenUnit('h', 2)).toBe('hours');
    expect(spokenUnit('m', 0.5)).toBe('metres');
    expect(spokenUnit('cm', 3)).toBe('centimetres');
    expect(spokenUnit('mm', 3)).toBe('millimetres');
    expect(spokenUnit('km', 3)).toBe('kilometres');
    expect(spokenUnit('m/s', 0)).toBe('metres per second');
    expect(spokenUnit('m/s²', 9.8)).toBe('metres per second squared');
    expect(spokenUnit('m/s^2', 9.8)).toBe('metres per second squared');
    expect(spokenUnit('km/h', 50)).toBe('kilometres per hour');
    expect(spokenUnit('°C', -3)).toBe('degrees Celsius');
    expect(spokenUnit('°F', 70)).toBe('degrees Fahrenheit');
    expect(spokenUnit('K', 300)).toBe('kelvin');
    expect(spokenUnit('kg', 2)).toBe('kilograms');
    expect(spokenUnit('g', 2)).toBe('grams');
    expect(spokenUnit('N', 2)).toBe('newtons');
    expect(spokenUnit('J', 2)).toBe('joules');
    expect(spokenUnit('W', 2)).toBe('watts');
    expect(spokenUnit('V', 2)).toBe('volts');
    expect(spokenUnit('A', 2)).toBe('amperes');
    expect(spokenUnit('Hz', 440)).toBe('hertz');
    expect(spokenUnit('%', 50)).toBe('percent');
    expect(spokenUnit('$', 5)).toBe('dollars');
  });
  it('uses the singular when |value| is 1', () => {
    expect(spokenUnit('s', 1)).toBe('second');
    expect(spokenUnit('s', -1)).toBe('second');
    expect(spokenUnit('m/s', 1)).toBe('metre per second');
    expect(spokenUnit('°C', 1)).toBe('degree Celsius');
    expect(spokenUnit('N', -1)).toBe('newton');
    expect(spokenUnit('Hz', 1)).toBe('hertz');
  });
  it('returns unknown units unchanged and empty for empty', () => {
    expect(spokenUnit('thousand cells', 3)).toBe('thousand cells');
    expect(spokenUnit('', 3)).toBe('');
    expect(spokenUnit('constructor', 3)).toBe('constructor');
    expect(spokenUnit('M', 3)).toBe('M');
  });
});

describe('analyzeSeries', () => {
  it('analyses the cart sample', () => {
    const a = analyzeSeries(cart.x.values, cart.series[0].values);
    expect(a.zeroCrossings).toEqual([{ x: 4, exact: true, index: 4 }]);
    expect(a.segments).toEqual([{ from: 0, to: 8, trend: 'decreasing', steady: true }]);
    expect(a.max).toEqual({ index: 0, x: 0, y: 6 });
    expect(a.min).toEqual({ index: 8, x: 8, y: -6 });
  });
  it('interpolates a crossing between neighbours', () => {
    const a = analyzeSeries([0, 2, 4], [-1, 3, 5]);
    expect(a.zeroCrossings).toHaveLength(1);
    expect(a.zeroCrossings[0].exact).toBe(false);
    expect(a.zeroCrossings[0].index).toBe(0);
    expect(a.zeroCrossings[0].x).toBeCloseTo(0.5, 12);
    expect(a.segments).toEqual([{ from: 0, to: 2, trend: 'increasing', steady: false }]);
  });
  it('finds both crossings in the temperature sample', () => {
    const a = analyzeSeries(temperature.x.values, temperature.series[0].values);
    expect(a.zeroCrossings.map((z) => [z.exact, z.index])).toEqual([
      [false, 3],
      [false, 10],
    ]);
    expect(a.zeroCrossings[0].x).toBeCloseTo(7.6, 9);
    expect(a.zeroCrossings[1].x).toBeCloseTo(21.5, 9);
    expect(a.max.index).toBe(7);
    expect(a.min.index).toBe(2);
    expect(a.segments.map((s) => [s.from, s.to, s.trend])).toEqual([
      [0, 2, 'decreasing'],
      [2, 7, 'increasing'],
      [7, 12, 'decreasing'],
    ]);
  });
  it('does not add an interpolated crossing next to an exact one', () => {
    const a = analyzeSeries([0, 1, 2, 3, 4], [2, 0, -2, 0, 0]);
    expect(a.zeroCrossings).toEqual([
      { x: 1, exact: true, index: 1 },
      { x: 3, exact: true, index: 3 },
      { x: 4, exact: true, index: 4 },
    ]);
  });
  it('handles a flat series', () => {
    const a = analyzeSeries([0, 1, 2], [5, 5, 5]);
    expect(a.segments).toEqual([{ from: 0, to: 2, trend: 'constant', steady: true }]);
    expect(a.max.index).toBe(0);
    expect(a.min.index).toBe(0);
    expect(a.zeroCrossings).toEqual([]);
    expect(pointTags(a, 0)).toEqual([]);
  });
  it('handles an up-down series', () => {
    const a = analyzeSeries([0, 1, 2, 3, 4], [0, 2, 4, 3, 1]);
    expect(a.segments).toEqual([
      { from: 0, to: 2, trend: 'increasing', steady: true },
      { from: 2, to: 4, trend: 'decreasing', steady: false },
    ]);
    expect(a.max).toEqual({ index: 2, x: 2, y: 4 });
    expect(a.min).toEqual({ index: 0, x: 0, y: 0 });
    expect(a.zeroCrossings).toEqual([{ x: 0, exact: true, index: 0 }]);
  });
  it('takes the first occurrence of ties and respects uneven x spacing for steadiness', () => {
    const a = analyzeSeries([0, 1, 3, 4], [1, 2, 4, 1]);
    expect(a.segments[0]).toEqual({ from: 0, to: 2, trend: 'increasing', steady: true });
    const b = analyzeSeries([0, 1, 2, 3], [3, 1, 3, 1]);
    expect(b.max.index).toBe(0);
    expect(b.min.index).toBe(1);
    expect(b.segments).toHaveLength(3);
  });
  it('has segments that cover every index and share endpoints', () => {
    const y = [1, 1, 2, 3, 3, 3, 2, 5];
    const a = analyzeSeries(y.map((_, i) => i), y);
    expect(a.segments[0].from).toBe(0);
    expect(a.segments[a.segments.length - 1].to).toBe(y.length - 1);
    for (let i = 1; i < a.segments.length; i++) {
      expect(a.segments[i].from).toBe(a.segments[i - 1].to);
      expect(a.segments[i].trend).not.toBe(a.segments[i - 1].trend);
    }
  });
  it('does not throw on empty or single-point input', () => {
    expect(analyzeSeries([], []).segments).toEqual([]);
    expect(analyzeSeries([1], [2]).segments).toEqual([{ from: 0, to: 0, trend: 'constant', steady: true }]);
  });
});

describe('pointTags', () => {
  it('tags maximum, minimum and exact zero', () => {
    const a = analyzeSeries(cart.x.values, cart.series[0].values);
    expect(pointTags(a, 0)).toEqual(['maximum']);
    expect(pointTags(a, 8)).toEqual(['minimum']);
    expect(pointTags(a, 4)).toEqual(['zero']);
    expect(pointTags(a, 2)).toEqual([]);
  });
  it('does not tag interpolated crossings', () => {
    const a = analyzeSeries([0, 1], [-1, 1]);
    expect(pointTags(a, 0)).toEqual(['minimum']);
    expect(pointTags(a, 1)).toEqual(['maximum']);
  });
  it('gives zero but not maximum or minimum on a flat zero series', () => {
    const a = analyzeSeries([0, 1], [0, 0]);
    expect(pointTags(a, 1)).toEqual(['zero']);
  });
});

describe('describePoint', () => {
  it('returns the exact cart announcement', () => {
    expect(describePoint(cart, 0, 4)).toBe('Time 4 seconds, velocity 0 metres per second, crossing zero.');
  });
  it('adds highest and lowest tags and uses singular units', () => {
    expect(describePoint(cart, 0, 0)).toBe('Time 0 seconds, velocity 6 metres per second, highest value.');
    expect(describePoint(cart, 0, 8)).toBe('Time 8 seconds, velocity -6 metres per second, lowest value.');
    expect(describePoint(cart, 0, 1)).toBe('Time 1 second, velocity 4.5 metres per second.');
    expect(describePoint(temperature, 0, 4)).toBe('Time 8 hours, temperature 1 degree Celsius.');
  });
  it('omits empty units without double spaces', () => {
    expect(describePoint(sheet([1, 2, 3]), 0, 1)).toBe('X 1, height 2.');
    expect(describePoint(sheet([0, 2, 3]), 0, 0)).toBe('X 0, height 0, crossing zero, lowest value.');
  });
  it('reads the second series and keeps single-letter names', () => {
    expect(describePoint(population, 1, 2)).toBe('Time 2 hours, dish B 4.5 thousand cells.');
  });
  it('returns an empty string for indexes out of range', () => {
    expect(describePoint(cart, 1, 0)).toBe('');
    expect(describePoint(cart, 0, 9)).toBe('');
    expect(describePoint(cart, 0, -1)).toBe('');
  });
});

describe('describeSeries', () => {
  it('describes the cart', () => {
    expect(describeSeries(cart, 0)).toBe(
      'Velocity starts at 6 m/s and ends at -6 m/s. It falls steadily the whole way. It reaches 0 m/s at 4 s and is negative after that. Highest value: 6 m/s at 0 s. Lowest value: -6 m/s at 8 s.',
    );
  });
  it('words interpolated crossings with "about" and lists the shape in order', () => {
    expect(describeSeries(temperature, 0)).toBe(
      'Temperature starts at -3 °C and ends at -2.5 °C. It falls until 4 h, then rises until 14 h, then falls until the end at 24 h. It crosses zero at about 7.6 h and at about 21.5 h. Highest value: 12.5 °C at 14 h. Lowest value: -5.5 °C at 4 h.',
    );
  });
  it('describes a series with no zero crossing', () => {
    const text = describeSeries(population, 1);
    expect(text).toContain('Dish B starts at 2 thousand cells and ends at 40 thousand cells.');
    expect(text).toContain('It rises the whole way.');
    expect(text).not.toContain('steadily');
    expect(text).toContain('It never reaches zero.');
  });
  it('summarises more than 4 segments', () => {
    const text = describeSeries(sheet([1, 3, 1, 3, 1, 3, 1]), 0);
    expect(text).toContain('It goes up and down 3 times.');
    expect(text).not.toContain('until');
  });
  it('describes a flat series', () => {
    expect(describeSeries(sheet([5, 5, 5], 'm'), 0)).toBe(
      'Height starts at 5 m and ends at 5 m. It stays level the whole way. It never reaches zero. Every value is 5 m.',
    );
    expect(describeSeries(sheet([0, 0, 0]), 0)).toContain('It is zero at every point.');
  });
  it('omits empty units without double spaces and uses no jargon', () => {
    const text = describeSeries(sheet([-2, 1, 4]), 0);
    expect(text).not.toMatch(/ {2}| \./);
    expect(text).toContain('It crosses zero at about 0.667 and is positive after that.');
    expect(text).not.toMatch(/monotonic/i);
  });
  it('returns an empty string for a missing series', () => {
    expect(describeSeries(cart, 3)).toBe('');
  });
});

describe('describeWorksheet', () => {
  it('starts with an overview then one paragraph per series', () => {
    expect(describeWorksheet(cart)).toEqual([
      'Cart on a track: velocity vs time. A line graph of Velocity against Time, with 9 points from 0 to 8 s.',
      describeSeries(cart, 0),
    ]);
    const p = describeWorksheet(population);
    expect(p).toHaveLength(3);
    expect(p[0]).toBe(
      'Bacteria colony growth in two dishes. A line graph of Dish A and Dish B against Time, with 11 points from 0 to 10 h.',
    );
    expect(p[2]).toBe(describeSeries(population, 1));
  });
  it('handles an empty x unit and a title that already ends with punctuation', () => {
    const w = { ...sheet([1, 2, 3]), title: 'What happens?' };
    expect(describeWorksheet(w)[0]).toBe(
      'What happens? A line graph of Height against X, with 3 points from 0 to 2.',
    );
  });
});
