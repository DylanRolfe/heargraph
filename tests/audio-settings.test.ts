import { describe, expect, it } from 'vitest';
import { valueToFrequency } from '@/lib/audio';
import { DEFAULT_SETTINGS, sanitizeSettings } from '@/lib/settings';
import { niceTicks, yDomain } from '@/components/GraphSvg';
import { getSample } from '@/lib/samples';

describe('valueToFrequency', () => {
  it('maps the ends of the range to the low and high notes', () => {
    expect(valueToFrequency(-6, -6, 6, 220, 880)).toBeCloseTo(220);
    expect(valueToFrequency(6, -6, 6, 220, 880)).toBeCloseTo(880);
  });
  it('puts the middle value one octave up in a two-octave range', () => {
    expect(valueToFrequency(0, -6, 6, 220, 880)).toBeCloseTo(440);
  });
  it('clamps values outside the range', () => {
    expect(valueToFrequency(100, 0, 10, 220, 880)).toBeCloseTo(880);
    expect(valueToFrequency(-100, 0, 10, 220, 880)).toBeCloseTo(220);
  });
  it('uses the middle of the range for flat data and survives bad input', () => {
    expect(valueToFrequency(5, 5, 5, 220, 880)).toBeCloseTo(440);
    expect(valueToFrequency(NaN, 0, 1, 220, 880)).toBe(220);
  });
});

describe('sanitizeSettings', () => {
  it('returns defaults for junk', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings('x')).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings({ audio: 'yes', pitchRange: 'huge', sweepSpeed: 3 })).toEqual(DEFAULT_SETTINGS);
  });
  it('keeps valid values', () => {
    const s = sanitizeSettings({ audio: false, pitchRange: 'wide', sweepSpeed: 'slow', highContrast: true });
    expect(s).toMatchObject({ audio: false, pitchRange: 'wide', sweepSpeed: 'slow', highContrast: true, largeText: false });
  });
});

describe('graph scales', () => {
  it('makes round ticks', () => {
    expect(niceTicks(0, 8, 8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(niceTicks(-6, 6, 6)).toEqual([-6, -4, -2, 0, 2, 4, 6]);
    expect(niceTicks(3, 3, 5)).toEqual([3]);
  });
  it('covers all the data for every sample', () => {
    for (const id of ['cart', 'temperature', 'population']) {
      const w = getSample(id)!.worksheet;
      const d = yDomain(w);
      for (const s of w.series) for (const v of s.values) {
        expect(v).toBeGreaterThanOrEqual(d.min);
        expect(v).toBeLessThanOrEqual(d.max);
      }
      expect(d.ticks.length).toBeGreaterThan(2);
    }
  });
});
