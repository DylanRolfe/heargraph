import { describe, it, expect } from 'vitest';
import { checkAnswer, generateQuestions, parseNumberInput } from '@/lib/questions';
import { validateWorksheet } from '@/lib/data';
import { samples, getSample } from '@/lib/samples';
import { MAX_EXPLANATION_LENGTH, MAX_PROMPT_LENGTH } from '@/lib/types';
import type { ChoiceQuestion, NumberQuestion, TextQuestion, Worksheet } from '@/lib/types';

const cart = getSample('cart')!.worksheet;
const temperature = getSample('temperature')!.worksheet;
const population = getSample('population')!.worksheet;

function sheet(y: number[], x = y.map((_, i) => i)): Worksheet {
  return {
    title: 'T',
    x: { label: 'Time', unit: 's', values: x },
    series: [{ label: 'Height', unit: 'm', values: y }],
    questions: [],
  };
}

describe('parseNumberInput', () => {
  it('reads plain numbers', () => {
    expect(parseNumberInput('4')).toBe(4);
    expect(parseNumberInput('  -2.5 ')).toBe(-2.5);
    expect(parseNumberInput('+3')).toBe(3);
    expect(parseNumberInput('.5')).toBe(0.5);
    expect(parseNumberInput('-.5')).toBe(-0.5);
    expect(parseNumberInput('4.')).toBe(4);
    expect(parseNumberInput('0')).toBe(0);
    expect(Object.is(parseNumberInput('-0'), 0)).toBe(true);
  });
  it('accepts Unicode minus and en dash', () => {
    expect(parseNumberInput('−3')).toBe(-3);
    expect(parseNumberInput('–3')).toBe(-3);
    expect(parseNumberInput('- 3')).toBe(-3);
  });
  it('handles decimal commas and thousands separators', () => {
    expect(parseNumberInput('3,5')).toBe(3.5);
    expect(parseNumberInput('3,55')).toBe(3.55);
    expect(parseNumberInput('-0,5')).toBe(-0.5);
    expect(parseNumberInput('0,125')).toBe(0.125);
    expect(parseNumberInput('1,200')).toBe(1200);
    expect(parseNumberInput('1,234,567')).toBe(1234567);
    expect(parseNumberInput('1,200.5')).toBe(1200.5);
  });
  it('strips units and lead-in words', () => {
    expect(parseNumberInput('4 s')).toBe(4);
    expect(parseNumberInput('4 seconds')).toBe(4);
    expect(parseNumberInput('4s')).toBe(4);
    expect(parseNumberInput('-3 m/s')).toBe(-3);
    expect(parseNumberInput('about 4')).toBe(4);
    expect(parseNumberInput('Approximately -2.5 m')).toBe(-2.5);
    expect(parseNumberInput('~4')).toBe(4);
    expect(parseNumberInput('= 4')).toBe(4);
    expect(parseNumberInput('about ~ 4')).toBe(4);
    expect(parseNumberInput('the answer is 4.')).toBe(4);
    expect(parseNumberInput('t = -4 s')).toBe(-4);
  });
  it('takes the first numeric token only', () => {
    expect(parseNumberInput('-3 m/s^2')).toBe(-3);
    expect(parseNumberInput('9.8 m/s2')).toBe(9.8);
    expect(parseNumberInput('1e5')).toBe(1);
    expect(parseNumberInput('3 or 4')).toBe(3);
  });
  it('supports the word zero', () => {
    expect(parseNumberInput('zero')).toBe(0);
    expect(parseNumberInput('Zero m/s')).toBe(0);
    expect(parseNumberInput('about zero')).toBe(0);
  });
  it('returns null when there is no number', () => {
    expect(parseNumberInput('')).toBeNull();
    expect(parseNumberInput('   ')).toBeNull();
    expect(parseNumberInput('abc')).toBeNull();
    expect(parseNumberInput('four')).toBeNull();
    expect(parseNumberInput('m/s^2')).toBeNull();
    expect(parseNumberInput('-')).toBeNull();
    expect(parseNumberInput('.')).toBeNull();
    expect(parseNumberInput('zeros')).toBeNull();
    expect(parseNumberInput('NaN')).toBeNull();
    expect(parseNumberInput('Infinity')).toBeNull();
    expect(parseNumberInput(undefined as unknown as string)).toBeNull();
  });
});

