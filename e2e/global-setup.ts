import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

/** Clears the per-run axe result log (written by axe.spec.ts, read when writing docs/QA_REPORT.md). */
export default function globalSetup() {
  const dir = join(process.cwd(), 'e2e', '.axe-results');
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}
