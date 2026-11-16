# HearGraph: QA report (automated checks)

Date: 2026-11-15

Everything in this report is an automated check run by a script. None of it is user testing. No blind or low-vision person, and no screen reader, was involved. See "Not covered by automation" at the end.

## What was tested, and with what

| Item | Value (read from the tools) |
|---|---|
| Machine | Windows 11 Pro 10.0.26200 |
| Node | v22.21.0 |
| Playwright | @playwright/test 1.65.1 |
| Browser for the main run | Chromium 159.0.8154.6 (Playwright headless shell, build 1255) |
| Extra browser (one supplementary run) | WebKit 27.2 (Playwright build 2388) |
| axe-core | 4.14.0 (through @axe-core/playwright 4.14.0) |
| Lighthouse | 13.6.0, run with `npx`, using Playwright's Chrome for Testing 159.0.8154.6 |
| App under test | the static export already in `out/` (Next 16.4.6, React 19.3.1), served by `node scripts/serve.mjs 4173` at http://localhost:4173 |

Notes on scope:

- `out/` already existed and a server was already listening on port 4173, so the build was not re-run. The results describe that build. If the source has changed since `out/` was built, run `npm run build` and `npm run e2e` again.
- The suite was run against localhost only. It was not run against the deployed Vercel URL. To do that: `BASE_URL=https://<deployment> npm run e2e` (no local server is started when `BASE_URL` is set).
- Projects: `desktop` (Desktop Chrome, 1280x800) and `mobile` (Pixel 7 emulation in Chromium). The "mobile" project is Chromium pretending to be a phone, not a real phone.
- Every test fails on any `console.error` or uncaught page error (shared fixture in `e2e/fixtures.ts`). Nothing is ignored. No test hit a console error, including the offline test.

## Final run

Command: `npm run e2e` (178 tests: 89 per project).

```
  6 failed
    [desktop] › e2e\layout.spec.ts:44:5 › 11. Reflow › 320x640 + large text: no horizontal page scroll on /teacher/
    [desktop] › e2e\settings-print.spec.ts:129:3 › 9. Print page › the browser tab title names the graph (PrintClient sets document.title)
    [desktop] › e2e\student.spec.ts:99:3 › 2. Student cart flow, keyboard only › the browser tab title names the graph (StudentClient sets document.title)
    [mobile] › e2e\layout.spec.ts:44:5 › 11. Reflow › 320x640 + large text: no horizontal page scroll on /teacher/
    [mobile] › e2e\settings-print.spec.ts:129:3 › 9. Print page › the browser tab title names the graph (PrintClient sets document.title)
    [mobile] › e2e\student.spec.ts:99:3 › 2. Student cart flow, keyboard only › the browser tab title names the graph (StudentClient sets document.title)
  172 passed (59.8s)
```

| Project | Passed | Failed | Skipped | Flaky |
|---|---|---|---|---|
| desktop | 86 | 3 | 0 | 0 |
| mobile | 86 | 3 | 0 | 0 |
| Total | 172 | 6 | 0 | 0 |

The 6 failures are 3 tests failing in both projects. They are left failing on purpose because each one is a real app bug (bugs 1 and 2 below), not a test mistake. Two of the three failing tests (page titles, large-text reflow) go beyond the 14 checks in the brief; they were added while writing the suite.

## Results by check

Results were the same in both projects unless noted.