describe('checkAnswer: number questions', () => {
  const q: NumberQuestion = {
    kind: 'number',
    prompt: 'At what time does the cart stop?',
    answer: 4,
    tolerance: 0.05,
    unit: 's',
    explanation: 'It stops at 4 s.',
  };
  it('accepts answers within the tolerance', () => {
    for (const input of ['4', '4.0', '4 s', 'about 4 seconds', '4,0', '3.95', '4.05', ' +4 ']) {
      const r = checkAnswer(q, input);
      expect(r, input).toEqual({ correct: true, understood: true, feedback: 'Correct. It stops at 4 s.' });
    }
  });
  it('rejects answers outside the tolerance, kindly', () => {
    for (const input of ['3.9', '4.06', '-4', '5']) {
      const r = checkAnswer(q, input);
      expect(r, input).toEqual({
        correct: false,
        understood: true,
        feedback: 'Not quite. The answer is 4 s. It stops at 4 s.',
      });
    }
  });
  it('asks for a number when the input is not understood', () => {
    for (const input of ['', '  ', 'soon', 'm/s^2']) {
      expect(checkAnswer(q, input)).toEqual({
        correct: false,
        understood: false,
        feedback: 'Type a number, for example 4 or -2.5.',
      });
    }
  });
  it('formats negative answers and empty units', () => {
    const neg: NumberQuestion = { ...q, answer: -3, unit: '', explanation: 'See the table' };
    expect(checkAnswer(neg, '3').feedback).toBe('Not quite. The answer is -3. See the table.');
    expect(checkAnswer(neg, '−3 m/s').correct).toBe(true);
    expect(checkAnswer({ ...neg, explanation: '' }, '-3').feedback).toBe('Correct.');
  });
  it('treats zero tolerance as exact', () => {
    const exact: NumberQuestion = { ...q, answer: 0.3, tolerance: 0 };
    expect(checkAnswer(exact, '0.3').correct).toBe(true);
    expect(checkAnswer(exact, '0.31').correct).toBe(false);
  });
});

describe('checkAnswer: choice questions', () => {
  const q: ChoiceQuestion = {
    kind: 'choice',
    prompt: 'Speeding up or slowing down?',
    choices: ['Speeding up', 'Slowing down'],
    answer: 'Slowing down',
    explanation: 'The speed gets smaller.',
  };
  it('compares case-insensitively after trimming', () => {
    expect(checkAnswer(q, 'Slowing down')).toEqual({
      correct: true,
      understood: true,
      feedback: 'Correct. The speed gets smaller.',
    });
    expect(checkAnswer(q, '  slowing DOWN ').correct).toBe(true);
  });
  it('gives the answer when wrong', () => {
    expect(checkAnswer(q, 'Speeding up')).toEqual({
      correct: false,
      understood: true,
      feedback: 'Not quite. The answer is Slowing down. The speed gets smaller.',
    });
  });
  it('asks for a choice when empty', () => {
    expect(checkAnswer(q, ' ')).toEqual({ correct: false, understood: false, feedback: 'Choose an answer first.' });
  });
});

describe('checkAnswer: text questions', () => {
  const q: TextQuestion = { kind: 'text', prompt: 'Which dish grows faster?', answer: 'Dish A', explanation: 'Its line is higher.' };
  it('ignores case, extra spaces and a trailing period', () => {
    for (const input of ['Dish A', 'dish a', '  DISH   A  ', 'Dish A.', 'dish a .']) {
      expect(checkAnswer(q, input).correct, input).toBe(true);
    }
    expect(checkAnswer(q, 'Dish A').feedback).toBe('Correct. Its line is higher.');
  });
  it('rejects other text', () => {
    expect(checkAnswer(q, 'Dish B')).toEqual({
      correct: false,
      understood: true,
      feedback: 'Not quite. The answer is Dish A. Its line is higher.',
    });
    expect(checkAnswer(q, 'DishA').correct).toBe(false);
  });
  it('asks for an answer when empty', () => {
    expect(checkAnswer(q, '')).toEqual({ correct: false, understood: false, feedback: 'Type an answer first.' });
  });
  it('compares numerically when both sides are numbers', () => {
    const n: TextQuestion = { ...q, answer: '4' };
    expect(checkAnswer(n, '4.0 s').correct).toBe(true);
    expect(checkAnswer(n, '4,0').correct).toBe(true);
    expect(checkAnswer(n, 'about 4').correct).toBe(true);
    expect(checkAnswer(n, '4.1').correct).toBe(false);
    expect(checkAnswer({ ...q, answer: '-2.50 m' }, '−2.5').correct).toBe(true);
  });
  it('does not compare numerically when the answer is words that contain a digit', () => {
    const d: TextQuestion = { ...q, answer: 'Dish 2' };
    expect(checkAnswer(d, 'Plate 2').correct).toBe(false);
    expect(checkAnswer(d, '2').correct).toBe(false);
    expect(checkAnswer(d, 'dish 2').correct).toBe(true);
  });
  it('never uses exclamation marks or shaming words in its own feedback', () => {
    const all = [checkAnswer(q, 'x'), checkAnswer(q, ''), checkAnswer(q, 'Dish A')];
    for (const r of all) expect(r.feedback).not.toMatch(/!|wrong|incorrect/i);
  });
});

