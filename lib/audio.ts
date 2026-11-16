/**
 * Sonification with the Web Audio API. No audio is created or played until a
 * user action calls one of the play methods.
 */

import type { PointTag } from './types';

/**
 * Maps a value onto a frequency. Linear in value, logarithmic in frequency,
 * so equal steps in the data sound like equal steps in pitch.
 */
export function valueToFrequency(
  value: number,
  min: number,
  max: number,
  lowHz: number,
  highHz: number,
): number {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) return lowHz;
  if (max <= min) return Math.sqrt(lowHz * highHz); // flat data: middle of the range
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  return lowHz * Math.pow(highHz / lowHz, t);
}

export interface TonePoint {
  frequency: number;
  tags: PointTag[];
}

export type Wave = 'sine' | 'triangle';

const PEAK_GAIN = 0.2;
const ATTACK = 0.015;
const RELEASE = 0.06;

type AudioContextCtor = typeof AudioContext;

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

export function audioSupported(): boolean {
  return getAudioContextCtor() !== null;
}

export class Sonifier {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timers: number[] = [];
  private playing = false;

  private ensure(): { ctx: AudioContext; master: GainNode } | null {
    if (!this.ctx) {
      const Ctor = getAudioContextCtor();
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    if (!this.master) {
      this.master = this.ctx.createGain();
      this.master.gain.value = 1;
      this.master.connect(this.ctx.destination);
    }
    return { ctx: this.ctx, master: this.master };
  }

  private tone(
    ctx: AudioContext,
    out: AudioNode,
    frequency: number,
    start: number,
    duration: number,
    wave: OscillatorType,
    peak: number,
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.value = frequency;
    const end = start + duration;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + ATTACK);
    gain.gain.setValueAtTime(peak, Math.max(start + ATTACK, end - RELEASE));
    gain.gain.linearRampToValueAtTime(0, end);
    osc.connect(gain);
    gain.connect(out);
    osc.start(start);
    osc.stop(end + 0.02);
  }

  /** Short marker sounds. Each also has a text tag in the announcement. */
  private ticks(ctx: AudioContext, out: AudioNode, tags: PointTag[], start: number): void {
    let t = start;
    for (const tag of tags) {
      if (tag === 'zero') {
        // one short, dry click
        this.tone(ctx, out, 1400, t, 0.05, 'square', 0.07);
        t += 0.07;
      } else if (tag === 'maximum') {
        // two quick high ticks
        this.tone(ctx, out, 1900, t, 0.045, 'triangle', 0.14);
        this.tone(ctx, out, 1900, t + 0.07, 0.045, 'triangle', 0.14);
        t += 0.14;
      } else if (tag === 'minimum') {
        // two quick low ticks
        this.tone(ctx, out, 150, t, 0.05, 'square', 0.08);
        this.tone(ctx, out, 150, t + 0.08, 0.05, 'square', 0.08);
        t += 0.16;
      }
    }
  }

  /** Plays one point: a tone, then any marker ticks. Stops a running sweep first. */
  playPoint(point: TonePoint, wave: Wave = 'sine'): void {
    this.stop();
    const a = this.ensure();
    if (!a) return;
    const now = a.ctx.currentTime + 0.01;
    this.tone(a.ctx, a.master, point.frequency, now, 0.2, wave, PEAK_GAIN);
    this.ticks(a.ctx, a.master, point.tags, now + 0.21);
  }

  /**
   * Plays every point in order. `onStep(i)` fires as each point starts so the
   * display can follow; `onDone(finished)` fires once at the end or on stop.
   */
  playSweep(
    points: TonePoint[],
    stepSeconds: number,
    wave: Wave,
    onStep: (index: number) => void,
    onDone: (finished: boolean) => void,
  ): void {
    this.stop();
    const a = this.ensure();
    if (!a || points.length === 0) {
      onDone(false);
      return;
    }
    // A fresh gain node per sweep, so stop() can silence everything scheduled.
    const sweepOut = a.ctx.createGain();
    sweepOut.gain.value = 1;
    sweepOut.connect(a.master);
    this.playing = true;
    const start = a.ctx.currentTime + 0.05;
    const toneLength = Math.max(0.12, stepSeconds * 0.8);
    points.forEach((p, i) => {
      const t = start + i * stepSeconds;
      this.tone(a.ctx, sweepOut, p.frequency, t, toneLength, wave, PEAK_GAIN);
      this.ticks(a.ctx, sweepOut, p.tags, t + Math.min(toneLength, 0.1));
      this.timers.push(window.setTimeout(() => onStep(i), (0.05 + i * stepSeconds) * 1000));
    });
    const total = (0.05 + (points.length - 1) * stepSeconds + toneLength + 0.3) * 1000;
    this.timers.push(
      window.setTimeout(() => {
        this.playing = false;
        this.timers = [];
        this.stopFn = null;
        sweepOut.disconnect();
        onDone(true);
      }, total),
    );
    this.stopFn = () => {
      try {
        sweepOut.gain.setValueAtTime(0, a.ctx.currentTime);
        sweepOut.disconnect();
      } catch {
        // already disconnected
      }
      onDone(false);
    };
  }

  private stopFn: (() => void) | null = null;

  isPlaying(): boolean {
    return this.playing;
  }

  /** Stops a running sweep immediately. Safe to call at any time. */
  stop(): void {
    for (const id of this.timers) window.clearTimeout(id);
    this.timers = [];
    this.playing = false;
    const fn = this.stopFn;
    this.stopFn = null;
    if (fn) fn();
  }

  dispose(): void {
    this.stop();
    if (this.ctx) void this.ctx.close().catch(() => undefined);
    this.ctx = null;
    this.master = null;
  }
}