| # | Check | desktop | mobile | Notes |
|---|---|---|---|---|
| 1 | Landing: one h1; two big links with the exact title text; skip link is the first Tab stop and moves focus to `main` | pass | pass | Each big link also contains a note line, so its full accessible name is the title followed by the note. The test checks the title span text exactly and that the accessible name starts with it. |
| 2 | Student cart flow by keyboard: Tab to the graph, Right x4, Home, End, M, N, Z, S, "First point." / "Last point.", Space plays and Space stops | pass | pass | 11 Tab presses reach the graph (skip link, brand, 4 nav links, 4 "On this page" links, graph). Readout after Right x4 is exactly `Time 4 seconds, velocity 0 metres per second, crossing zero. Point 5 of 9.` |
| 2 | No audio before a key press | pass | pass | `new AudioContext()` count is 0 after load and after focusing the graph; at least 1 after the first arrow key. |
| 2 | Browser tab title names the graph (extra) | **fail** | **fail** | Bug 2. |
| 3 | Practice: wrong answer "3" gives "Not quite…", "4 s" gives "Correct…"; radio chosen by keyboard; "-3" and "−3" (Unicode minus) accepted; empty submit gives a prompt | pass | pass | Empty number answer: "Type a number, for example 4 or -2.5." Empty choice: "Choose an answer first." |
| 4 | Data table: caption, `th[scope=col]` with units, `th[scope=row]`, 9 body rows | pass | pass | Scroll wrapper is a named, focusable region. |
| 5 | Two-line sample: Up/Down switch line and the readout names the line; "Switch line" button exists | pass | pass | Also checked: single-line graph says "This graph has one line." |
| 6 | Teacher: empty submit shows errors and focuses the error box | pass | pass | |
| 6 | Teacher: bad CSV gives row-numbered errors | pass | pass | e.g. `Row 3: "abc" is not a number.` and a duplicate-x error naming both rows. |
| 6 | Teacher: example data, Create link, link starts with BASE_URL + `/student/#v1.`; student page has the same h1 and 9 rows | pass | pass | |
| 6 | Teacher: hand-typed 3-row table with unsorted x; sorted notice shown; student table is sorted | pass | pass | Includes a Unicode minus in a cell. |
| 6 | Teacher: own-question mode round-trips (number and text answers) | pass | pass | |
| 6 | Teacher: Copy link sets the status text | pass | pass | Clipboard permission granted to the context; clipboard content equals the link. The "copying was blocked" fallback path was not exercised. |
| 6 | Corrupted link `/student/#v1.not-valid` shows a readable error and a link to the example; `/student/#v9.abc` mentions a newer version | pass | pass | |
| 7 | Hash safety: skip link and all 4 "On this page" links leave `location.hash` unchanged on a shared-link page | pass | pass | Focus moves to the target each time. |
| 8 | Settings: high contrast sets `data-contrast=high` and persists after reload; large text sets `data-text=large`; reset restores defaults | pass | pass | Also: reduce motion sets `data-motion=reduced`; damaged JSON in storage does not break the page. |
| 8 | Sound off: Space in the graph says sound is off; no AudioContext constructed | pass | pass | Count stays 0 through Space, Right and Z, and through "Play test tones" on the settings page. |
| 9 | Print page: graph is `role=img` with a name; description; table; SVG download starts with `<?xml` and contains `<svg` | pass | pass | Download file name: `cart-on-a-track-velocity-vs-time.svg`. |
| 9 | Print page tab title names the graph (extra) | **fail** | **fail** | Bug 2. |
| 10 | axe-core, WCAG 2.0/2.1 A and AA, 13 views x 3 modes | pass | pass | 0 violations in all 39 runs per project. Details below. |
| 11 | Reflow at 320x640: no horizontal page scroll on landing, student (cart and population), teacher, settings, about | pass | pass | Also passes for the teacher page with errors shown and with a link created. |
| 11 | Reflow at 200% zoom emulation (640x400, deviceScaleFactor 2), student cart and population | pass | pass | |
| 11 | Reflow at 320x640 with the app's own "Large text" setting (extra): landing, student, settings, about | pass | pass | |
| 11 | Reflow at 320x640 with "Large text" on `/teacher/` (extra) | **fail** | **fail** | Bug 1: page scrollWidth 379 px in a 320 px viewport. |
| 12 | Focus visibility: every Tab stop on landing (9 stops), student cart (26) and student population (27) has outline width > 0 or a box-shadow | pass | pass | Measures that an indicator exists, not its contrast against the background. |
| 13 | Offline: after the service worker reports ready, with the context offline, `/student/?sample=cart`, `/teacher/`, `/settings/`, `/about/`, `/print/?sample=cart` each render their h1; the graph responds to ArrowRight | pass | pass | Also offline: population sample, creating a link, and opening that shared link. No console errors while offline. |
| 14 | Bundle size script | n/a | n/a | Run with Node; output below. |

## axe-core results

Tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` must have zero violations. `best-practice` rules are run separately and only reported. Each view was scanned in normal, high-contrast (`{"highContrast":true}` in `heargraph-settings-v1`) and large-text mode. Counts are violations; desktop / mobile were identical.

| View | Normal: WCAG | Normal: best-practice | High contrast: WCAG | High contrast: best-practice | Large text: WCAG | Large text: best-practice |
|---|---|---|---|---|---|---|
| Landing | 0 | 0 | 0 | 0 | 0 | 0 |
| Student, cart | 0 | 0 | 0 | 0 | 0 | 0 |
| Student, population (2 lines) | 0 | 0 | 0 | 0 | 0 | 0 |
| Student after focusing a point (Right x4) | 0 | 0 | 0 | 0 | 0 | 0 |
| Student with practice feedback shown (extra) | 0 | 0 | 0 | 0 | 0 | 0 |
| Student error state (`#v1.not-valid`) | 0 | 0 | 0 | 0 | 0 | 0 |
| Teacher, empty | 0 | 0 | 0 | 0 | 0 | 0 |
| Teacher with both error boxes shown | 0 | 0 | 0 | 0 | 0 | 0 |
| Teacher with link created | 0 | 0 | 0 | 0 | 0 | 0 |
| Teacher, own-questions mode with a second line | 0 | 0 | 0 | 0 | 0 | 0 |
| Settings | 0 | 0 | 0 | 0 | 0 | 0 |
| About | 0 | 0 | 0 | 0 | 0 | 0 |
| Print | 0 | 0 | 0 | 0 | 0 | 0 |

Violations found: none (0 of 78 scans).

One thing axe could not decide: on every student view and on the print view, axe marked `color-contrast` as "incomplete" (needs review) for the text inside the SVG graph, because it cannot work out the background behind SVG text. That is not a violation and not a pass. As a stand-in, a script read the computed colours and calculated the ratios:

| Mode | Graph text vs background | Line 1 vs background | Line 2 vs background |
|---|---|---|---|
| Normal | 17.76:1 (text 14 to 16 px) | 10.04:1 | 8.71:1 |
| High contrast | 21:1 | 16.57:1 | 14.30:1 |
| Print page | 21:1 | 21:1 | not measured (cart has one line) |

axe checks only what a machine can check, which is a subset of WCAG. Zero violations does not mean the pages are accessible.

## Bundle sizes (measured)

Output of `node e2e/bundle-size.mjs`, unedited. Each file is gzipped separately at zlib level 9. "JS" is every `<script src>` and script preload the route's HTML references.

```
| Route        | JS files | JS gzip KB | JS raw KB | CSS gzip KB | HTML gzip KB | Total gzip KB | JS < 200 KB |
|--------------|----------|------------|-----------|-------------|--------------|---------------|-------------|
| /404/        | 6        | 171.8      | 560.9     | 2.6         | 3.0          | 177.4         | yes         |
| /_not-found/ | 6        | 171.8      | 560.9     | 2.6         | 3.0          | 177.4         | yes         |
| /about/      | 6        | 171.8      | 560.9     | 2.6         | 4.1          | 178.6         | yes         |
| /            | 6        | 171.8      | 560.9     | 2.6         | 3.5          | 177.9         | yes         |
| /print/      | 7        | 182.0      | 587.4     | 2.6         | 2.7          | 187.4         | yes         |
| /settings/   | 7        | 174.0      | 566.5     | 2.6         | 3.4          | 180.0         | yes         |
| /student/    | 7        | 186.6      | 602.0     | 2.6         | 2.8          | 192.0         | yes         |
| /teacher/    | 7        | 183.0      | 593.7     | 2.6         | 4.1          | 189.7         | yes         |

Total size of out/: 916.1 KB uncompressed in 56 files.
All JavaScript chunks in out/ (every route, excluding sw.js): 213.9 KB gzipped in 14 files.
Largest first-load JS: 186.6 KB gzipped on /student/ (target: under 200 KB).
```

The target (first-load JS under 200 KB gzipped) is met on every route, with 13.4 KB to spare on the largest (`/student/`, 186.6 KB). About 172 KB of that is the shared Next/React runtime that every route loads. The margin is small: a new dependency could push `/student/` over.

The service worker precaches every file in `out/`, so a first visit downloads all 14 chunks (213.9 KB gzipped) in the background.

## Lighthouse (run)

Lighthouse 13.6.0, default mobile emulation with simulated throttling, headless Chrome for Testing 159, one run per page, against http://localhost:4173. Single runs vary; treat performance numbers as rough.

