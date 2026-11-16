/**
 * Series analysis and plain-language descriptions.
 * Pure functions: no DOM, no Node APIs.
 */
import type {
  PointRef,
  PointTag,
  Segment,
  SeriesAnalysis,
  Trend,
  Worksheet,
  ZeroCrossing,
} from './types';

export function formatNumber(n: number): string {
  if (typeof n !== 'number' || !Number.isFinite(n)) return String(n);
  if (n === 0) return '0';
  const abs = Math.abs(n);
  let text: string;
  if (abs >= 0.001) {
    text = abs.toFixed(3);
  } else {
    const decimals = Math.min(100, 2 - Math.floor(Math.log10(abs)));
    text = abs.toFixed(decimals);
  }
  if (text.includes('.')) text = text.replace(/0+$/, '').replace(/\.$/, '');
  if (text === '0') return '0';
  return n < 0 ? `-${text}` : text;
}

/** [singular, plural] spoken forms, keyed by unit symbol. */
const SPOKEN_UNITS = new Map<string, [string, string]>([
  ['s', ['second', 'seconds']],
  ['ms', ['millisecond', 'milliseconds']],
  ['min', ['minute', 'minutes']],
  ['h', ['hour', 'hours']],
  ['m', ['metre', 'metres']],
  ['cm', ['centimetre', 'centimetres']],
  ['mm', ['millimetre', 'millimetres']],
  ['km', ['kilometre', 'kilometres']],
  ['m/s', ['metre per second', 'metres per second']],
  ['m/s²', ['metre per second squared', 'metres per second squared']],
  ['m/s^2', ['metre per second squared', 'metres per second squared']],
  ['km/h', ['kilometre per hour', 'kilometres per hour']],
  ['°C', ['degree Celsius', 'degrees Celsius']],
  ['°F', ['degree Fahrenheit', 'degrees Fahrenheit']],
  ['K', ['kelvin', 'kelvin']],
  ['kg', ['kilogram', 'kilograms']],
  ['g', ['gram', 'grams']],
  ['N', ['newton', 'newtons']],
  ['J', ['joule', 'joules']],
  ['W', ['watt', 'watts']],
  ['V', ['volt', 'volts']],
  ['A', ['ampere', 'amperes']],
  ['Hz', ['hertz', 'hertz']],
  ['%', ['percent', 'percent']],
  ['$', ['dollar', 'dollars']],
]);

export function spokenUnit(unit: string, value: number): string {
  if (typeof unit !== 'string') return '';
  const key = unit.trim();
  if (key === '') return '';
  const forms = SPOKEN_UNITS.get(key);
  if (!forms) return unit;
  return Math.abs(value) === 1 ? forms[0] : forms[1];
}

/** "6 m/s"; just "6" when the unit is empty. */
export function valueWithUnit(n: number, unit: string): string {
  const u = (unit ?? '').trim();
  return u === '' ? formatNumber(n) : `${formatNumber(n)} ${u}`;
}

/**
 * Lower-cases ordinary capitalised words ("Velocity" -> "velocity") but leaves
 * single letters and symbols such as "A", "pH" or "CO2" alone ("Dish A" -> "dish A").
 */
export function lowerLabel(label: string): string {
  return String(label ?? '')
    .trim()
    .split(/\s+/)
    .map((word) => (/^\p{Lu}\p{Ll}+$/u.test(word) ? word.toLowerCase() : word))
    .join(' ');
}

function stepTrend(a: number, b: number): Trend {
  if (b > a) return 'increasing';
  if (b < a) return 'decreasing';
  return 'constant';
}

export function analyzeSeries(x: number[], y: number[]): SeriesAnalysis {
  const n = Math.min(x.length, y.length);
  if (n === 0) {
    const none: PointRef = { index: -1, x: NaN, y: NaN };
    return { max: none, min: { ...none }, zeroCrossings: [], segments: [] };
  }

  let maxIndex = 0;
  let minIndex = 0;
  for (let i = 1; i < n; i++) {
    if (y[i] > y[maxIndex]) maxIndex = i;
    if (y[i] < y[minIndex]) minIndex = i;
  }

  const zeroCrossings: ZeroCrossing[] = [];
  for (let i = 0; i < n; i++) {
    if (y[i] === 0) {
      zeroCrossings.push({ x: x[i], exact: true, index: i });
    } else if (i < n - 1 && y[i + 1] !== 0 && y[i] > 0 !== y[i + 1] > 0) {
      const t = y[i] / (y[i] - y[i + 1]);
      zeroCrossings.push({ x: x[i] + t * (x[i + 1] - x[i]), exact: false, index: i });
    }
  }

  const segments: Segment[] = [];
  if (n === 1) {
    segments.push({ from: 0, to: 0, trend: 'constant', steady: true });
  } else {
    let from = 0;
    let trend = stepTrend(y[0], y[1]);
    for (let i = 1; i < n; i++) {
      const next = i < n - 1 ? stepTrend(y[i], y[i + 1]) : null;
      if (next !== trend) {
        segments.push({ from, to: i, trend, steady: isSteady(x, y, from, i) });
        from = i;
        if (next !== null) trend = next;
      }
    }
  }

  return {
    max: { index: maxIndex, x: x[maxIndex], y: y[maxIndex] },
    min: { index: minIndex, x: x[minIndex], y: y[minIndex] },
    zeroCrossings,
    segments,
  };
}

function isSteady(x: number[], y: number[], from: number, to: number): boolean {
  const first = (y[from + 1] - y[from]) / (x[from + 1] - x[from]);
  for (let i = from + 1; i < to; i++) {
    const slope = (y[i + 1] - y[i]) / (x[i + 1] - x[i]);
    const scale = Math.max(Math.abs(first), Math.abs(slope));
    if (Math.abs(slope - first) > 1e-9 * scale) return false;
  }
  return true;
}

