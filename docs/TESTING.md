# HearGraph: testing evidence

This file records exactly what was tested, with what, when, and what failed. None of it is user testing. **HearGraph has not been tested with blind or low-vision students, and no real screen reader was used in the automated checks.** axe-core's own documentation says automated checks find only part of all accessibility problems (see `docs/SOURCES.md`).

## Summary of evidence

- **Unit tests (Vitest):** 146 tests in 6 files pass, covering CSV parsing, description, questions, link encoding (including malformed and tampered input), sample data, audio mapping and settings. Run 2026-11-15.
- **End-to-end tests (Playwright 1.65.1, Chromium 159):** 178 checks pass (89 on a 1280x800 desktop profile, 89 on a Pixel 7 emulation), against the production build served locally. Run 2026-11-15. The first run found 3 bugs (6 failing checks); all 3 were fixed and the suite re-run.
- **axe-core 4.14.0:** 0 WCAG 2.1 A/AA violations and 0 best-practice violations on 13 views, each in normal, high-contrast and large-text modes.
- **Keyboard-only:** the full student and teacher flows are driven by keyboard in the automated suite, including the exact announcement text.
- **Reflow:** no sideways page scrolling at 320 px wide, or at an emulated 200 percent zoom, including with large text on.
- **Offline:** after one visit, every page loads and the graph responds with the network turned off (Chromium).
- **Size:** first-load JavaScript is 171.8 to 186.7 KB gzipped depending on the page (target was under 200 KB). CSS is 2.6 KB gzipped.
- **Lighthouse 13.6.0** (one run, before the bug fixes, local server): student page accessibility 100, best practices 100, performance 76; teacher page 100 / 100 / 98.
- **Manual screen-reader pass by the builder:** not done yet. See "Manual passes by Dylan" below.
- **Live site (https://heargraph.vercel.app):** 123 of 178 checks passed before the host's traffic protection began blocking the test machine; the other 55 are unverified there. A real-browser spot check of the student flow passed. Offline install failed on the live site during that block, was reworked, and is not yet re-verified there.
- **Not tested:** blind or low-vision users, real screen-reader speech, audible sound quality, real phones, Firefox and Safari (automated), braille displays, embossers, forced-colours mode, real printing.

## Log

| Date | Tool or assistive technology | Browser and OS | Task | Result | Issues | Fixed? |
|---|---|---|---|---|---|---|
| 2026-11-15 | Vitest 5.1.0 | Node 22.21.0, Windows 11 | Unit tests for `/lib` and graph scales | 146 of 146 pass | One wrong expectation in a test written by the lead (tick spacing); the code was right | Test corrected |
| 2026-11-15 | Built-in browser, scripted key events (AI agent) | Chromium-based pane, Windows 11 | Student cart flow: arrows, Home, End, M, N, Z, S, Space | Announcement text as designed | Stale page served after a rebuild (service worker served old HTML first) | Yes: pages are now fetched network-first, cached copy used when offline |
| 2026-11-15 | Same | Same | Teacher flow: empty submit, bad CSV, tab-separated paste with Unicode minus, create link | Errors name the row; focus moves to the error box; link created | Client-side page prefetches returned 404 on a plain static server | Yes: navigation uses ordinary links (full page loads) |
| 2026-11-15 | Playwright 1.65.1 + axe-core 4.14.0, first run | Chromium 159 headless, desktop 1280x800 and Pixel 7 emulation, Windows 11 | Full suite (178 checks) | 172 pass, 6 fail (3 bugs, each failing on both profiles) | Bug 1: teacher page scrolled sideways at 320 px with large text. Bug 2: browser tab title did not name the graph. Bug 3: layout shift while the student page loads (Lighthouse CLS 0.179) | See next rows |
| 2026-11-15 | Fix + re-run | Same | Bug 1 | Pass | Hidden "row N" text escaped the table's scroll area | Yes (`position: relative` on the scroll area) |
| 2026-11-15 | Fix + re-run | Same | Bug 2 | Pass | The framework re-applied the static title after load | Yes (`useDocumentTitle` keeps the title) |
| 2026-11-15 | Fix | Same | Bug 3 | Loading state now reserves page height | Lighthouse was **not** re-run after this fix, so the improvement is unmeasured | Fix applied, unverified by Lighthouse |
| 2026-11-15 | Change | Same | Sound toggle | Button now reads "Turn sound off" / "Turn sound on" | Before, the state could be announced twice ("Sound: on" plus "pressed") | Yes |
| 2026-11-15 | Playwright 1.65.1 + axe-core 4.14.0, final run | Chromium 159 headless, both profiles | Full suite (178 checks) on the rebuilt site | 178 of 178 pass, no console errors | None | n/a |
| 2026-11-15 | Playwright WebKit 27.2 (one extra run, before fixes, suite not adapted) | WebKit headless, Windows 11 | Full suite | 76 pass, 13 fail | 3 were the bugs above; 6 because WebKit does not Tab to links by default; 1 clipboard permission; 3 WebKit crashes during axe | Not re-run. Safari behaviour is unverified |
| 2026-11-15 | Lighthouse 13.6.0 (one run, before fixes, mobile simulation, uncompressed local server) | Chrome for Testing 159 | `/student/?sample=cart` and `/teacher/` | Student: performance 76, accessibility 100, best practices 100. Teacher: 98 / 100 / 100 | Student page LCP 4.0 s and CLS 0.179 on the simulated slow phone | Partly (see Bug 3) |
| 2026-11-15 | `e2e/bundle-size.mjs` | Node 22.21.0 | First-load size per page, gzip level 9 | JS: `/` 171.8 KB, `/settings/` 174.0, `/print/` 182.1, `/teacher/` 183.0, `/student/` 186.7. CSS 2.6 KB. `out/` is 916.6 KB uncompressed | Under the 200 KB target by 13.3 KB on the largest page. Most of it is the framework | n/a |

The detailed automated report from the QA sub-agent's first run, including per-view axe results, is in [`QA_REPORT.md`](QA_REPORT.md). Its failure counts are from before the fixes listed above.

## What the automated suite checks

1. Landing page: one h1, both big links by name, skip link is the first Tab stop and moves focus to the main content.
2. Student cart flow by keyboard only, including the exact text "Time 4 seconds, velocity 0 metres per second, crossing zero. Point 5 of 9.", and that no audio context is created before a key press.
3. Practice questions: wrong answer, right answer, "4 s", Unicode minus, radio buttons by keyboard, empty submit.
4. Data table semantics: caption, column headers with units, row headers.
5. Two-line sample: switching lines by key and by button.
6. Teacher flow: errors and focus, bad CSV, example data, link creation and round trip, typed table with unsorted rows, own questions, copy link, damaged links.
7. Hash safety: skip link and in-page links do not disturb the data in the link.
8. Settings: high contrast, large text, reset, persistence, sound off.
9. Print page: named image, description, table, SVG download.
10. axe-core on every view in three display modes.
11. Reflow at 320 px and emulated 200 percent zoom.
12. Visible focus on every Tab stop on the landing and student pages.
13. Offline after first load.
14. Bundle size.

## Manual passes by Dylan

_Not done yet. Run `docs/SCREEN_READER_CHECKLIST.md` on the live URL and paste the filled-in results table here, with the date, screen reader and version, browser and version, and operating system. Record failures as they are._

## Checks against the deployed site

Live URL: https://heargraph.vercel.app (deployed 2026-11-15 from commit 6dc1260).

| Date | Tool | Task | Result | Issues | Fixed? |
|---|---|---|---|---|---|
| 2026-11-15 | Playwright 1.65.1 + axe-core 4.14.0, Chromium 159,  | Full suite (178 checks) against the live site | **123 passed, 55 did not.** Partway through the run, Vercel's automatic traffic protection started answering this machine with a "Security Checkpoint" page (HTTP 403, ). Every failure inspected was that 403, not an app error | The test burst looked like an attack to the host. The 55 checks are **unverified on the live site**; they pass against the same build served locally. The project has no attack mode or custom firewall turned on, so ordinary visitors are not affected | Not re-run. Re-running in a burst would trigger the same protection |
| 2026-11-15 | Built-in browser pane (AI agent), real Chromium | Open the live student example, press Right then Z in the graph | Page title "Cart on a track: velocity vs time | HearGraph"; readout "Time 4 seconds, velocity 0 metres per second, crossing zero. Point 5 of 9." | None | n/a |
| 2026-11-15 | Same | Offline install on the live site | **Failed.** The service worker stayed in "installing" with 0 files saved while this machine was being challenged | The installer waited without a time limit on requests the host was holding or refusing | Installer rewritten: 15-second limit per file, six files at a time, refused files skipped and saved on first use. Passes locally. **Not yet re-verified on the live site** |

Offline use on the live site is therefore unverified at the time of writing. Check it by hand: open the site, wait for the footer line "Saved on this device…", turn off Wi-Fi, and reload.

## How to repeat

```bash
npm install
npx playwright install chromium
npm test            # unit tests
npm run build       # production build in ./out
npm run e2e         # end-to-end, axe-core, reflow, offline
node e2e/bundle-size.mjs
```