| Page | Performance | Accessibility | Best practices | FCP | LCP | TBT | CLS | Speed index |
|---|---|---|---|---|---|---|---|---|
| `/student/?sample=cart` | 76 | 100 | 100 | 0.8 s | 4.0 s | 210 ms | 0.179 | 2.1 s |
| `/teacher/` | 98 | 100 | 100 | 0.9 s | 0.9 s | 150 ms | 0 | 0.9 s |

Caveats: the local server (`scripts/serve.mjs`) sends files uncompressed and with `no-cache`, so the simulated load is heavier than it would be on Vercel (which compresses). The student score is lower because of bug 3 below. The other pages were not audited with Lighthouse. A Lighthouse accessibility score of 100 is, like axe, only the machine-checkable subset.

## Bugs found

Most severe first. None were fixed (QA does not edit app code).

### Bug 1 (medium): the teacher page scrolls sideways at 320 px when "Large text" is on

- Where: `app/globals.css`, `.table-scroll` (about line 600) together with `.visually-hidden` (about line 163); the markup is the "Remove row N" button in `components/TeacherEditor.tsx`.
- Steps: Settings, turn on "Large text". Open `/teacher/` in a 320 px wide viewport (or a 1280 px window at 400% zoom).
- Expected: no horizontal page scroll; only the data entry table scrolls inside its own region (WCAG 1.4.10 Reflow).
- Actual: `document.documentElement.scrollWidth` is 379 with `clientWidth` 320, so the whole page scrolls sideways by 59 px. Measured the same in the desktop and mobile projects (381 px in WebKit).
- Cause: each Remove button contains `<span class="visually-hidden"> row N</span>`, which is `position: absolute`. `.table-scroll` has `overflow-x: auto` but is not positioned, so it does not clip absolutely positioned descendants. When the table is wider than the region, those 1 px spans sit outside the region and widen the page.
- Suggested fix: add `position: relative;` to `.table-scroll`. Checked by injecting that one rule in the browser: scrollWidth went back to 320. (Not checked: whether anything else changes visually.)
- Likely also affects any case where the entry table is wider than its region, for example a second line on a narrow screen without large text. That case was not measured.

### Bug 2 (low to medium): the page title never names the graph

- Where: `app/student/StudentClient.tsx` lines 12 to 14 and `app/print/PrintClient.tsx` lines 26 to 28 (`document.title = …` in an effect).
- Steps: open `/student/?sample=cart` (or any shared link, or `/print/?sample=cart`) and read the tab title.
- Expected (from the code): `Cart on a track: velocity vs time | HearGraph`, and `Printable: Cart on a track: velocity vs time | HearGraph` on the print page.
- Actual: `Student view | HearGraph` and `Printable version | HearGraph`, for every graph.
- Evidence: a probe logged the title over time on `/student/?sample=cart`: at 125 ms the effect set the worksheet title, and by 135 ms it was back to `Student view | HearGraph`. The framework re-applies the static metadata title after the effect runs.
- Impact: the page title is the first thing a screen reader announces on load, and it is how tabs, history and bookmarks are told apart. Every worksheet has the same title. A title is still present, so this is probably not a WCAG 2.4.2 failure on its own, but the intended behaviour does not work.
- Suggested fix (not tried): render `<title>{`${worksheet.title} | HearGraph`}</title>` inside the client component's JSX (React 19 hoists it into `<head>` and keeps it in sync) and remove the `document.title` effects.

### Bug 3 (low, performance): layout shift and late main content on the student page

- Where: `app/student/StudentClient.tsx` (the `loading` state) and `components/useWorksheet.ts`.
- Evidence: Lighthouse on `/student/?sample=cart`: cumulative layout shift 0.179 (above the 0.1 "good" limit), largest contentful paint 4.0 s under simulated mobile throttling, performance 76. `/teacher/` scored 98 with CLS 0.
- Cause: the exported HTML for `/student/` contains only "Loading the graph…". The worksheet is drawn after JavaScript runs, which pushes the "Built-in examples" list and the footer down.
- Suggested fix: give `main` a minimum height while loading (for example `min-height: 100vh`), so the footer does not jump. Not tried.

### Observations (not counted as bugs)

