import { test, expect, hydrated } from './fixtures';

/**
 * 13. Offline. The service worker only registers in the production build (out/).
 * Runs serially inside one test because it changes the network state of its context.
 */
test.describe('13. Offline', () => {
  test('after the first visit every page renders offline and the graph still responds', async ({
    page,
    context,
  }) => {
    await page.goto('/');
    await hydrated(page);
    await expect(page.getByTestId('offline-status')).toContainText('works without an internet connection', {
      timeout: 30_000,
    });
    // The worker must control this page before we cut the network.
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, { timeout: 15_000 });

    await context.setOffline(true);
    expect(await page.evaluate(() => navigator.onLine)).toBe(false);

    const pages: [string, string | RegExp][] = [
      ['/student/?sample=cart', 'Cart on a track: velocity vs time'],
      ['/teacher/', 'Make an accessible graph'],
      ['/settings/', /.+/],
      ['/about/', 'About HearGraph'],
      ['/print/?sample=cart', 'Cart on a track: velocity vs time'],
      ['/student/?sample=population', 'Bacteria colony growth in two dishes'],
      ['/', 'HearGraph'],
    ];
    for (const [url, h1] of pages) {
      await page.goto(url);
      await hydrated(page);
      await expect(page.getByRole('heading', { level: 1 }), `h1 of ${url} while offline`).toHaveText(h1);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

      if (url === '/student/?sample=cart') {
        const graph = page.getByTestId('graph');
        await graph.focus();
        await page.keyboard.press('ArrowRight');
        await expect(page.getByTestId('readout')).toContainText('Point 2 of 9.');
        await page.keyboard.press('ArrowRight');
        await expect(page.getByTestId('readout')).toContainText('Point 3 of 9.');
      }
      if (url === '/teacher/') {
        // Creating a link needs no network either.
        await page.getByRole('button', { name: 'Fill the form with example data' }).click();
        await page.getByRole('button', { name: 'Create link' }).click();
        await expect(page.getByTestId('share-link')).toHaveValue(/\/student\/#v1\./);
      }
    }

    // A shared link (data in the hash) opens offline too.
    const link = await (async () => {
      await page.goto('/teacher/');
      await hydrated(page);
      await page.getByRole('button', { name: 'Fill the form with example data' }).click();
      await page.getByRole('button', { name: 'Create link' }).click();
      return page.getByTestId('share-link').inputValue();
    })();
    await page.goto(link);
    await hydrated(page);
    await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(9);

    await context.setOffline(false);
  });
});
