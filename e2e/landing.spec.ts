import { test, expect, gotoReady } from './fixtures';

const TEACHER_NAME = 'I’m a teacher: make an accessible graph';
const STUDENT_NAME = 'Try the student example';

test.describe('1. Landing page', () => {
  test('one h1 and the two big links with exact names', async ({ page }) => {
    await gotoReady(page, '/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('HearGraph');

    // Each big link holds a title span and a note span. The title text must be exact.
    const teacher = page.locator('a.big-button', { hasText: TEACHER_NAME });
    await expect(teacher).toHaveCount(1);
    await expect(teacher.locator('.big-button-title')).toHaveText(TEACHER_NAME);
    await expect(teacher).toHaveAttribute('href', '/teacher/');
    const student = page.locator('a.big-button', { hasText: STUDENT_NAME });
    await expect(student).toHaveCount(1);
    await expect(student.locator('.big-button-title')).toHaveText(STUDENT_NAME);
    await expect(student).toHaveAttribute('href', '/student/?sample=cart');

    // Accessible names, as computed by the browser, begin with the title text.
    await expect(page.getByRole('link', { name: new RegExp('^' + TEACHER_NAME) })).toHaveCount(1);
    await expect(page.getByRole('link', { name: new RegExp('^' + STUDENT_NAME) })).toHaveCount(1);
  });

  test('skip link is the first Tab stop and moves focus to main', async ({ page }) => {
    await gotoReady(page, '/');
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toHaveText('Skip to main content');
    await expect(focused).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main')).toBeFocused();
    expect(await page.evaluate(() => location.hash)).toBe('');
  });
});
