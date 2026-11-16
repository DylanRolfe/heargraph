'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Sonifier, audioSupported, valueToFrequency, type TonePoint } from '@/lib/audio';
import { analyzeSeries, describePoint, describeSeries, formatNumber, pointTags } from '@/lib/describe';
import { PITCH_RANGES, SWEEP_STEP_SECONDS } from '@/lib/settings';
import type { Worksheet } from '@/lib/types';
import { GraphSvg } from './GraphSvg';
import { useSettings } from './SettingsProvider';

function withUnit(value: number, unit: string): string {
  return unit ? `${formatNumber(value)} ${unit}` : formatNumber(value);
}

export function GraphExplorer({ worksheet }: { worksheet: Worksheet }) {
  const { settings, update } = useSettings();
  const n = worksheet.x.values.length;
  const seriesCount = worksheet.series.length;

  const [series, setSeries] = useState(0);
  const [index, setIndex] = useState(0);
  const [sweepIndex, setSweepIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState('');
  const [flip, setFlip] = useState(false);
  const [width, setWidth] = useState(640);

  const boxRef = useRef<HTMLDivElement>(null);
  const sonifierRef = useRef<Sonifier | null>(null);
  const helpId = useId();

  const analyses = useMemo(
    () => worksheet.series.map((s) => analyzeSeries(worksheet.x.values, s.values)),
    [worksheet],
  );

  const yRange = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const s of worksheet.series) {
      for (const v of s.values) {
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
    }
    return { lo, hi };
  }, [worksheet]);

  // Start again from the first point when a different worksheet is shown.
  useEffect(() => {
    setSeries(0);
    setIndex(0);
    setSweepIndex(null);
    setMessage('');
  }, [worksheet]);

  // Draw at the real pixel width so axis text never shrinks on small screens.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(260, Math.floor(el.clientWidth)));
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      sonifierRef.current?.dispose();
      sonifierRef.current = null;
    };
  }, []);

  const getSonifier = useCallback(() => {
    if (!sonifierRef.current) sonifierRef.current = new Sonifier();
    return sonifierRef.current;
  }, []);

  const tonePoint = useCallback(
    (si: number, i: number): TonePoint => {
      const range = PITCH_RANGES[settings.pitchRange];
      return {
        frequency: valueToFrequency(worksheet.series[si].values[i], yRange.lo, yRange.hi, range.lowHz, range.highHz),
        tags: pointTags(analyses[si], i),
      };
    },
    [analyses, settings.pitchRange, worksheet, yRange],
  );

  /** Writes to the live region. The flip makes a repeated message get announced again. */
  const say = useCallback((text: string) => {
    setMessage(text);
    setFlip((f) => !f);
  }, []);

  const pointText = useCallback(
    (si: number, i: number) => `${describePoint(worksheet, si, i)} Point ${i + 1} of ${n}.`,
    [n, worksheet],
  );

  const stopSweep = useCallback(() => {
    sonifierRef.current?.stop();
  }, []);

  const goTo = useCallback(
    (si: number, i: number, prefix = '') => {
      if (playing) stopSweep();
      const clamped = Math.min(n - 1, Math.max(0, i));
      setSeries(si);
      setIndex(clamped);
      say(prefix + pointText(si, clamped));
      if (settings.audio) getSonifier().playPoint(tonePoint(si, clamped), si === 0 ? 'sine' : 'triangle');
    },
    [getSonifier, n, playing, pointText, say, settings.audio, stopSweep, tonePoint],
  );

  const move = useCallback(
    (delta: number) => {
      const target = index + delta;
      if (target < 0) goTo(series, 0, 'First point. ');
      else if (target > n - 1) goTo(series, n - 1, 'Last point. ');
      else goTo(series, target);
    },
    [goTo, index, n, series],
  );

  const switchSeries = useCallback(() => {
    if (seriesCount < 2) {
      say('This graph has one line.');
      return;
    }
    const next = (series + 1) % seriesCount;
    goTo(next, index, `Line ${next + 1} of ${seriesCount}, ${worksheet.series[next].label}. `);
  }, [goTo, index, say, series, seriesCount, worksheet]);

  const toggleSweep = useCallback(() => {
    if (playing) {
      stopSweep();
      say(`Stopped. ${pointText(series, index)}`);
      return;
    }
    if (!settings.audio) {
      say('Sound is off. Use the Turn sound on button below the graph, or the Settings page, to turn it on.');
      return;
    }
    if (!audioSupported()) {
      say('This browser cannot play sound. The description and data table have the same information.');
      return;
    }
    const points = worksheet.series[series].values.map((_, i) => tonePoint(series, i));
    const label = worksheet.series[series].label;
    say(`Playing ${label} as sound, from first point to last. Higher pitch means a higher value.`);
    setPlaying(true);
    getSonifier().playSweep(
      points,
      SWEEP_STEP_SECONDS[settings.sweepSpeed],
      series === 0 ? 'sine' : 'triangle',
      (i) => setSweepIndex(i),
      (finished) => {
        setPlaying(false);
        setSweepIndex(null);
        if (finished) say(`Finished playing. ${pointText(series, index)}`);
      },
    );
  }, [getSonifier, index, playing, pointText, say, series, settings.audio, settings.sweepSpeed, stopSweep, tonePoint, worksheet]);

  const jumpToZero = useCallback(() => {
    const crossings = analyses[series].zeroCrossings;
    if (crossings.length === 0) {
      say(`${worksheet.series[series].label} does not cross zero.`);
      return;
    }
    const next = crossings.find((c) => c.index > index) ?? crossings[0];
    if (next.exact) {
      goTo(series, next.index);
    } else {
      goTo(
        series,
        next.index,
        `Crosses zero at about ${withUnit(Number(next.x.toPrecision(3)), worksheet.x.unit)}, between this point and the next. `,
      );
    }
  }, [analyses, goTo, index, say, series, worksheet]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    let handled = true;
    switch (e.key) {
      case 'ArrowRight':
        move(1);
        break;
      case 'ArrowLeft':
        move(-1);
        break;
      case 'Home':
        goTo(series, 0);
        break;
      case 'End':
        goTo(series, n - 1);
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        switchSeries();
        break;
      case ' ':
      case 'Spacebar':
        toggleSweep();
        break;
      case 'Escape':
        if (playing) {
          stopSweep();
          say(`Stopped. ${pointText(series, index)}`);
        } else handled = false;
        break;
      case 'm':
      case 'M':
        goTo(series, analyses[series].max.index);
        break;
      case 'n':
      case 'N':
        goTo(series, analyses[series].min.index);
        break;
      case 'z':
      case 'Z':
        jumpToZero();
        break;
      case 's':
      case 'S':
        if (playing) stopSweep();
        say(describeSeries(worksheet, series));
        break;
      default:
        handled = false;
    }
    if (handled) e.preventDefault();
  };

  const height = Math.round(Math.min(420, Math.max(240, width * 0.6)));
  const shownIndex = sweepIndex ?? index;
  const readout = message || pointText(series, index);

  return (
    <div className="explorer">
      <p id={helpId} className="explorer-help">
        Keys, when the graph has focus: <kbd>Left</kbd> and <kbd>Right</kbd> arrows move between points.{' '}
        <kbd>Home</kbd> and <kbd>End</kbd> jump to the first and last point. <kbd>Space</kbd> plays the graph as
        sound, or stops it. <kbd>M</kbd> goes to the highest value, <kbd>N</kbd> to the lowest, <kbd>Z</kbd> to
        where the line crosses zero. <kbd>S</kbd> reads the summary.
        {seriesCount > 1 ? (
          <>
            {' '}
            <kbd>Up</kbd> or <kbd>Down</kbd> arrow switches between the two lines.
          </>
        ) : null}
      </p>

      <div
        ref={boxRef}
        className="graph-box"
        role="application"
        tabIndex={0}
        aria-label={`Graph: ${worksheet.title}`}
        aria-describedby={helpId}
        onKeyDown={onKeyDown}
        data-testid="graph"
      >
        <GraphSvg
          worksheet={worksheet}
          width={width}
          height={height}
          active={{ series, index: shownIndex }}
          onPointClick={(si, i) => goTo(si, i)}
        />
      </div>

      <p className="readout" role="status" aria-live="polite" aria-atomic="true" data-testid="readout">
        {readout}
        {flip ? ' ' : ''}
      </p>

      <div className="button-row" role="group" aria-label="Graph controls">
        <button type="button" onClick={() => move(-1)}>
          Previous point
        </button>
        <button type="button" onClick={() => move(1)}>
          Next point
        </button>
        <button type="button" onClick={toggleSweep}>
          {playing ? 'Stop sound' : 'Play graph as sound'}
        </button>
        {seriesCount > 1 ? (
          <button type="button" onClick={switchSeries}>
            Switch line (now: {worksheet.series[series].label})
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            if (settings.audio) stopSweep();
            update({ audio: !settings.audio });
          }}
        >
          {settings.audio ? 'Turn sound off' : 'Turn sound on'}
        </button>
      </div>
      <p className="hint">
        Sound cues: one click means the value is zero, two high ticks mark the highest value, two low ticks mark the
        lowest value. The same information is always in the text above.
      </p>
    </div>
  );
}
