import type { Page } from '@playwright/test';
import { test, expect, hydrated, SETTINGS_KEY } from './fixtures';

const REFLOW_PAGES = ['/', '/student/?sample=cart', '/student/?sample=population', '/teacher/', '/settings/', '/about/'];

async function overflow(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const wide: string[] = [];
    if (doc.scrollWidth > doc.clientWidth) {
      // Name the elements that stick out past the viewport (to help find the cause).
      for (const el of Array.from(document.querySelectorAll('body *'))) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.right > doc.clientWidth + 1) {
          wide.push(`${el.tagName.toLowerCase()}.${String(el.getAttribute('class') ?? '')} right=${Math.round(r.right)}`);
        }
      }
    }
    return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, wide: wide.slice(-6) };
  });
}

async function expectNoHorizontalScroll(page: Page, label: string) {
  const o = await overflow(page);
  expect(o.scrollWidth, `${label}: scrollWidth ${o.scrollWidth} > clientWidth ${o.clientWidth}; ${o.wide.join('; ')}`)
    .toBeLessThanOrEqual(o.clientWidth);
}

test.describe('11. Reflow', () => {
  for (const url of REFLOW_PAGES) {
    test(`320x640: no horizontal page scroll on ${url}`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(url);
      await hydrated(page);
      if (url.startsWith('/student/')) await expect(page.getByTestId('graph')).toBeVisible();
      expect(await page.evaluate(() => window.innerWidth)).toBe(320);
      await expectNoHorizontalScroll(page, url);
    });
  }

  // Extra to the brief: the app's own "Large text" setting at 320 px.
  // '/teacher/' fails at the time of writing: see docs/QA_REPORT.md, bug 1.
  for (const url of REFLOW_PAGES) {
    test(`320x640 + large text: no horizontal page scroll on ${url}`, async ({ page }) => {
      await page.addInitScript(
        ([key, value]) => localStorage.setItem(key, value),
        [SETTINGS_KEY, JSON.stringify({ largeText: true })] as const,
      );
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(url);
      await hydrated(page);
      await expect(page.locator('html')).toHaveAttribute('data-text', 'large');
      await expectNoHorizontalScroll(page, `${url} (large text)`);
    });
  }

  test('320x640: teacher page with a created link and with errors does not scroll sideways', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/teacher/');
    await hydrated(page);
    await page.getByRole('button', { name: 'Create link' }).click();
    await expect(page.getByTestId('form-errors')).toBeVisible();
    await expectNoHorizontalScroll(page, 'teacher with errors');
    await page.getByRole('button', { name: 'Fill the form with example data' }).click();
    await page.getByRole('button', { name: 'Create link' }).click();
    await expect(page.getByTestId('share-link')).toBeVisible();
    await expectNoHorizontalScroll(page, 'teacher with link');
  });

  test('200% zoom emulation (640x400 CSS px, deviceScaleFactor 2): student page', async ({
    browser,
    baseURL,
    problems,
  }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 640, height: 400 },
      deviceScaleFactor: 2,
    });
    problems.track(context);
    const page = await context.newPage();
    for (const url of ['/student/?sample=cart', '/student/?sample=population']) {
      await page.goto(url);
      await hydrated(page);
      await expect(page.getByTestId('graph')).toBeVisible();
      expect(await page.evaluate(() => [window.innerWidth, window.devicePixelRatio])).toEqual([640, 2]);
      await expectNoHorizontalScroll(page, `${url} at 200%`);
      // The graph is still usable at this size.
      await page.getByTestId('graph').focus();
      await page.keyboard.press('ArrowRight');
      await expect(page.getByTestId('readout')).toContainText('Point 2 of');
    }
    await context.close();
  });
});

test.describe('12. Focus visibility', () => {
  for (const url of ['/', '/student/?sample=cart', '/student/?sample=population']) {
    test(`every Tab stop on ${url} has a visible focus indicator`, async ({ page }, testInfo) => {
      await page.goto(url);
      await hydrated(page);
      if (url.startsWith('/student/')) await expect(page.getByTestId('graph')).toBeVisible();

      const seen: string[] = [];
      const missing: string[] = [];
      for (let i = 0; i < 80; i++) {
        await page.keyboard.press('Tab');
        const info = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body || el === document.documentElement) return null;
          const cs = getComputedStyle(el);
          const outline = cs.outlineStyle !== 'none' ? parseFloat(cs.outlineWidth) : 0;
          const rect = el.getBoundingClientRect();
          const labelText =
            el instanceof HTMLInputElement && el.labels && el.labels[0] ? el.labels[0].innerText : '';
          return {
            key: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}[${(
              el.getAttribute('aria-label') ||
              labelText ||
              el.innerText ||
              ''
            )
              .trim()
              .slice(0, 50)}]`,
            outline,
            boxShadow: cs.boxShadow,
            visible: rect.width > 0 && rect.height > 0,
          };
        });
        if (info === null) break; // focus left the page: end of the tab order
        if (seen.length > 0 && info.key === seen[0]) break; // wrapped around to the skip link
        seen.push(info.key);
        const hasIndicator = info.outline > 0 || (info.boxShadow !== 'none' && info.boxShadow !== '');
        if (!hasIndicator || !info.visible) {
          missing.push(`${info.key} outline=${info.outline}px box-shadow=${info.boxShadow} visible=${info.visible}`);
        }
      }
      testInfo.annotations.push({ type: 'tab-stops', description: `${seen.length}: ${seen.join(' > ')}` });
      // Sanity: the walk really covered the page.
      expect(seen.length).toBeGreaterThanOrEqual(url === '/' ? 9 : 22);
      expect(seen[0]).toContain('Skip to main content');
      expect(missing, `Tab stops without a visible focus indicator:\n${missing.join('\n')}`).toEqual([]);
    });
  }
});