- The Sound toggle gets its on/off text from CSS (`button[aria-pressed]::after { content: ': off' }` in `app/globals.css`, about line 341) and also has `aria-pressed`. Chromium computes its accessible name as "Sound: off". A screen reader may therefore say the state twice, for example "Sound: off, toggle button, not pressed". Needs a listen with a real screen reader before deciding.
- In the supplementary WebKit run, Tab did not stop on links (it reached the graph in 1 press). That is Safari's default behaviour on macOS (links need Option+Tab unless the user changes a setting), not an app bug, but it means the skip link and "On this page" links are not Tab stops for Safari users with default settings.

## Supplementary WebKit run (not part of the pass/fail counts above)

`npx playwright install webkit` succeeded, so the suite was run once with `WEBKIT=1 npx playwright test --project=webkit` (Desktop Safari emulation on Windows, 1280x800). The tests were written for Chromium and were not adapted. Result: 76 passed, 13 failed.

| Failures | Count | Reason |
|---|---|---|
| Bug 1 (large-text reflow on `/teacher/`) and bug 2 (two title tests) | 3 | Same app bugs as in Chromium. |
| Tests that count Tab stops or expect the skip link as the first Tab stop (landing skip link, student Tab count, hash safety, 3 focus-visibility walks) | 6 | WebKit does not Tab to links by default (see observation above). Test assumption, not an app bug. |
| Copy link | 1 | Playwright's WebKit does not know the `clipboard-write` permission. Test limitation. |
| axe scans that ended with "Target page, context or browser has been closed" | 3 | The WebKit process closed during the scan. Not investigated; the same views passed in Chromium. |

So WebKit results are partial and say little beyond "the main flows that do not depend on Tab-to-link also work in Playwright's WebKit build". Playwright's WebKit on Windows is not Safari with VoiceOver.

## Not covered by automation

- Real screen-reader output. Nobody listened to NVDA, JAWS, VoiceOver, TalkBack or Narrator. The tests check that the live region text changes; they cannot tell whether a screen reader speaks it, speaks it once, or interrupts itself. `role="application"` behaviour (whether arrow keys reach the page in browse mode) differs between screen readers and was not checked.
- Real audio. The tests count AudioContext constructions. They do not check that any sound is audible, that pitch tracks the values, that the ticks are distinguishable, or that volume is comfortable.
- Real phones and tablets. "mobile" is Chromium emulating a Pixel 7. Touch exploration with TalkBack or VoiceOver, on-screen keyboards, and iOS Safari audio unlock rules were not tested.
- Safari and Firefox. One partial WebKit run (above); Firefox was not run.
- Braille displays, braille embossers, tactile graphics printers, and actual printing of the print page (only the on-screen page and the SVG download were checked).
- Windows High Contrast / forced-colours mode, operating-system reduced-motion, and browser zoom itself (zoom was emulated with a small viewport and deviceScaleFactor 2).
- Text spacing overrides (WCAG 1.4.12), focus-indicator contrast, target sizes, and reading order as heard.
- Whether the descriptions and questions are understandable and useful to a student. That needs people.
- Speech input, switch access, and keyboard use with sticky keys or similar aids.
- The deployed Vercel site (only the local `out/` build was tested), and the "copying was blocked" clipboard fallback.
- Limits: 50-point graphs, very long titles or links, and unusual number formats were not exercised end to end (the unit tests in `tests/` may cover the parsing).

## How to run

```
npx playwright install chromium     # once
npm run e2e                         # desktop + mobile against http://localhost:4173 (starts scripts/serve.mjs if needed)
BASE_URL=https://example.vercel.app npm run e2e    # against a deployment
node e2e/bundle-size.mjs            # bundle table
WEBKIT=1 npx playwright test --project=webkit      # optional
```

Files: `playwright.config.ts`, `e2e/fixtures.ts` (console-error fixture, helpers), `e2e/landing.spec.ts`, `e2e/student.spec.ts`, `e2e/teacher.spec.ts`, `e2e/settings-print.spec.ts`, `e2e/axe.spec.ts`, `e2e/layout.spec.ts`, `e2e/offline.spec.ts`, `e2e/bundle-size.mjs`. Per-run axe results are written to `e2e/.axe-results/<project>.jsonl`.
