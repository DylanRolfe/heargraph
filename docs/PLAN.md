# HearGraph: build plan

Written at the start of the build (Sun Nov 15, 2026). This is the contract between the lead and the sub-agents.

## One sentence

A teacher pastes the numbers behind a graph and gets a link; a student who is blind or has low vision explores that graph by keyboard, sound, plain-language description and data table, then answers practice questions.

## Scope control

In: everything in "Core demo flow" of the build prompt.
Out: image digitizing, LLM text, accounts, storage, analytics, more than 2 series.
Cut order if the demo gate is at risk: printable version, second series, settings persistence, offline mode.

## Stack

- Next.js 16 (App Router), React 19, TypeScript, static export (`output: 'export'`), hosted on Vercel free tier.
- No runtime dependencies beyond `next`, `react`, `react-dom`. Plain CSS, hand-written SVG, Web Audio API, hand-written service worker.
- Vitest for `/lib`; Playwright + axe-core for end-to-end and accessibility checks.

## File tree

```
app/
  layout.tsx          shell: skip link, header nav, footer, settings + service worker bootstrap
  globals.css         all styles (themes via data attributes on <html>)
  page.tsx            landing: two big buttons
  student/page.tsx    student view: reads #hash (shared link) or ?sample=id
  teacher/page.tsx    teacher editor: CSV paste / table editor, questions, create link
  settings/page.tsx   audio, pitch range, sweep speed, contrast, text size, motion
  print/page.tsx      printable high-contrast version (reads the same #hash)
  about/page.tsx      limitations, how it works, credits
components/
  SiteChrome.tsx      header, nav, footer
  SettingsProvider.tsx  context + localStorage + <html> data attributes
  GraphExplorer.tsx   SVG graph, keyboard navigation, aria-live, sweep control
  GraphSvg.tsx        pure SVG drawing (shared with print)
  DataTable.tsx       caption, th scope, units
  Practice.tsx        questions, feedback
  WorksheetView.tsx   summary + graph + table + practice
  TeacherEditor.tsx   editor form
  ServiceWorker.tsx   registers /sw.js
lib/
  types.ts            shared contracts (lead)
  data.ts             CSV parsing + validation            (agent B)
  describe.ts         analysis + plain-language text       (agent B)
  questions.ts        question templates + answer checking (agent B)
  share.ts            URL-hash encoding                    (agent B)
  samples.ts          3 synthetic worksheets               (agent B)
  audio.ts            Web Audio sonification               (lead)
  settings.ts         settings shape, defaults, storage    (lead)
tests/                Vitest, one file per lib module
e2e/                  Playwright + axe
scripts/gen-sw.mjs    writes out/sw.js with the list of built files to precache
public/               manifest.webmanifest, icons
docs/                 PLAN, TESTING, DEVPOST, VIDEO_SCRIPT, captions.srt, TRANSCRIPT, SHOTLIST, SOURCES, CHECKLIST
```

## Interfaces

Types live in `lib/types.ts`. Function signatures:

```ts
// lib/data.ts
parseCsv(text: string): ParseResult
parseHeaderCell(cell: string): { label: string; unit: string }   // "Time (s)" -> {label:"Time", unit:"s"}
validateWorksheet(w: Worksheet): string[]                        // [] when valid
tableToCsv(x: XAxis, series: Series[]): string

// lib/describe.ts
formatNumber(n: number): string                 // up to 3 significant decimals, no trailing zeros, real minus sign "-"
spokenUnit(unit: string, value: number): string // "m/s" -> "metres per second", "s" + 1 -> "second"
analyzeSeries(x: number[], y: number[]): SeriesAnalysis
pointTags(a: SeriesAnalysis, index: number): PointTag[]
describePoint(w: Worksheet, seriesIndex: number, pointIndex: number): string
describeSeries(w: Worksheet, seriesIndex: number): string
describeWorksheet(w: Worksheet): string[]       // one paragraph per series (plus an overview line when 2 series)

// lib/questions.ts
generateQuestions(w: Worksheet): Question[]     // up to 3, deterministic
checkAnswer(q: Question, input: string): CheckResult
parseNumberInput(input: string): number | null

// lib/share.ts
encodeWorksheet(w: Worksheet): string           // "v1." + base64url(JSON), no leading '#'
decodeWorksheet(hash: string): DecodeResult     // accepts with or without leading '#'

// lib/samples.ts
samples: Sample[]                               // ids: "cart", "temperature", "population"
getSample(id: string): Sample | undefined
```

