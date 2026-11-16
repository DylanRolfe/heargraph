import { test as base, expect, type BrowserContext, type Page } from '@playwright/test';

/**
 * Shared fixture: every test fails if the page logs a `console.error` or throws
 * an uncaught error. Nothing is ignored by default.
 *
 * The only exception is opt-in, per test: the offline spec passes
 * `allowOfflineNetworkNoise` (see offline.spec.ts for why).
 */
export interface Problems {
  list: string[];
  /** Start watching an extra context (for tests that create their own). */
  track: (context: BrowserContext) => void;
  /** Patterns of console errors this test accepts. Must be documented where used. */
  allow: (pattern: RegExp) => void;
}

export const test = base.extend<{ problems: Problems }>({
  problems: [
    async ({ context }, use) => {
      const list: string[] = [];
      const allowed: RegExp[] = [];
      const track = (ctx: BrowserContext) => {
        ctx.on('console', (msg) => {
          if (msg.type() === 'error') list.push(`console.error: ${msg.text()} (${msg.location().url})`);
        });
        ctx.on('weberror', (err) => list.push(`uncaught: ${err.error().message}`));
      };
      track(context);
      await use({ list, track, allow: (p) => allowed.push(p) });
      const real = list.filter((m) => !allowed.some((p) => p.test(m)));
      expect(real, 'console errors / uncaught page errors during the test').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export const SETTINGS_KEY = 'heargraph-settings-v1';

/** Waits until React has hydrated the page, so clicks and key presses reach the app. */
export async function hydrated(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const el = document.querySelector('main h1');
    return !!el && Object.keys(el).some((k) => k.startsWith('__react'));
  });
}

export async function gotoReady(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await hydrated(page);
}

/** Counts `new AudioContext()` calls. Must be called before the page loads. */
export async function countAudioContexts(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__audioContextCount = 0;
    for (const name of ['AudioContext', 'webkitAudioContext']) {
      const Original = w[name] as (new (...args: unknown[]) => object) | undefined;
      if (typeof Original !== 'function') continue;
      w[name] = new Proxy(Original, {
        construct(target, args) {
          (w.__audioContextCount as number)++;
          return new target(...args);
        },
      });
    }
  });
}

export function audioContextCount(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __audioContextCount: number }).__audioContextCount);
}

/** Same compact format as lib/share.ts (docs/PLAN.md "URL schema"): "v1." + base64url(JSON). */
export function encodeShare(payload: unknown): string {
  return 'v1.' + Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export const SHARED_PAYLOAD = {
  t: 'Shared test graph',
  x: ['Time', 's'],
  s: [['Height', 'm']],
  d: [
    [0, 1],
    [1, 3],
    [2, 2],
    [3, -1],
  ],
};
