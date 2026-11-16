# HearGraph

**Graphs you can hear, read and explore by keyboard.**

A teacher pastes the numbers behind a graph and gets a link. A student who is blind or has low vision opens the link and explores the graph by keyboard, sound, plain-language description and data table, then answers practice questions with explained feedback.

- **Live demo:** https://heargraph.vercel.app (no login, no personal information needed)
- **Student example:** https://heargraph.vercel.app/student/?sample=cart
- **Source:** https://github.com/DylanRolfe/heargraph
- Built for [AccessED Hacks](https://accessed-hacks.devpost.com/) (Oct 17 to Nov 20, 2026) by Dylan Rolfe, solo.

## Who it is for

- **The learner:** a high-school or first-year university student who is blind or has low vision, uses a screen reader or magnification, and is working through a physics or math worksheet whose graphs are images.
- **The teacher or TA:** has the numbers behind the graph and wants the student to answer the same questions independently.

## The barrier, and the change

**Before:** the worksheet graph is an image. A screen reader says "image" or a short label such as "graph of velocity". The student cannot read a value, find a maximum, or tell when the quantity crosses zero without asking someone.

**After:** the teacher pastes the data table into HearGraph and shares a link. The student presses `Z` in the graph and hears: "Time 4 seconds, velocity 0 metres per second, crossing zero. Point 5 of 9."

The learner in this example is illustrative, not a real person. The numbers are synthetic.

## What it does

| Part | What the student gets |
|---|---|
| Summary | A short plain-language description first: start, end, shape, highest, lowest, zero crossings. |
| Graph | One Tab stop. Left/Right move point to point and each point is announced. Home/End jump. `M`, `N`, `Z` jump to the highest value, lowest value and zero crossing. `S` reads the summary. Space plays the graph as sound (pitch follows the value; distinct ticks for zero, highest and lowest). Up/Down switch lines when there are two. |
| Low vision | High-contrast theme, large-text option, the focused point is ringed and labelled with its values, on-screen buttons for everything the keys do. |
| Data table | Real table with caption, column and row headers, and units. |
| Practice | Up to 3 questions (written by the teacher or generated from the data), tolerant answer checking, explained feedback, no timer, no score. |
| Teacher | Paste CSV or type into an accessible table editor (up to 50 points, 1 or 2 lines), then "Create link". The data is encoded in the URL hash. No server, no account, nothing stored. Printable high-contrast version included. |
| Settings | Sound on/off, pitch range, playback speed, high contrast, large text, reduced motion. Saved in `localStorage` only. |
| Offline | A service worker saves the app on first load, so it works without a connection afterwards. |

## Screenshots

_Add screenshots here before submitting (see `docs/SHOTLIST.md`):_

- `docs/screenshots/01-landing.png`
- `docs/screenshots/02-student-graph.png`
- `docs/screenshots/03-practice-feedback.png`
- `docs/screenshots/04-teacher-editor.png`
- `docs/screenshots/05-high-contrast.png`

## Setup

Requires Node.js 20 or newer (built and tested with Node 22.21).

```bash
npm install        # install dependencies
npm run dev        # development server at http://localhost:3000
npm test           # unit tests (Vitest)
npm run build      # static export to ./out, plus the offline service worker
npm start          # serve ./out at http://localhost:4173
npm run e2e        # Playwright + axe-core tests against ./out (run `npx playwright install chromium` once)
```

To run the end-to-end tests against the deployed site: `BASE_URL=https://heargraph.vercel.app npm run e2e`.

The offline service worker is only registered in the production build (`npm run build` then `npm start`), not in `npm run dev`.

## How it works

- **Next.js (App Router) + TypeScript, static export.** There is no backend. Hosting is static files on Vercel.
- **`lib/data.ts`** parses pasted CSV (commas, tabs or semicolons; optional header; units in brackets), reports every problem with its row number, and sorts unsorted rows with a notice.
- **`lib/describe.ts`** finds the highest and lowest values, rising and falling stretches, and zero crossings. A crossing between two rows is estimated with a straight line and always labelled "about". It writes the summary and the per-point announcements from templates. No AI model is involved at runtime.
- **`lib/questions.ts`** generates questions from templates and checks answers tolerantly ("4", "4 s", "4.0 seconds" and a Unicode minus sign all work).
- **`lib/share.ts`** encodes the worksheet as versioned, compact JSON in the URL hash (`#v1.…`) and validates everything when decoding, because a link is untrusted input.
- **`lib/audio.ts`** uses the Web Audio API. Values map linearly onto log-frequency (default 220 to 880 Hz) with a short fade in and out. Sound never starts without a key press or button press.
- **`components/GraphExplorer.tsx`** is the keyboard-navigable graph: one focus stop with `role="application"`, a polite live region for announcements, and a hand-drawn SVG.
- **`scripts/gen-sw.mjs`** writes the service worker with the list of built files after each build.

More detail: [`docs/PLAN.md`](docs/PLAN.md).

## Testing

See [`docs/TESTING.md`](docs/TESTING.md) for exactly what was tested, with what, when, and what failed. In short: unit tests, automated end-to-end and axe-core checks, and the builder's own manual keyboard and screen-reader passes. **It has not been tested with blind or low-vision students.** Automated accessibility checks find only some problems.

## Limitations

- The teacher must supply the numbers. HearGraph cannot read data out of a picture of a graph.
- One or two lines only, 2 to 50 points.
- Sonification supplements, and does not replace, tactile graphics or a teacher of students with visual impairments.
- Tested only by the builder, not with blind or low-vision students. No learning gains are claimed.
- Values between data points are straight-line estimates and are labelled "about".
- Braille displays, braille embossers and tactile graphics printers are untested. The printable version is a high-contrast page and SVG only.
- Descriptions and questions come from templates, in English only. Unusual labels can read awkwardly in generated questions; teachers can write their own.
- The data lives in the link: anyone with the link can read it, and very long links may be cut short by some messaging apps.
- The app icon is SVG only, so some phones may not offer "install".

## Prior art

HearGraph is not the first accessible graph tool, and existing tools are more capable. Desmos has Audio Trace and screen-reader support in a full graphing calculator. Highcharts Sonification Studio lets anyone import data and sonify it without code. Chart2Music and MAIDR are libraries developers add to charts (MAIDR also supports braille). SAS Graphics Accelerator and PhET's inclusive simulations go further still.

HearGraph is narrower: a teacher pastes a small table, shares a link with no accounts or installs, and the student gets a description, keyboard exploration, sound, a table and practice questions on one page. Details and links: [`docs/SOURCES.md`](docs/SOURCES.md).

## Credits

- Libraries: Next.js, React, TypeScript (runtime); Vitest, Playwright, axe-core (testing). No other runtime dependencies, no fonts, no images, no datasets.
- Sound: generated in the browser with the Web Audio API. No audio files.
- Sample worksheets: synthetic numbers written for this project.
- Standards and research consulted: [`docs/SOURCES.md`](docs/SOURCES.md).

## AI assistance disclosure

HearGraph was built by Dylan Rolfe with an AI coding agent (Claude Fable 5.2 in Claude Code) and sub-agents it started for core logic, prior-art research and automated QA.

- **Dylan decided:** the learner, the barrier, the product definition and demo flow, what is out of scope, the stack, the honesty rules, and the schedule. These are in the build brief he wrote.
- **The AI agent did:** wrote the code, unit tests, end-to-end tests and first drafts of all documentation; researched prior art (links listed in `docs/SOURCES.md`); ran the automated checks.
- **Dylan reviewed and tested:** see the "Manual passes by Dylan" section of [`docs/TESTING.md`](docs/TESTING.md), which records only what he actually did.

## Event contribution

Everything in this repository was written during the event window (Oct 17 to Nov 20, 2026). There is no pre-existing code.

## Licence

MIT. See [`LICENSE`](LICENSE).
