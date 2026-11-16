'use client';

import { useEffect, useRef, useState } from 'react';
import { useSettings } from '@/components/SettingsProvider';
import { Sonifier, audioSupported, type TonePoint } from '@/lib/audio';
import {
  PITCH_RANGES,
  SWEEP_LABELS,
  SWEEP_STEP_SECONDS,
  type PitchRange,
  type SweepSpeed,
} from '@/lib/settings';

export function SettingsForm() {
  const { settings, ready, update, reset } = useSettings();
  const [status, setStatus] = useState('');
  const sonifier = useRef<Sonifier | null>(null);

  useEffect(() => {
    return () => {
      sonifier.current?.dispose();
      sonifier.current = null;
    };
  }, []);

  const testSound = () => {
    if (!settings.audio) {
      setStatus('Sound is off. Turn it on first.');
      return;
    }
    if (!audioSupported()) {
      setStatus('This browser cannot play sound.');
      return;
    }
    if (!sonifier.current) sonifier.current = new Sonifier();
    const { lowHz, highHz } = PITCH_RANGES[settings.pitchRange];
    const points: TonePoint[] = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
      frequency: lowHz * Math.pow(highHz / lowHz, t),
      tags: [],
    }));
    setStatus('Playing five test tones, from the lowest pitch to the highest.');
    sonifier.current.playSweep(
      points,
      SWEEP_STEP_SECONDS[settings.sweepSpeed],
      'sine',
      () => undefined,
      (finished) => {
        if (finished) setStatus('Test finished.');
      },
    );
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} aria-busy={!ready}>
      <fieldset>
        <legend>Sound</legend>
        <div className="choice">
          <input
            id="set-audio"
            type="checkbox"
            checked={settings.audio}
            onChange={(e) => update({ audio: e.target.checked })}
          />
          <label htmlFor="set-audio">Play sound when I explore a graph</label>
        </div>
        <p className="hint">Sound never starts by itself. It only plays when you press a key or a button.</p>

        <div className="field">
          <label htmlFor="set-pitch">Pitch range</label>
          <select
            id="set-pitch"
            value={settings.pitchRange}
            onChange={(e) => update({ pitchRange: e.target.value as PitchRange })}
          >
            {(Object.keys(PITCH_RANGES) as PitchRange[]).map((key) => (
              <option key={key} value={key}>
                {PITCH_RANGES[key].label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="set-speed">Speed when playing the whole graph</label>
          <select
            id="set-speed"
            value={settings.sweepSpeed}
            onChange={(e) => update({ sweepSpeed: e.target.value as SweepSpeed })}
          >
            {(Object.keys(SWEEP_LABELS) as SweepSpeed[]).map((key) => (
              <option key={key} value={key}>
                {SWEEP_LABELS[key]} ({SWEEP_STEP_SECONDS[key]} seconds per point)
              </option>
            ))}
          </select>
        </div>

        <p>
          <button type="button" className="secondary" onClick={testSound}>
            Play test tones
          </button>
        </p>
        <p role="status" aria-live="polite" aria-atomic="true">
          {status}
        </p>
      </fieldset>

      <fieldset>
        <legend>Display</legend>
        <div className="choice">
          <input
            id="set-contrast"
            type="checkbox"
            checked={settings.highContrast}
            onChange={(e) => update({ highContrast: e.target.checked })}
          />
          <label htmlFor="set-contrast">High contrast (white on black)</label>
        </div>
        <div className="choice">
          <input
            id="set-text"
            type="checkbox"
            checked={settings.largeText}
            onChange={(e) => update({ largeText: e.target.checked })}
          />
          <label htmlFor="set-text">Large text</label>
        </div>
        <div className="choice">
          <input
            id="set-motion"
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(e) => update({ reducedMotion: e.target.checked })}
          />
          <label htmlFor="set-motion">Reduce motion (no smooth scrolling or animated highlights)</label>
        </div>
        <p className="hint">
          On a first visit HearGraph follows your device&rsquo;s own increased-contrast, reduced-motion and
          forced-colours settings.
        </p>
      </fieldset>

      <p>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            reset();
            setStatus('Settings were reset.');
          }}
        >
          Reset all settings
        </button>
      </p>
    </form>
  );
}
