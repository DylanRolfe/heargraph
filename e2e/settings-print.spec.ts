import { readFileSync } from 'node:fs';
import { test, expect, gotoReady, hydrated, countAudioContexts, audioContextCount, SETTINGS_KEY } from './fixtures';

test.describe('8. Settings', () => {
  test('high contrast sets html[data-contrast=high] and persists after reload', async ({ page }) => {
    await gotoReady(page, '/settings/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-contrast', 'normal');
    const box = page.getByLabel(/^High contrast/);
    await box.focus();
    await page.keyboard.press('Space');
    await expect(box).toBeChecked();
    await expect(html).toHaveAttribute('data-contrast', 'high');

    await page.reload();
    await hydrated(page);
    await expect(html).toHaveAttribute('data-contrast', 'high');
    await expect(page.getByLabel(/^High contrast/)).toBeChecked();

    // It also applies on other pages.
    await gotoReady(page, '/student/?sample=cart');
    await expect(html).toHaveAttribute('data-contrast', 'high');
  });

  test('large text sets data-text=large, makes text bigger, and persists', async ({ page }) => {
    await gotoReady(page, '/settings/');
    const html = page.locator('html');
    const size = () => page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('main p')!).fontSize));
    const before = await size();
    await page.getByLabel('Large text').check();
    await expect(html).toHaveAttribute('data-text', 'large');
    expect(await size()).toBeGreaterThan(before);
    await page.reload();
    await hydrated(page);
    await expect(html).toHaveAttribute('data-text', 'large');
    await expect(page.getByLabel('Large text')).toBeChecked();
  });

  test('reduce motion sets data-motion=reduced', async ({ page }) => {
    await gotoReady(page, '/settings/');
    await page.getByLabel(/^Reduce motion/).check();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  });

  test('reset restores defaults', async ({ page }) => {
    await gotoReady(page, '/settings/');
    const html = page.locator('html');
    await page.getByLabel(/^High contrast/).check();
    await page.getByLabel('Large text').check();
    await page.getByLabel(/^Reduce motion/).check();
    await page.getByLabel('Play sound when I explore a graph').uncheck();
    await page.getByLabel('Pitch range').selectOption('wide');
    await page.getByLabel('Speed when playing the whole graph').selectOption('fast');
    await expect(html).toHaveAttribute('data-contrast', 'high');

    await page.getByRole('button', { name: 'Reset all settings' }).click();
    await expect(html).toHaveAttribute('data-contrast', 'normal');
    await expect(html).toHaveAttribute('data-text', 'normal');
    await expect(html).toHaveAttribute('data-motion', 'normal');
    await expect(page.getByLabel(/^High contrast/)).not.toBeChecked();
    await expect(page.getByLabel('Large text')).not.toBeChecked();
    await expect(page.getByLabel('Play sound when I explore a graph')).toBeChecked();
    await expect(page.getByLabel('Pitch range')).toHaveValue('standard');
    await expect(page.getByLabel('Speed when playing the whole graph')).toHaveValue('medium');
    await expect(page.getByRole('status').filter({ hasText: 'Settings were reset.' })).toBeVisible();

    await page.reload();
    await hydrated(page);
    await expect(html).toHaveAttribute('data-contrast', 'normal');
    await expect(page.getByLabel('Play sound when I explore a graph')).toBeChecked();
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}'), SETTINGS_KEY);
    expect(stored).toMatchObject({ audio: true, highContrast: false, largeText: false, reducedMotion: false });
  });

  test('sound off: Space in the graph says sound is off and no AudioContext is constructed', async ({ page }) => {
    await countAudioContexts(page);
    await gotoReady(page, '/settings/');
    await page.getByLabel('Play sound when I explore a graph').uncheck();

    // "Play test tones" must also stay silent.
    await page.getByRole('button', { name: 'Play test tones' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Sound is off. Turn it on first.' })).toBeVisible();
    expect(await audioContextCount(page)).toBe(0);

    await gotoReady(page, '/student/?sample=cart');
    const graph = page.getByTestId('graph');
    await graph.focus();
    await page.keyboard.press('Space');
    await expect(page.getByTestId('readout')).toHaveText(/^Sound is off\./);
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('readout')).toContainText('Point 2 of 9.');
    await page.keyboard.press('z');
    await expect(page.getByTestId('readout')).toContainText('Point 5 of 9.');
    expect(await audioContextCount(page)).toBe(0);
    await expect(page.getByRole('button', { name: 'Turn sound on' })).toBeVisible();
  });

  test('damaged settings in storage do not break the page', async ({ page }) => {
    await page.addInitScript((key) => localStorage.setItem(key, '{not json'), SETTINGS_KEY);
    await gotoReady(page, '/settings/');
    await expect(page.locator('html')).toHaveAttribute('data-contrast', 'normal');
    await expect(page.getByLabel('Play sound when I explore a graph')).toBeChecked();
  });
});

test.describe('9. Print page', () => {
  test('graph is role=img with a name, plus a description and a table', async ({ page }) => {
    await gotoReady(page, '/print/?sample=cart');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cart on a track: velocity vs time');
    const img = page.getByRole('img', { name: /^Line graph: Cart on a track: velocity vs time/ });
    await expect(img).toHaveCount(1);
    await expect(img).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Description' })).toBeVisible();
    const description = page.locator('.print-page > p').first();
    expect((await description.innerText()).trim().length).toBeGreaterThan(40);
    const table = page.getByRole('table');
    await expect(table.locator('caption')).toContainText('9 rows');
    await expect(table.locator('thead th[scope=col]')).toHaveText(['Time (s)', 'Velocity (m/s)']);
    await expect(table.locator('tbody tr')).toHaveCount(9);
    await expect(page.getByRole('button', { name: 'Print or save as PDF' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to the interactive graph' })).toHaveAttribute(
      'href',
      '/student/?sample=cart',
    );
  });

  // Fails at the time of writing: see docs/QA_REPORT.md, bug 2 (the title is set, then put back).
  test('the browser tab title names the graph (PrintClient sets document.title)', async ({ page }) => {
    await gotoReady(page, '/print/?sample=cart');
    await expect(page.getByRole('img')).toBeVisible();
    await expect(page).toHaveTitle('Printable: Cart on a track: velocity vs time | HearGraph');
  });

  test('"Download the graph as an SVG file" downloads an SVG document', async ({ page }) => {
    await gotoReady(page, '/print/?sample=cart');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download the graph as an SVG file' }).click(),
    ]);
    expect(download.suggestedFilename()).toBe('cart-on-a-track-velocity-vs-time.svg');
    const path = await download.path();
    const content = readFileSync(path, 'utf8');
    expect(content.startsWith('<?xml')).toBe(true);
    expect(content).toContain('<svg');
    expect(content).toContain('</svg>');
    expect(content).toContain('<title>Line graph: Cart on a track: velocity vs time');
  });
});
