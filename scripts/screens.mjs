// Takes review screenshots of the built site (run `npm start` first, or let this start it).
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const OUT = process.argv[2] || 'docs/screenshots';
let server;
try {
  await fetch(BASE);
} catch {
  server = spawn(process.execPath, ['scripts/serve.mjs', '4173'], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 1200));
}
const browser = await chromium.launch();
const sizes = { desktop: { width: 1280, height: 800 }, mobile: { width: 390, height: 844 } };
for (const [name, viewport] of Object.entries(sizes)) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: name === 'mobile' ? 2 : 1 });
  const page = await ctx.newPage();
  await page.goto(BASE + '/');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}-landing.png`, fullPage: true });
  await page.goto(BASE + '/student/?sample=cart');
  const graph = page.getByTestId('graph');
  await graph.waitFor();
  await page.waitForTimeout(400);
  await graph.focus();
  await page.keyboard.press('z');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${name}-student.png`, fullPage: true });
  await page.goto(BASE + '/teacher/');
  await page.getByRole('button', { name: 'Fill the form with example data' }).click();
  await page.getByRole('button', { name: 'Create link' }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${name}-teacher.png`, fullPage: true });
  await ctx.close();
}
await browser.close();
if (server) server.kill();
console.log('screenshots written to', OUT);
