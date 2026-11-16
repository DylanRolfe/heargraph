import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { test, expect, hydrated, SETTINGS_KEY } from './fixtures';

/**
 * 10. axe-core on every view, in normal, high-contrast and large-text mode.
 * WCAG 2.0/2.1 A + AA rules must have zero violations.
 * "best-practice" rules are run separately and reported, but do not fail the test.
 * One JSON line per view/mode is appended to e2e/.axe-results/<project>.jsonl for the QA report.
 */

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

interface View {
  name: string;
  open: (page: Page) => Promise<void>;
}

async function go(page: Page, url: string) {
  await page.goto(url);
  await hydrated(page);
}

const VIEWS: View[] = [
  { name: 'landing', open: (p) => go(p, '/') },
  {
    name: 'student cart',
    open: async (p) => {
      await go(p, '/student/?sample=cart');
      await expect(p.getByTestId('graph')).toBeVisible();
    },
  },
  {
    name: 'student population (2 lines)',
    open: async (p) => {
      await go(p, '/student/?sample=population');
      await expect(p.getByTestId('graph')).toBeVisible();
    },
  },
  {
    name: 'student after focusing a point',
    open: async (p) => {
      await go(p, '/student/?sample=cart');
      await p.getByTestId('graph').focus();
      for (let i = 0; i < 4; i++) await p.keyboard.press('ArrowRight');
      await expect(p.getByTestId('readout')).toContainText('Point 5 of 9.');
    },
  },
  {
    name: 'student with practice feedback shown',
    open: async (p) => {
      await go(p, '/student/?sample=cart');
      const input = p.getByLabel(/At what time does the cart stop\?/);
      await input.fill('3');
      await input.press('Enter');
      const q3 = p.getByLabel(/What is the velocity at 6 s\?/);
      await q3.fill('-3');
      await q3.press('Enter');
      await expect(p.getByRole('status').filter({ hasText: /^Not quite/ })).toBeVisible();
      await expect(p.getByRole('status').filter({ hasText: /^Correct/ })).toBeVisible();
    },
  },
  {
    name: 'student error state',
    open: async (p) => {
      await go(p, '/student/#v1.not-valid');
      await expect(p.getByRole('heading', { level: 1 })).toHaveText('This graph could not be opened');
    },
  },
  { name: 'teacher empty', open: (p) => go(p, '/teacher/') },
  {
    name: 'teacher with errors shown',
    open: async (p) => {
      await go(p, '/teacher/');
      await p.getByLabel('Pasted data').fill('a,b\n1,x');
      await p.getByRole('button', { name: 'Put this data in the table' }).click();
      await p.getByRole('button', { name: 'Create link' }).click();
      await expect(p.getByTestId('form-errors')).toBeVisible();
      await expect(p.getByRole('main').getByRole('alert')).toHaveCount(2);
    },
  },
  {
    name: 'teacher with link created',
    open: async (p) => {
      await go(p, '/teacher/');
      await p.getByRole('button', { name: 'Fill the form with example data' }).click();
      await p.getByRole('button', { name: 'Create link' }).click();
      await expect(p.getByTestId('share-link')).toBeVisible();
    },
  },
  {
    name: 'teacher own-questions mode (2 lines)',
    open: async (p) => {
      await go(p, '/teacher/');
      await p.getByLabel('Add a second line').check();
      await p.getByLabel(/I will write my own/).check();
      await expect(p.getByRole('group', { name: 'Question 3' })).toBeVisible();
    },
  },
  { name: 'settings', open: (p) => go(p, '/settings/') },
  { name: 'about', open: (p) => go(p, '/about/') },
  {
    name: 'print',
    open: async (p) => {
      await go(p, '/print/?sample=cart');
      await expect(p.getByRole('img')).toBeVisible();
    },
  },
];

const MODES: { name: string; settings: Record<string, boolean> | null }[] = [
  { name: 'normal', settings: null },
  { name: 'high contrast', settings: { highContrast: true } },
  { name: 'large text', settings: { largeText: true } },
];

interface Finding {
  id: string;
  impact: string | null | undefined;
  help: string;
  helpUrl: string;
  targets: string[];
}

function summarize(violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']): Finding[] {
  return violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    helpUrl: v.helpUrl,
    targets: v.nodes.map((n) => n.target.join(' ')),
  }));
}

function format(findings: Finding[]): string {
  return findings
    .map((f) => `  - ${f.id} [${f.impact}] ${f.help}\n    ${f.helpUrl}\n    nodes: ${f.targets.join(' | ')}`)
    .join('\n');
}

for (const view of VIEWS) {
  for (const mode of MODES) {
    test(`10. axe: ${view.name} [${mode.name}]`, async ({ page }, testInfo) => {
      if (mode.settings) {
        await page.addInitScript(
          ([key, value]) => localStorage.setItem(key, value),
          [SETTINGS_KEY, JSON.stringify(mode.settings)] as const,
        );
      }
      await view.open(page);
      const html = page.locator('html');
      await expect(html).toHaveAttribute('data-contrast', mode.settings?.highContrast ? 'high' : 'normal');
      await expect(html).toHaveAttribute('data-text', mode.settings?.largeText ? 'large' : 'normal');

      const wcag = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      const best = await new AxeBuilder({ page }).withTags(['best-practice']).analyze();
      const wcagFindings = summarize(wcag.violations);
      const bestFindings = summarize(best.violations);

      const dir = join(process.cwd(), 'e2e', '.axe-results');
      mkdirSync(dir, { recursive: true });
      appendFileSync(
        join(dir, `${testInfo.project.name}.jsonl`),
        JSON.stringify({
          view: view.name,
          mode: mode.name,
          axeVersion: wcag.testEngine.version,
          wcagRulesPassed: wcag.passes.length,
          wcagIncomplete: wcag.incomplete.map((i) => i.id),
          wcag: wcagFindings,
          bestPractice: bestFindings,
        }) + '\n',
      );

      if (bestFindings.length > 0) {
        const text = `best-practice (not WCAG, reported only) on ${view.name} [${mode.name}]:\n${format(bestFindings)}`;
        console.log(text);
        testInfo.annotations.push({ type: 'axe-best-practice', description: text });
      }
      expect(
        wcagFindings,
        `axe WCAG A/AA violations on ${view.name} [${mode.name}]:\n${format(wcagFindings)}`,
      ).toEqual([]);
    });
  }
}
