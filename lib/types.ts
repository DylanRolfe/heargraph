/**
 * Shared type contracts for HearGraph. Every module in /lib and every
 * component imports from here. Do not change a signature without updating
 * docs/PLAN.md.
 */

export const MAX_POINTS = 50;
export const MIN_POINTS = 2;
export const MAX_SERIES = 2;
export const MAX_QUESTIONS = 3;
export const MAX_TITLE_LENGTH = 120;
export const MAX_LABEL_LENGTH = 40;
export const MAX_UNIT_LENGTH = 20;
export const MAX_PROMPT_LENGTH = 200;
export const MAX_ANSWER_LENGTH = 80;
export const MAX_EXPLANATION_LENGTH = 300;

/** One y-series. `values[i]` belongs to `Worksheet.x.values[i]`. */
export interface Series {
  /** Quantity name, e.g. "Velocity". */
  label: string;
  /** Unit symbol as the teacher typed it, e.g. "m/s". May be "". */
  unit: string;
  values: number[];
}

export interface XAxis {
  /** Quantity name, e.g. "Time". */
  label: string;
  /** Unit symbol, e.g. "s". May be "". */
  unit: string;
  /** Strictly increasing, finite. */
  values: number[];
}

export interface NumberQuestion {
  kind: 'number';
  prompt: string;
  answer: number;
  /** Absolute tolerance: |input - answer| <= tolerance is correct. */
  tolerance: number;
  /** Unit symbol shown beside the input; may be "". */
  unit: string;
  /** Shown after answering, right or wrong. Explains how to find the answer. */
  explanation: string;
}

export interface ChoiceQuestion {
  kind: 'choice';
  prompt: string;
  /** 2 to 4 options. */
  choices: string[];
  /** Must equal one of `choices`. */
  answer: string;
  explanation: string;
}

export interface TextQuestion {
  kind: 'text';
  prompt: string;
  /** Compared case-insensitively after trimming and collapsing spaces. */
  answer: string;
  explanation: string;
}

export type Question = NumberQuestion | ChoiceQuestion | TextQuestion;

export interface Worksheet {
  title: string;
  x: XAxis;
  /** 1 or 2 series, each with values.length === x.values.length. */
  series: Series[];
  /** 0 to 3 questions. When empty, the student page auto-generates them. */
  questions: Question[];
}

/** A built-in example. All samples are synthetic (invented numbers). */
export interface Sample {
  id: string;
  /** Always true: the numbers are made up for demonstration. */
  synthetic: true;
  /** One sentence of context shown above the worksheet. */
  context: string;
  worksheet: Worksheet;
}

// ---------- lib/data ----------

export interface ParsedTable {
  x: XAxis;
  series: Series[];
}

export type ParseResult =
  | { ok: true; table: ParsedTable; notices: string[] }
  | { ok: false; errors: string[] };

// ---------- lib/describe ----------

export interface PointRef {
  index: number;
  x: number;
  y: number;
}

export interface ZeroCrossing {
  /** x where the series is zero. */
  x: number;
  /** true when a data point is exactly 0; false when linearly interpolated. */
  exact: boolean;
  /** Index of the data point when exact; otherwise index of the point just before the crossing. */
  index: number;
}

export type Trend = 'increasing' | 'decreasing' | 'constant';

export interface Segment {
  /** Inclusive point indexes. */
  from: number;
  to: number;
  trend: Trend;
  /** true when every step in the segment has the same slope (within 1e-9 relative). */
  steady: boolean;
}

export interface SeriesAnalysis {
  /** First occurrence of the highest value. */
  max: PointRef;
  /** First occurrence of the lowest value. */
  min: PointRef;
  zeroCrossings: ZeroCrossing[];
  /** Maximal runs of one trend, covering index 0 to n-1, adjacent segments share an endpoint. */
  segments: Segment[];
}

export type PointTag = 'maximum' | 'minimum' | 'zero';

// ---------- lib/questions ----------

export interface CheckResult {
  correct: boolean;
  /** false when the input could not be understood (e.g. empty, or not a number for a number question). */
  understood: boolean;
  /** Plain-language feedback, always includes the explanation when understood. */
  feedback: string;
}

// ---------- lib/share ----------

export type DecodeResult =
  | { ok: true; worksheet: Worksheet }
  | { ok: false; error: string };
