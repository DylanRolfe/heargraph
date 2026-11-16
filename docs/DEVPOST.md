# Devpost submission text (paste-ready)

Replace `<VIDEO_URL>` before pasting. Anything in [square brackets] is for Dylan to complete truthfully or delete.

---

## Project name

HearGraph

## Short pitch (tagline)

Graphs you can hear, read and explore by keyboard: a teacher pastes the numbers, a blind or low-vision student gets the graph.

## Team

Dylan Rolfe (solo). First-year Mechatronics Engineering student, University of Waterloo, Ontario, Canada.

## Links

- Working demo: https://heargraph.vercel.app
- Student example (start here): https://heargraph.vercel.app/student/?sample=cart
- Source code: https://github.com/DylanRolfe/heargraph
- Video (captioned, with transcript): <VIDEO_URL>

---

# Learning story

## The learner and the barrier

**The learner:** a high-school or first-year university student who is blind or has low vision. They use a screen reader or magnification. They are working through a physics or math worksheet.

**The barrier:** the graphs on the worksheet are images. A screen reader reads an image as "image", or as a short label like "graph of velocity". From that, the student cannot read a value, find the highest point, or tell when the quantity crosses zero. They have to wait for someone to describe the graph to them.

W3C's accessibility guidance treats graphs as "complex images" that need more than short alt text: a description of the essential information, and often the data itself (source in `docs/SOURCES.md`).

**The second user:** the teacher or TA. They usually have the numbers behind the graph. They want the student to answer the same questions as everyone else, independently.

The learner described here is an illustrative example, not a real person.

## What HearGraph does

The teacher pastes a small data table (or types it into a table editor), adds a title, and presses "Create link". The data is stored inside the link itself. There is no account, no upload and no database.

The student opens the link and gets the same graph five ways:

1. **A short description first**, in plain language: where the line starts and ends, whether it rises or falls, the highest and lowest values, and where it crosses zero.
2. **Keyboard exploration.** The graph is one Tab stop. Left and Right move point to point, and each point is announced: "Time 4 seconds, velocity 0 metres per second, crossing zero." Home and End jump to the ends. M, N and Z jump to the highest value, lowest value and zero crossing.
3. **Sound.** Space plays the graph left to right. Pitch follows the value. A click marks zero, two high ticks mark the highest value, two low ticks mark the lowest. Every sound cue also appears as text. Sound never starts by itself.
4. **A real data table** with a caption, headers and units.
5. **Practice questions** (the teacher's own, or generated from the data) with explained feedback, no timer and no score.

For low-vision students there is a high-contrast theme, a large-text option, a ringed and labelled focus point, and on-screen buttons for everything the keys do. After the first visit the app works offline.

## One before-and-after example

A synthetic worksheet: **"Cart on a track: velocity vs time"**. Nine points, from 0 to 8 seconds. Question 1 asks: *"At what time does the cart stop?"*

**Before.** The graph is an image with the alt text "graph of velocity". The screen reader says: "graph of velocity, image." The student cannot answer the question without a sighted person reading the graph to them.

**After.** The teacher pastes this table into HearGraph and shares the link:

```
Time (s), Velocity (m/s)
0, 6
1, 4.5
2, 3
3, 1.5
4, 0
5, -1.5
6, -3
7, -4.5
8, -6
```

The student opens the link. The page reads: *"Velocity starts at 6 m/s and ends at -6 m/s. It falls steadily the whole way. It reaches 0 m/s at 4 s and is negative after that. Highest value: 6 m/s at 0 s. Lowest value: -6 m/s at 8 s."*

Then, by keyboard only:

| Keys | What the screen reader is sent |
|---|---|
| Tab to the graph | "Graph: Cart on a track: velocity vs time" and the key instructions |
| Right arrow | "Time 1 second, velocity 4.5 metres per second. Point 2 of 9." |
| Z | "Time 4 seconds, velocity 0 metres per second, crossing zero. Point 5 of 9." |
| Right arrow, twice | "Time 6 seconds, velocity -3 metres per second. Point 7 of 9." |
| Space | The graph plays as a falling pitch with a click at zero. |

The student types "4" into Question 1 and hears: *"Correct. The cart stops when its velocity is 0 m/s…"*. They answered it without anyone reading the graph to them.

This shows what the tool does. It is not a claim about learning outcomes: HearGraph has not been tested with students.

## How we built it

- Next.js (App Router) and TypeScript, exported as a static site and hosted on Vercel's free tier. No backend.
- Four small pure modules with unit tests: CSV parsing and validation, description and analysis, question generation and answer checking, and URL-hash encoding.
- A hand-drawn SVG graph, a keyboard handler, and an ARIA live region for announcements.
- The Web Audio API for sound. No audio files.
- A small hand-written service worker for offline use.
- No runtime libraries beyond Next.js and React. No analytics. No AI model runs in the app.

## Inclusive design and honest testing evidence

What was designed in:

- Text first: the description and table come from the same data as the graph, so sound and vision are both optional.
- Full keyboard access, a skip link, visible focus, one heading structure per page.
- Nothing by colour alone (two lines differ by marker shape and dash) and nothing by sound alone (every tick has a text label).
- High contrast, large text and reduced motion settings; the layout reflows at 320 px.
- Plain language, no timer, no score, and feedback that explains instead of judging.
- Low bandwidth: first-load JavaScript is 172 to 187 KB gzipped depending on the page (measured). A service worker saves the app for offline use after the first visit [confirm on the live site before submitting; see docs/TESTING.md].

What was actually tested (full log in `docs/TESTING.md`):

[Paste the "Summary of evidence" section from docs/TESTING.md here. It lists the automated checks, the builder's manual passes with named screen readers and browsers, dates, and failures.]

What was **not** tested: use by blind or low-vision students, braille displays, embossers. This is builder testing, not user testing.

## Challenges

- **The link is the database.** Putting the data in the URL hash means no server and no privacy risk, but ordinary "skip to content" links also use the hash and would have wiped the data. In-page links had to move focus without touching the hash.
- **Saying enough but not too much.** A screen-reader announcement has to be short and put the important part first. Units had to be spoken as words ("metres per second") with correct singular and plural.
- **Honest numbers.** A zero crossing that falls between two rows is only an estimate, so it is always labelled "about".
- **Sound that is not annoying.** Tones needed a short fade to avoid clicks, a comfortable pitch range, and a rule that nothing plays without a key press.
- [Add one challenge from your own experience running the screen-reader checklist.]

## What we learned

- An accessible graph is mostly an accessible *table and sentence*; the sound and the picture are the extras.
- Automated checks find only some accessibility problems. The rest needs a person with a screen reader.
- Existing tools (Desmos Audio Trace, Highcharts Sonification Studio, Chart2Music, MAIDR) already do audio graphs well. The useful gap was smaller: making it a two-minute job for a teacher with no account or install.
- [Add what you personally learned from the manual screen-reader pass.]

## Limitations

- The teacher must supply the numbers. HearGraph cannot read a picture of a graph.
- One or two lines, 2 to 50 points.
- Sonification supplements, and does not replace, tactile graphics or a teacher of students with visual impairments.
- Tested only by the builder, not with blind or low-vision students. No learning gains are claimed.
- Values between data points are straight-line estimates, labelled "about".
- Braille displays, embossers and tactile printers are untested.
- English only; generated questions come from templates.
- Anyone with the link can read the data, so it must not contain names or grades.

## Prior art

HearGraph is not the first tool of this kind and does not claim to be.

- **Desmos** has Audio Trace and screen-reader support inside a full graphing calculator.
- **Highcharts Sonification Studio** is a free, no-code tool for importing data and sonifying it.
- **Chart2Music** and **MAIDR** are libraries developers add to charts for keyboard and sound exploration (MAIDR also supports braille).
- **SAS Graphics Accelerator** and **PhET** inclusive simulations offer much richer experiences.

These are more capable than HearGraph. HearGraph is narrower: a pasted table becomes a shareable worksheet link with a description, keyboard exploration, sound, a table and practice questions, with no account, install or server. Sources and links: `docs/SOURCES.md` in the repository.

## What's next

- Test with blind and low-vision students and a teacher of students with visual impairments, and change the design based on what they say.
- Help teachers get numbers out of an existing graph image (not built; out of scope for this event).
- Braille display checks and a tested tactile-ready export.
- More graph types and languages.

## Credits and AI disclosure

- **Libraries:** Next.js, React, TypeScript; Vitest, Playwright and axe-core for testing. Web Audio API for sound.
- **Datasets and assets:** none. The three sample worksheets use synthetic numbers written for this project. No images or audio files from other sources. One typeface from another source: Geist Sans (Vercel with basement.studio, SIL Open Font License 1.1), self-hosted.
- **Research and standards:** listed with links in `docs/SOURCES.md`.
- **AI assistance:** HearGraph was built by Dylan with an AI coding agent (Claude Fable 5.2 in Claude Code) and sub-agents. Dylan decided the learner, barrier, product definition, scope, stack, honesty rules and schedule. The AI agent wrote the code, the tests and the first drafts of this text, and researched prior art. Dylan [reviewed … / ran the manual screen-reader checklist on … / recorded the video — complete truthfully from docs/TESTING.md].

## Event contribution statement

All code and documentation were written during the event window (Oct 17 to Nov 20, 2026). There is no pre-existing code or prior project.

## Setup instructions (for judges)

Nothing to install. Open https://heargraph.vercel.app in any modern browser. No login, and no personal information is asked for.

To run it locally: Node.js 20+, then `npm install`, `npm run build`, `npm start`, and open http://localhost:4173.
