import type { Page } from '@playwright/test';
import { test, expect, gotoReady, hydrated, encodeShare, SHARED_PAYLOAD } from './fixtures';

function origin(baseURL: string | undefined): string {
  return (baseURL ?? 'http://localhost:4173').replace(/\/$/, '');
}

async function openCreatedLink(page: Page): Promise<string> {
  const link = await page.getByTestId('share-link').inputValue();
  await page.goto(link);
  await hydrated(page);
  return link;
}

test.describe('6. Teacher flow', () => {
  test('empty submit shows errors and moves focus to the error box', async ({ page }) => {
    await gotoReady(page, '/teacher/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Make an accessible graph');
    await page.getByRole('button', { name: 'Create link' }).click();
    const errors = page.getByTestId('form-errors');
    await expect(errors).toBeVisible();
    await expect(errors).toHaveAttribute('role', 'alert');
    await expect(errors).toContainText('Add a title for the graph.');
    await expect(errors).toBeFocused();
    await expect(page.getByTestId('share-link')).toHaveCount(0);
  });

  test('pasting bad CSV shows row-numbered errors', async ({ page }) => {
    await gotoReady(page, '/teacher/');
    await page.getByLabel('Pasted data').fill('Time (s), Velocity (m/s)\n0, 6\n1, abc\n2, 3\n2, 9');
    await page.getByRole('button', { name: 'Put this data in the table' }).click();
    const alert = page.getByRole('alert').filter({ hasText: 'The pasted data could not be used' });
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Row 3: "abc" is not a number.');
    await expect(alert).toContainText(/Row 5: .*already used in row 4/);
    await expect(alert).toBeFocused();
  });

  test('good CSV fills the table and names the columns', async ({ page }) => {
    await gotoReady(page, '/teacher/');
    await page.getByLabel('Pasted data').fill('Day (d)\tHeight (cm)\n1\t2,5\n2\t4\n3\t7');
    await page.getByRole('button', { name: 'Put this data in the table' }).click();
    await expect(page.getByRole('group', { name: 'Horizontal axis' }).getByLabel('Name')).toHaveValue('Day');
    await expect(page.getByRole('group', { name: 'Line 1' }).getByLabel('Unit (optional)')).toHaveValue('cm');
    await expect(page.getByLabel('Row 1, Height')).toHaveValue('2.5');
    await expect(page.getByLabel('Row 3, Day')).toHaveValue('3');
  });

  test('example data -> Create link -> student page shows the same title and 9 rows', async ({ page, baseURL }) => {
    await gotoReady(page, '/teacher/');
    await page.getByRole('button', { name: 'Fill the form with example data' }).click();
    await expect(page.getByLabel('Graph title')).toHaveValue('Cart on a track: velocity vs time');
    await page.getByRole('button', { name: 'Create link' }).click();
    await expect(page.getByRole('heading', { name: 'Your link is ready' })).toBeFocused();
    const link = await page.getByTestId('share-link').inputValue();
    expect(link.startsWith(`${origin(baseURL)}/student/#v1.`)).toBe(true);
    await expect(page.getByLabel('Link for students')).toHaveValue(link);
    await expect(page.getByRole('link', { name: 'Open the student view' })).toHaveAttribute('href', link);

    await openCreatedLink(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cart on a track: velocity vs time');
    await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(9);
    // Automatic questions were generated (the example is loaded without its own questions).
    await expect(page.getByRole('button', { name: 'Check answer' }).first()).toBeVisible();
    // The link can be reopened in the editor.
    await expect(page.getByRole('link', { name: 'Teachers: edit a copy of this graph' })).toBeVisible();
  });

  test('hand-typed table with unsorted x works and shows the sorted notice', async ({ page }) => {
    await gotoReady(page, '/teacher/');
    await page.getByLabel('Graph title').fill('Plant height by week');
    const xAxis = page.getByRole('group', { name: 'Horizontal axis' });
    await xAxis.getByLabel('Name').fill('Week');
    await xAxis.getByLabel('Unit (optional)').fill('wk');
    const line1 = page.getByRole('group', { name: 'Line 1' });
    await line1.getByLabel('Name').fill('Height');
    await line1.getByLabel('Unit (optional)').fill('cm');

    const rows: [string, string][] = [
      ['3', '30'],
      ['1', '10.5'],
      ['2', '−4'],
    ];
    for (let i = 0; i < rows.length; i++) {
      await page.getByLabel(`Row ${i + 1}, Week`).fill(rows[i][0]);
      await page.getByLabel(`Row ${i + 1}, Height`).fill(rows[i][1]);
    }
    await page.getByRole('button', { name: 'Create link' }).click();
    await expect(page.getByTestId('form-errors')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Your link is ready' })).toBeFocused();
    await expect(page.locator('.result-box')).toContainText('Rows were sorted by Week from smallest to largest.');

    await openCreatedLink(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Plant height by week');
    const table = page.getByRole('table');
    await expect(table.locator('thead th[scope=col]')).toHaveText(['Week (wk)', 'Height (cm)']);
    await expect(table.locator('tbody th[scope=row]')).toHaveText(['1', '2', '3']);
    await expect(table.locator('tbody td')).toHaveText(['10.5', '-4', '30']);
  });

  test('a non-number in the table gives a row-numbered error', async ({ page }) => {
    await gotoReady(page, '/teacher/');
    await page.getByLabel('Graph title').fill('Bad cell');
    await page.getByLabel('Row 1, x').fill('1');
    await page.getByLabel('Row 1, y').fill('2');
    await page.getByLabel('Row 2, x').fill('2');
    await page.getByLabel('Row 2, y').fill('lots');
    await page.getByRole('button', { name: 'Create link' }).click();
    const errors = page.getByTestId('form-errors');
    await expect(errors).toContainText('Row 2: "lots" is not a number.');
    await expect(errors).toBeFocused();
  });

  test('own-question mode round-trips to the student page', async ({ page }) => {
    await gotoReady(page, '/teacher/');
    await page.getByRole('button', { name: 'Fill the form with example data' }).click();
    await page.getByLabel(/I will write my own/).check();
    const q1 = page.getByRole('group', { name: 'Question 1' });
    await q1.getByLabel('Question', { exact: true }).fill('What is the velocity at 2 s, in metres per second?');
    await q1.getByLabel('Expected answer').fill('3');
    await q1.getByLabel(/Explanation shown after answering/).fill('Find the row for 2 s');
    const q2 = page.getByRole('group', { name: 'Question 2' });
    await q2.getByLabel('Question', { exact: true }).fill('Which way does the cart move after 4 s?');
    await q2.getByLabel('Expected answer').fill('Backward');
    await page.getByRole('button', { name: 'Create link' }).click();
    await expect(page.getByRole('heading', { name: 'Your link is ready' })).toBeFocused();

    await openCreatedLink(page);
    const item1 = page.getByRole('listitem').filter({ hasText: 'What is the velocity at 2 s, in metres per second?' });
    const input1 = page.getByLabel(/What is the velocity at 2 s, in metres per second\?/);
    await input1.fill('5');
    await input1.press('Enter');
    await expect(item1.getByRole('status')).toHaveText(/^Not quite/);
    await input1.fill('3');
    await input1.press('Enter');
    await expect(item1.getByRole('status')).toHaveText('Correct. Find the row for 2 s.');

    const item2 = page.getByRole('listitem').filter({ hasText: 'Which way does the cart move after 4 s?' });
    const input2 = page.getByLabel(/Which way does the cart move after 4 s\?/);
    await input2.press('Enter');
    await expect(item2.getByRole('status')).toHaveText('Type an answer first.');
    await input2.fill('  backward ');
    await input2.press('Enter');
    await expect(item2.getByRole('status')).toHaveText(/^Correct/);
    // Only the two written questions are shown.
    await expect(page.getByRole('button', { name: 'Check answer' })).toHaveCount(2);
  });

  test('Copy link sets the status text and puts the link on the clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await gotoReady(page, '/teacher/');
    await page.getByRole('button', { name: 'Fill the form with example data' }).click();
    await page.getByRole('button', { name: 'Create link' }).click();
    const link = await page.getByTestId('share-link').inputValue();
    await page.getByRole('button', { name: 'Copy link' }).click();
    await expect(page.getByTestId('copy-status')).toHaveText('Link copied to the clipboard.');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(link);
  });

  test('editing after creating hides the out-of-date link', async ({ page }) => {
    await gotoReady(page, '/teacher/');
    await page.getByRole('button', { name: 'Fill the form with example data' }).click();
    await page.getByRole('button', { name: 'Create link' }).click();
    await expect(page.getByTestId('share-link')).toBeVisible();
    await page.getByLabel('Graph title').fill('Changed title');
    await expect(page.getByTestId('share-link')).toHaveCount(0);
  });

  test('a shared link opens in the teacher editor pre-filled', async ({ page }) => {
    await page.goto(`/teacher/#${encodeShare(SHARED_PAYLOAD)}`);
    await hydrated(page);
    await expect(page.getByLabel('Graph title')).toHaveValue('Shared test graph');
    await expect(page.getByLabel('Row 4, Time')).toHaveValue('3');
    await expect(page.getByLabel('Row 4, Height')).toHaveValue('-1');
  });

  test('corrupted link shows a readable error and a link to the example', async ({ page }) => {
    await page.goto('/student/#v1.not-valid');
    await hydrated(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('This graph could not be opened');
    const alert = page.getByRole('main').getByRole('alert');
    await expect(alert).toHaveText('This link is incomplete or damaged. Ask your teacher to send it again.');
    await expect(page.getByRole('link', { name: 'Open the built-in example instead' })).toHaveAttribute(
      'href',
      '/student/?sample=cart',
    );
  });

  test('a v9 link mentions a newer version', async ({ page }) => {
    await page.goto('/student/#v9.abc');
    await hydrated(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('This graph could not be opened');
    await expect(page.getByRole('main').getByRole('alert')).toContainText('newer version');
    await expect(page.getByRole('link', { name: 'Open the built-in example instead' })).toBeVisible();
  });
});

test.describe('7. Hash safety on a shared-link student page', () => {
  test('skip link and "On this page" links do not change location.hash', async ({ page }) => {
    const hash = `#${encodeShare(SHARED_PAYLOAD)}`;
    await page.goto(`/student/${hash}`);
    await hydrated(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Shared test graph');
    const currentHash = () => page.evaluate(() => location.hash);

    // Skip link, by keyboard.
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText('Skip to main content');
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main')).toBeFocused();
    expect(await currentHash()).toBe(hash);

    const nav = page.getByRole('navigation', { name: 'On this page' });
    const targets: [string, string][] = [
      ['Summary', 'summary'],
      ['Explore the graph', 'explore'],
      ['Data table', 'table'],
      ['Practice questions', 'practice'],
    ];
    await expect(nav.getByRole('link')).toHaveCount(targets.length);
    for (const [name, id] of targets) {
      const link = nav.getByRole('link', { name, exact: true });
      await link.focus();
      await page.keyboard.press('Enter');
      await expect(page.locator(`#${id}`)).toBeFocused();
      expect(await currentHash(), `hash after activating "${name}"`).toBe(hash);
    }
    // The worksheet is still the shared one.
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Shared test graph');
    await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(4);
  });
});