describe('generateQuestions', () => {
  it('builds three questions for the cart', () => {
    const qs = generateQuestions(cart);
    expect(qs.map((q) => q.kind)).toEqual(['number', 'number', 'choice']);
    expect(qs[0]).toEqual({
      kind: 'number',
      prompt: 'What is the velocity when the time is 5 s?',
      answer: -1.5,
      tolerance: 0.24,
      unit: 'm/s',
      explanation:
        'Move to the point where time is 5 s with the arrow keys, or find the row for 5 s in the data table. The velocity there is -1.5 m/s.',
    });
    expect(qs[1].prompt).toBe('At what time does the velocity reach zero?');
    expect((qs[1] as NumberQuestion).answer).toBe(4);
    expect((qs[1] as NumberQuestion).unit).toBe('s');
    expect((qs[1] as NumberQuestion).tolerance).toBeCloseTo(0.08, 12);
    expect(qs[2]).toMatchObject({
      prompt: 'Between 0 and 8 s, is the velocity increasing, decreasing, or staying the same?',
      choices: ['Increasing', 'Decreasing', 'Staying the same'],
      answer: 'Decreasing',
    });
  });
  it('uses half the x spacing and "about" for an interpolated crossing', () => {
    const qs = generateQuestions(temperature);
    const zero = qs[1] as NumberQuestion;
    expect(zero.prompt).toBe('At what time does the temperature first reach zero?');
    expect(zero.answer).toBe(7.6);
    expect(zero.tolerance).toBe(1);
    expect(zero.explanation).toContain('about 7.6 h');
    expect(qs[0].prompt).toBe('What is the temperature when the time is 12 h?');
    expect(qs[2]).toMatchObject({
      prompt: 'Between 0 and 4 h, is the temperature increasing, decreasing, or staying the same?',
      answer: 'Decreasing',
    });
  });
  it('asks for the highest value when there is no zero crossing', () => {
    const qs = generateQuestions(population);
    expect(qs).toHaveLength(3);
    expect(qs[1].prompt).toBe('At what time is the dish A highest?');
    expect((qs[1] as NumberQuestion).answer).toBe(10);
    expect(qs[2]).toMatchObject({ answer: 'Increasing' });
  });
  it('is deterministic', () => {
    for (const s of samples) expect(generateQuestions(s.worksheet)).toEqual(generateQuestions(s.worksheet));
  });
  it('produces valid questions that accept their own answers, for every sample', () => {
    for (const s of samples) {
      const qs = generateQuestions(s.worksheet);
      expect(qs.length).toBeGreaterThan(0);
      expect(qs.length).toBeLessThanOrEqual(3);
      expect(validateWorksheet({ ...s.worksheet, questions: qs })).toEqual([]);
      for (const q of qs) {
        const r = checkAnswer(q, String(q.answer));
        expect(r.correct, q.prompt).toBe(true);
        expect(r.understood).toBe(true);
        expect(r.feedback.startsWith('Correct. ')).toBe(true);
        expect(q.explanation).toMatch(/graph|table|arrow/i);
      }
    }
  });
  it('picks trend points inside one segment', () => {
    const qs = generateQuestions(sheet([0, 2, 4, 3, 1]));
    const trend = qs[qs.length - 1] as ChoiceQuestion;
    expect(trend.prompt).toBe('Between 0 and 2 s, is the height increasing, decreasing, or staying the same?');
    expect(trend.answer).toBe('Increasing');
  });
  it('handles a flat series', () => {
    const qs = generateQuestions(sheet([5, 5, 5, 5]));
    expect(qs.map((q) => q.kind)).toEqual(['number', 'choice']);
    expect(qs[1]).toMatchObject({ answer: 'Staying the same' });
    expect((qs[0] as NumberQuestion).tolerance).toBe(1e-9);
    expect(validateWorksheet({ ...sheet([5, 5, 5, 5]), questions: qs })).toEqual([]);
  });
  it('skips the highest-value question when the highest value is tied', () => {
    const qs = generateQuestions(sheet([1, 3, 1, 3, 2]));
    expect(qs.map((q) => q.prompt.slice(0, 7))).toEqual(['What is', 'Between']);
  });
  it('handles two points and an all-zero series', () => {
    const two = generateQuestions(sheet([1, 3]));
    expect(validateWorksheet({ ...sheet([1, 3]), questions: two })).toEqual([]);
    for (const q of two) expect(checkAnswer(q, String(q.answer)).correct).toBe(true);
    const zeros = generateQuestions(sheet([0, 0, 0]));
    expect(zeros.some((q) => q.prompt.includes('reach zero'))).toBe(false);
  });
  it('returns nothing for a worksheet it cannot use', () => {
    expect(generateQuestions(sheet([1]))).toEqual([]);
    expect(generateQuestions({ ...cart, series: [] })).toEqual([]);
    expect(generateQuestions(null as unknown as Worksheet)).toEqual([]);
  });
  it('keeps prompts and explanations within the caps for the longest labels', () => {
    const w: Worksheet = {
      title: 'T',
      x: { label: 'L'.repeat(40), unit: 'u'.repeat(20), values: [0.123456, 1000000.123456, 2000000.5] },
      series: [{ label: 'M'.repeat(40), unit: 'v'.repeat(20), values: [-123456.789, 123456.789, 999999.999] }],
      questions: [],
    };
    const qs = generateQuestions(w);
    expect(qs).toHaveLength(3);
    for (const q of qs) {
      expect(q.prompt.length).toBeLessThanOrEqual(MAX_PROMPT_LENGTH);
      expect(q.explanation.length).toBeLessThanOrEqual(MAX_EXPLANATION_LENGTH);
    }
    expect(validateWorksheet({ ...w, questions: qs })).toEqual([]);
  });
});