export function pointTags(a: SeriesAnalysis, index: number): PointTag[] {
  const tags: PointTag[] = [];
  if (a.max.y !== a.min.y) {
    if (index === a.max.index) tags.push('maximum');
    if (index === a.min.index) tags.push('minimum');
  }
  if (a.zeroCrossings.some((z) => z.exact && z.index === index)) tags.push('zero');
  return tags;
}

function joinWords(...parts: string[]): string {
  return parts.filter((p) => p !== '').join(' ');
}

export function describePoint(w: Worksheet, seriesIndex: number, pointIndex: number): string {
  const series = w.series[seriesIndex];
  if (!series || !Number.isInteger(pointIndex) || pointIndex < 0 || pointIndex >= w.x.values.length) return '';
  const xv = w.x.values[pointIndex];
  const yv = series.values[pointIndex];
  const tags = pointTags(analyzeSeries(w.x.values, series.values), pointIndex);
  let text =
    joinWords(w.x.label.trim(), formatNumber(xv), spokenUnit(w.x.unit, xv)) +
    ', ' +
    joinWords(lowerLabel(series.label), formatNumber(yv), spokenUnit(series.unit, yv));
  if (tags.includes('zero')) text += ', crossing zero';
  if (tags.includes('maximum')) text += ', highest value';
  if (tags.includes('minimum')) text += ', lowest value';
  return text + '.';
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function trendVerb(seg: Segment): string {
  if (seg.trend === 'constant') return 'stays level';
  const verb = seg.trend === 'increasing' ? 'rises' : 'falls';
  return seg.steady ? `${verb} steadily` : verb;
}

function shapeSentence(a: SeriesAnalysis, xText: (i: number) => string): string {
  const segs = a.segments;
  if (segs.length === 0) return '';
  if (segs.length === 1) return `It ${trendVerb(segs[0])} the whole way.`;
  if (segs.length > 4) {
    const ups = segs.filter((s) => s.trend === 'increasing').length;
    const downs = segs.filter((s) => s.trend === 'decreasing').length;
    const times = Math.max(ups, downs);
    return `It goes up and down ${times} time${times === 1 ? '' : 's'}.`;
  }
  const parts = segs.map((seg, i) =>
    i === segs.length - 1
      ? `${trendVerb(seg)} until the end at ${xText(seg.to)}`
      : `${trendVerb(seg)} until ${xText(seg.to)}`,
  );
  return `It ${parts.join(', then ')}.`;
}

function zeroSentence(a: SeriesAnalysis, y: number[], unit: string, xValue: (x: number) => string): string {
  const zs = a.zeroCrossings;
  if (zs.length === 0) return 'It never reaches zero.';
  if (y.every((v) => v === 0)) return 'It is zero at every point.';
  if (zs.length > 4) return `It reaches or crosses zero ${zs.length} times.`;
  const zeroText = valueWithUnit(0, unit);
  const parts: string[] = [];
  let previousLead = '';
  for (const z of zs) {
    const lead = !z.exact ? 'crosses zero' : z.index === 0 ? `is ${zeroText}` : `reaches ${zeroText}`;
    const where = z.exact ? `at ${xValue(z.x)}` : `at about ${xValue(Number(z.x.toPrecision(3)))}`;
    // "crosses zero at about 7.6 h and at about 21.5 h" rather than repeating the verb.
    parts.push(lead === previousLead ? where : `${lead} ${where}`);
    previousLead = lead;
  }
  if (zs.length === 1) {
    const after = y.slice(zs[0].index + 1);
    if (after.length > 0 && after.every((v) => v < 0)) parts.push('is negative after that');
    else if (after.length > 0 && after.every((v) => v > 0)) parts.push('is positive after that');
  }
  return `It ${joinList(parts)}.`;
}

export function describeSeries(w: Worksheet, seriesIndex: number): string {
  const series = w.series[seriesIndex];
  if (!series) return '';
  const x = w.x.values;
  const y = series.values;
  const n = Math.min(x.length, y.length);
  if (n === 0) return '';
  const a = analyzeSeries(x, y);
  const yText = (v: number) => valueWithUnit(v, series.unit);
  const xValue = (v: number) => valueWithUnit(v, w.x.unit);
  const xText = (i: number) => xValue(x[i]);
  const label = series.label.trim();

  const sentences: string[] = [];
  sentences.push(`${label} starts at ${yText(y[0])} and ends at ${yText(y[n - 1])}.`);
  sentences.push(shapeSentence(a, xText));
  sentences.push(zeroSentence(a, y.slice(0, n), series.unit, xValue));
  if (a.max.y === a.min.y) {
    sentences.push(`Every value is ${yText(a.max.y)}.`);
  } else {
    sentences.push(`Highest value: ${yText(a.max.y)} at ${xText(a.max.index)}.`);
    sentences.push(`Lowest value: ${yText(a.min.y)} at ${xText(a.min.index)}.`);
  }
  return sentences.filter((s) => s !== '').join(' ');
}

export function describeWorksheet(w: Worksheet): string[] {
  const x = w.x.values;
  const n = x.length;
  const title = w.title.trim();
  const titleSentence = /[.!?]$/.test(title) ? title : `${title}.`;
  const labels = w.series.map((s) => s.label.trim()).join(' and ');
  const range = n > 0 ? ` from ${formatNumber(x[0])} to ${valueWithUnit(x[n - 1], w.x.unit)}` : '';
  const overview = `${titleSentence} A line graph of ${labels} against ${w.x.label.trim()}, with ${n} points${range}.`;
  return [overview, ...w.series.map((_, i) => describeSeries(w, i))];
}
