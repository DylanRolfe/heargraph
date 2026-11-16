import { test, expect, gotoReady, countAudioContexts, audioContextCount } from './fixtures';

const POINT5 = 'Time 4 seconds, velocity 0 metres per second, crossing zero. Point 5 of 9.';

test.describe('2. Student cart flow, keyboard only', () => {
  test('Tab reaches the graph; arrows, Home, End, M, N, Z, S, Space behave; no audio before a key press', async ({
    page,
  }, testInfo) => {
    await countAudioContexts(page);
    await gotoReady(page, '/student/?sample=cart');
    const graph = page.getByTestId('graph');
    const readout = page.getByTestId('readout');
    await expect(graph).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cart on a track: velocity vs time');

    // No audio on load.
    expect(await audioContextCount(page)).toBe(0);

    // Tab to the graph, counting presses.
    let tabs = 0;
    while (tabs < 30) {
      await page.keyboard.press('Tab');
      tabs++;
      if (await graph.evaluate((el) => el === document.activeElement)) break;
    }
    testInfo.annotations.push({ type: 'tab-presses-to-graph', description: String(tabs) });
    await expect(graph).toBeFocused();
    await expect(graph).toHaveAttribute('role', 'application');
    await expect(page.getByRole('application', { name: 'Graph: Cart on a track: velocity vs time' })).toBeFocused();
    // skip link, brand, 4 nav links, 4 "On this page" links, then the graph.
    expect(tabs).toBe(11);
    // Focus alone must not start audio.
    expect(await audioContextCount(page)).toBe(0);

    for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
    await expect(readout).toHaveText(POINT5);
    expect(await audioContextCount(page)).toBeGreaterThanOrEqual(1);

    await page.keyboard.press('Home');
    await expect(readout).toContainText('Time 0 seconds, velocity 6 metres per second');
    await expect(readout).toContainText('Point 1 of 9.');

    await page.keyboard.press('ArrowLeft');
    await expect(readout).toHaveText(/^First point\. .*Point 1 of 9\.\s*$/);

    await page.keyboard.press('End');
    await expect(readout).toContainText('Time 8 seconds, velocity -6 metres per second');
    await expect(readout).toContainText('Point 9 of 9.');
    await expect(readout).not.toContainText('Last point.');

    await page.keyboard.press('ArrowRight');
    await expect(readout).toHaveText(/^Last point\. .*Point 9 of 9\.\s*$/);

    await page.keyboard.press('m');
    await expect(readout).toContainText('velocity 6 metres per second');
    await expect(readout).toContainText('Point 1 of 9.');

    await page.keyboard.press('n');
    await expect(readout).toContainText('velocity -6 metres per second');
    await expect(readout).toContainText('Point 9 of 9.');

    await page.keyboard.press('z');
    await expect(readout).toHaveText(POINT5);

    // S repeats the summary: the same text as the series paragraph of the Summary section.
    const summary = (await page.getByTestId('summary-text').innerText()).trim();
    expect(summary.length).toBeGreaterThan(40);
    await page.keyboard.press('s');
    await expect(readout).toHaveText(summary);

    // Space plays, Space stops.
    await page.keyboard.press('Space');
    await expect(readout).toHaveText(/^Playing/);
    await expect(page.getByRole('button', { name: 'Stop sound' })).toBeVisible();
    await page.keyboard.press('Space');
    await expect(readout).toHaveText(/^Stopped\./);
    await expect(page.getByRole('button', { name: 'Play graph as sound' })).toBeVisible();
    await expect(graph).toBeFocused();
  });

  test('the live readout is a polite, atomic status region', async ({ page }) => {
    await gotoReady(page, '/student/?sample=cart');
    const readout = page.getByTestId('readout');
    await expect(readout).toHaveAttribute('aria-live', 'polite');
    await expect(readout).toHaveAttribute('aria-atomic', 'true');
    await expect(readout).toHaveAttribute('role', 'status');
  });

  test('summary: an overview paragraph, then the first series summary', async ({ page }) => {
    await gotoReady(page, '/student/?sample=cart');
    const paragraphs = page.locator('section[aria-labelledby=summary] p');
    await expect(paragraphs).toHaveCount(2);
    await expect(paragraphs.first()).toContainText('A line graph of Velocity against Time, with 9 points');
    await expect(page.getByTestId('summary-text')).toHaveCount(1);
    await expect(page.getByTestId('summary-text')).toContainText('It reaches 0 m/s at 4 s');
  });

  // Fails at the time of writing: see docs/QA_REPORT.md, bug 2 (the title is set, then put back).
  test('the browser tab title names the graph (StudentClient sets document.title)', async ({ page }) => {
    await gotoReady(page, '/student/?sample=cart');
    await expect(page.getByTestId('graph')).toBeVisible();
    await expect(page).toHaveTitle('Cart on a track: velocity vs time | HearGraph');
  });
});

