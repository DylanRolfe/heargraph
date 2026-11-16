/** User settings. Stored in localStorage only; never sent anywhere. */

export type PitchRange = 'narrow' | 'standard' | 'wide';
export type SweepSpeed = 'slow' | 'medium' | 'fast';

export interface Settings {
  audio: boolean;
  pitchRange: PitchRange;
  sweepSpeed: SweepSpeed;
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  audio: true,
  pitchRange: 'standard',
  sweepSpeed: 'medium',
  highContrast: false,
  largeText: false,
  reducedMotion: false,
};

export const STORAGE_KEY = 'heargraph-settings-v1';

/** Lowest and highest tone, in hertz, for each pitch range. */
export const PITCH_RANGES: Record<PitchRange, { lowHz: number; highHz: number; label: string }> = {
  narrow: { lowHz: 262, highHz: 523, label: 'Narrow (one octave, 262 to 523 Hz)' },
  standard: { lowHz: 220, highHz: 880, label: 'Standard (two octaves, 220 to 880 Hz)' },
  wide: { lowHz: 131, highHz: 1047, label: 'Wide (three octaves, 131 to 1047 Hz)' },
};

/** Seconds between points in a sweep. */
export const SWEEP_STEP_SECONDS: Record<SweepSpeed, number> = {
  slow: 0.9,
  medium: 0.45,
  fast: 0.22,
};

export const SWEEP_LABELS: Record<SweepSpeed, string> = {
  slow: 'Slow',
  medium: 'Medium',
  fast: 'Fast',
};

/** Accepts anything (e.g. parsed JSON from storage) and returns valid settings. */
export function sanitizeSettings(raw: unknown): Settings {
  const out: Settings = { ...DEFAULT_SETTINGS };
  if (typeof raw !== 'object' || raw === null) return out;
  const r = raw as Record<string, unknown>;
  if (typeof r.audio === 'boolean') out.audio = r.audio;
  if (r.pitchRange === 'narrow' || r.pitchRange === 'standard' || r.pitchRange === 'wide') {
    out.pitchRange = r.pitchRange;
  }
  if (r.sweepSpeed === 'slow' || r.sweepSpeed === 'medium' || r.sweepSpeed === 'fast') {
    out.sweepSpeed = r.sweepSpeed;
  }
  if (typeof r.highContrast === 'boolean') out.highContrast = r.highContrast;
  if (typeof r.largeText === 'boolean') out.largeText = r.largeText;
  if (typeof r.reducedMotion === 'boolean') out.reducedMotion = r.reducedMotion;
  return out;
}

export function loadSettings(): Settings {
  try {
    const text = window.localStorage.getItem(STORAGE_KEY);
    return text ? sanitizeSettings(JSON.parse(text)) : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: Settings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // Storage can be blocked (private mode). Settings then last for this visit only.
  }
}

export function applySettingsToDocument(s: Settings): void {
  const el = document.documentElement;
  el.dataset.contrast = s.highContrast ? 'high' : 'normal';
  el.dataset.text = s.largeText ? 'large' : 'normal';
  el.dataset.motion = s.reducedMotion ? 'reduced' : 'normal';
}

/**
 * Inline script run before first paint so the saved theme is applied without a flash.
 * Kept tiny and defensive; it must never throw.
 */
export const SETTINGS_BOOT_SCRIPT = `try{var s=JSON.parse(localStorage.getItem('${STORAGE_KEY}')||'{}'),d=document.documentElement;d.dataset.contrast=s.highContrast===true?'high':'normal';d.dataset.text=s.largeText===true?'large':'normal';d.dataset.motion=s.reducedMotion===true?'reduced':'normal'}catch(e){}`;