## URL schema

- Student view of a shared worksheet: `/student/#v1.<payload>`
- Student view of a sample: `/student/?sample=cart` (default when there is no hash)
- Printable: `/print/#v1.<payload>` or `/print/?sample=cart`
- Teacher editor pre-filled from a link: `/teacher/#v1.<payload>`

`<payload>` is base64url (no padding) of UTF-8 JSON in this compact shape:

```json
{
  "t": "title",
  "x": ["label", "unit"],
  "s": [["label", "unit"], ["label2", "unit2"]],
  "d": [[x, y1, y2], ...],
  "q": [
    ["n", "prompt", answer, tolerance, "unit", "explanation"],
    ["c", "prompt", ["choice", ...], "answer", "explanation"],
    ["t", "prompt", "answer", "explanation"]
  ]
}
```

The hash never leaves the browser (it is not sent in HTTP requests). The decoder treats it as untrusted: it checks the version, every type, every length cap, finite numbers, strictly increasing x, and runs `validateWorksheet`. Unknown versions give a clear error.

## Announcement rules (screen reader)

- The graph is one focus stop (`role="application"`, labelled, with instructions via `aria-describedby`).
- Each move writes one short sentence to a polite live region: `Time 4 seconds, velocity 0 metres per second, crossing zero. Point 5 of 9.`
- Keys: Left/Right move, Home/End jump, Up/Down switch series (when 2), Space plays or stops the sweep, M / N / Z jump to maximum / minimum / next zero crossing, S repeats the summary.
- Nothing is conveyed by sound alone: every tick has a matching text tag. Nothing is conveyed by colour alone: the two series differ in marker shape and line dash.
- No audio ever plays without a key press or button press.

## Audio mapping

- y range (min to max across visible series) maps linearly onto log-frequency between the settings' low and high notes (default 220 Hz to 880 Hz).
- Sine tone, 15 ms attack and 60 ms release to avoid clicks, peak gain 0.2.
- Sweep: one tone per point, evenly spaced, total time from settings (default 4 s). Ticks: zero crossing = short low click, maximum = high double tick, minimum = low double tick.
- Second series uses a triangle wave so it sounds different.

## Checkpoints (Eastern)

| Checkpoint | When | Exit criteria |
|---|---|---|
| C0 | Tue Nov 17, 9:00 PM | PLAN.md, scaffold deploys, sample data defined |
| C1 | Wed Nov 18, 6:00 PM | `/lib` tests pass; keyboard navigation and announcements work locally |
| DEMO GATE | Thu Nov 19, 12:00 PM | student and teacher flows work on the live URL, desktop and phone, no console errors |
| C2 | Thu Nov 19, 9:00 PM | QA fixes merged; TESTING.md has Dylan's manual pass |
| C3 | Fri Nov 20, 10:00 AM | docs final; final production QA |
| FINISH | Fri Nov 20, 2:00 PM | frozen |

The build started Sun Nov 15, so checkpoints may be hit early. Human steps are not requested before Tue Nov 17, 2:00 PM unless they take under 5 minutes.

## Sub-agents

- A. Lead: this plan, `lib/types.ts`, `/app`, `/components`, `lib/audio.ts`, `lib/settings.ts`, integration, deploy.
- B. Core logic: `lib/data.ts`, `lib/describe.ts`, `lib/questions.ts`, `lib/share.ts`, `lib/samples.ts`, `tests/*`.
- C. Frontend/accessibility: done by the lead in this run (one writer for `/app` and `/components` avoids conflicts).
- D. QA: Playwright + axe on the built site and the live URL; `docs/TESTING.md`; screen-reader checklist.
- E. Submission: prior-art research and `docs/SOURCES.md` run in parallel with the build; README and Devpost text are written after QA so they quote real results.