test.describe('3. Practice questions', () => {
  test('wrong then right, radio by keyboard, negative answers, empty submit', async ({ page }) => {
    await gotoReady(page, '/student/?sample=cart');
    const q = (text: string) => page.getByRole('listitem').filter({ hasText: text });

    // Question 1
    const q1 = q('At what time does the cart stop?');
    const q1Input = page.getByLabel(/At what time does the cart stop\?/);
    const q1Feedback = q1.getByRole('status');

    // Empty submit: a prompt, not a crash.
    await q1Input.focus();
    await page.keyboard.press('Enter');
    await expect(q1Feedback).toHaveText('Type a number, for example 4 or -2.5.');

    await page.keyboard.type('3');
    await page.keyboard.press('Enter');
    await expect(q1Feedback).toHaveText(/^Not quite/);

    await q1Input.fill('');
    await page.keyboard.type('4 s');
    await page.keyboard.press('Enter');
    await expect(q1Feedback).toHaveText(/^Correct/);

    // Question 2: radio group by keyboard.
    const q2 = q('Is the cart speeding up or slowing down between 0 and 4 s?');
    const group = page.getByRole('group', { name: /Is the cart speeding up or slowing down/ });
    await expect(group.getByRole('radio')).toHaveCount(3);
    // Empty submit first.
    await q2.getByRole('button', { name: 'Check answer' }).focus();
    await page.keyboard.press('Enter');
    await expect(q2.getByRole('status')).toHaveText('Choose an answer first.');

    await group.getByRole('radio', { name: 'Speeding up' }).focus();
    await page.keyboard.press('Space');
    await expect(group.getByRole('radio', { name: 'Speeding up' })).toBeChecked();
    await page.keyboard.press('ArrowDown');
    await expect(group.getByRole('radio', { name: 'Slowing down' })).toBeChecked();
    await page.keyboard.press('Tab');
    await expect(q2.getByRole('button', { name: 'Check answer' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(q2.getByRole('status')).toHaveText(/^Correct/);

    // Question 3: ASCII minus, then a wrong answer, then the Unicode minus sign.
    const q3 = q('What is the velocity at 6 s?');
    const q3Input = page.getByLabel(/What is the velocity at 6 s\?/);
    await q3Input.focus();
    await page.keyboard.type('-3');
    await page.keyboard.press('Enter');
    await expect(q3.getByRole('status')).toHaveText(/^Correct/);

    await q3Input.fill('3');
    await page.keyboard.press('Enter');
    await expect(q3.getByRole('status')).toHaveText(/^Not quite/);

    await q3Input.fill('−3');
    await page.keyboard.press('Enter');
    await expect(q3.getByRole('status')).toHaveText(/^Correct/);
  });
});

test.describe('4. Data table semantics', () => {
  test('caption, column headers with units, row headers, 9 rows', async ({ page }) => {
    await gotoReady(page, '/student/?sample=cart');
    const table = page.getByRole('table');
    await expect(table).toHaveCount(1);
    await expect(table.locator('caption')).toContainText('Cart on a track: velocity vs time: 9 rows');
    await expect(table.locator('thead th[scope=col]')).toHaveText(['Time (s)', 'Velocity (m/s)']);
    await expect(table.locator('thead th:not([scope=col])')).toHaveCount(0);
    await expect(table.locator('tbody tr')).toHaveCount(9);
    await expect(table.locator('tbody th[scope=row]')).toHaveText(['0', '1', '2', '3', '4', '5', '6', '7', '8']);
    await expect(table.locator('tbody td')).toHaveCount(9);
    // Exposed through the accessibility tree too.
    await expect(page.getByRole('columnheader', { name: 'Velocity (m/s)' })).toBeVisible();
    await expect(page.getByRole('rowheader')).toHaveCount(9);
    // The scroll wrapper is a named, focusable region.
    await expect(page.getByRole('region', { name: /^Data table for/ })).toHaveAttribute('tabindex', '0');
  });
});

test.describe('5. Two-line sample (population)', () => {
  test('Up/Down switch line and the readout names the line; Switch line button exists', async ({ page }) => {
    await gotoReady(page, '/student/?sample=population');
    const graph = page.getByTestId('graph');
    const readout = page.getByTestId('readout');
    await graph.focus();
    await page.keyboard.press('ArrowRight');
    await expect(readout).toContainText('Point 2 of 11.');
    await page.keyboard.press('ArrowDown');
    await expect(readout).toHaveText(/^Line 2 of 2, Dish B\. .*Point 2 of 11\.\s*$/);
    await page.keyboard.press('ArrowUp');
    await expect(readout).toHaveText(/^Line 1 of 2, Dish A\. .*Point 2 of 11\.\s*$/);

    const button = page.getByRole('button', { name: /^Switch line/ });
    await expect(button).toHaveText('Switch line (now: Dish A)');
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(readout).toHaveText(/^Line 2 of 2, Dish B\./);
    await expect(button).toHaveText('Switch line (now: Dish B)');

    const table = page.getByRole('table');
    await expect(table.locator('thead th[scope=col]')).toHaveText([
      'Time (h)',
      'Dish A (thousand cells)',
      'Dish B (thousand cells)',
    ]);
    await expect(table.locator('tbody tr')).toHaveCount(11);
  });

  test('single-line graph: Up arrow says there is one line; no Switch line button', async ({ page }) => {
    await gotoReady(page, '/student/?sample=temperature');
    await page.getByTestId('graph').focus();
    await page.keyboard.press('ArrowUp');
    await expect(page.getByTestId('readout')).toHaveText('This graph has one line.');
    await expect(page.getByRole('button', { name: /^Switch line/ })).toHaveCount(0);
  });
});
