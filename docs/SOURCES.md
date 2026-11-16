# HearGraph sources

All links were opened and checked on 2026-11-15 by an AI research sub-agent; Dylan should spot-check them before submitting.

How the checking was done:

- Every URL below was opened on 2026-11-15. Most were read with a web-fetch tool.
- Pages marked **(browser)** only load with JavaScript or blocked the fetch tool, so they were opened in a real browser pane and the visible text was read.
- One PDF (Sharif et al.) was downloaded and its first page was read as text.
- Claims are paraphrased. Direct quotes are short and in quotation marks.
- Anything that could not be confirmed is listed in section 5, not stated as fact.

---

## 1. Prior art

HearGraph is a small, narrow tool. It is not the first tool to sonify graphs, and it is not the most capable. Several tools below do far more. The honest difference is the combination: a teacher pastes a small table, gets a link with the data in the URL hash, and the student gets keyboard exploration, a sound sweep, a text description, a data table and practice questions on one page, with no install and no account.

### Summary table

| Tool | Who makes it | What it is (verified) | Main difference from HearGraph |
|---|---|---|---|
| Desmos Audio Trace and accessibility features | Desmos Studio (a public benefit corporation) | Full graphing calculators with audio trace, screen reader and braille support, tactile export | Far more capable. A full calculator for equations. HearGraph is a small worksheet page for one data table, with practice questions. |
| Chart2Music | Open-source project (GitHub: julianna-langston) | MIT-licensed JavaScript library that adds sound, keyboard and screen reader support to charts | A developer library. Someone has to write code. HearGraph is a finished page a teacher uses without coding. |
| MAIDR | (x)Ability Design Lab, University of Illinois Urbana-Champaign | Open-source library giving braille, text, sonification and review modes for statistical charts | More modalities and many more chart types. Needs code (JavaScript, Python or R). HearGraph has no braille mode. |
| Highcharts sonification and accessibility modules | Highsoft (Highcharts) | Charting library modules for audio charts, keyboard navigation and screen reader support | A commercially licensed developer library. Far more chart types and options. |
| Highcharts Sonification Studio | Highsoft with the Georgia Tech Sonification Lab | Free web tool to import, edit, visualise and sonify data without code or login | The closest no-code tool found. It is a general sonification workbench. HearGraph is narrower: a student-facing link with a description and practice questions. |
| SAS Graphics Accelerator | SAS | Free browser extension giving text descriptions, tabular data and interactive sonification of charts | Needs a Chrome extension install. Much more capable for data analysis. |
| PhET Interactive Simulations inclusive features | University of Colorado Boulder (PhET) | Science and maths simulations with sonification, interactive description, voicing and alternative input | Whole simulations, professionally designed. Not a tool for a teacher's own data table. |
| Apple Audio Graphs | Apple | Operating-system API that lets VoiceOver play a chart as sound | Only for apps on Apple platforms, and the app developer must adopt it. HearGraph is a web page. |
| Sonification Sandbox | Georgia Tech Sonification Lab | Earlier research tool for auditory graphs; predecessor of Highcharts Sonification Studio | Older research software. See "Could not verify" for details that were not confirmed. |
| TwoTone | Sonify, with support from Google News Initiative | Free open-source web app that turns a dataset into music without code | Aimed at data-to-music and storytelling, not at screen-reader graph reading or practice questions. |
| Tactile graphics (BANA guidelines, APH, TVIs) | Braille Authority of North America and others | Established practice and standards for raised-line graphics | Not a competitor. HearGraph supplements tactile graphics and a teacher of students with visual impairments. It does not replace them. |

### Notes on each

**Desmos accessibility features and Audio Trace** — Desmos Studio

- Accessibility page **(browser)**: https://www.desmos.com/accessibility
- Audio Trace help article **(browser)**: https://help.desmos.com/hc/en-us/articles/37064105800333-Audio-Trace
- Introduction to Accessibility Features **(browser)**: https://help.desmos.com/hc/en-us/articles/4404860698253

What was verified: Desmos says its tools meet WCAG 2.2. It lists Audio Trace, keyboard navigation, screen reader and refreshable braille support (Nemeth and UEB), export for braille embossers, high contrast and large display options, and author-written descriptions. In Audio Trace, pitch follows the curve, the sound pans left to right, a static effect plays when values are negative, and pops play at intersections. Arrow keys move a point along the graph. Tab jumps between "points of interest" such as intercepts and intersections.

Honest difference: Desmos already does almost everything HearGraph's sound and keyboard features do, and much more. HearGraph's sound cues (pitch for y, a tick at zero crossings) are similar in spirit to Audio Trace. HearGraph is not a calculator. It only differs in being a one-page worksheet built from a pasted table, shared as a link, with a generated description and practice questions.

**Chart2Music** — open-source project

- Docs: https://chart2music.com/docs/
- Repository: https://github.com/julianna-langston/chart2music

What was verified: The project describes itself with the line "Chart2Music turns charts into music so the blind can hear data." It is MIT licensed. It works beside charts from other libraries or images. Users focus the chart and use left and right arrow keys to explore it with sound. The project says its team includes blind people in design, development and testing.

Honest difference: Chart2Music is a library for developers. Its keyboard-plus-sound model is the same basic idea as HearGraph's and is more mature. HearGraph is a ready-made page for teachers who cannot write code, and it adds practice questions.

**MAIDR (Multimodal Access and Interactive Data Representation)** — (x)Ability Design Lab, University of Illinois Urbana-Champaign

- Site: https://maidr.ai/
- Repository: https://github.com/xability/maidr
- Paper (CHI 2024 preprint): https://arxiv.org/abs/2403.00717

What was verified: MAIDR is an open-source JavaScript/TypeScript library, licensed GPL-3.0-or-later. It offers braille, text and sonification, plus a review mode, toggled by keyboard. It supports many plot types (bar, box, heatmap, histogram, line, scatter and more) and has Python and R bindings. The paper reports a user study with 11 blind participants.

Honest difference: MAIDR is far more capable, is backed by published research, and supports refreshable braille. HearGraph has no braille mode and handles only a small data table. MAIDR needs code to set up. HearGraph does not.

**Highcharts sonification and accessibility modules** — Highsoft

- Sonification docs: https://www.highcharts.com/docs/sonification/getting-started
- Accessibility module docs: https://www.highcharts.com/docs/accessibility/accessibility-module

What was verified: The sonification module plays chart data as non-speech audio. The accessibility module lists keyboard navigation, screen reader support, low vision features, tactile export and sonification. The accessibility page says the module comes with every Highcharts licence and mentions a free education licence.

Honest difference: Highcharts is a professional charting library with many chart types. It needs a developer and, for many uses, a licence. HearGraph is a single fixed page.

**Highcharts Sonification Studio** — Highsoft with the Sonification Lab at Georgia Institute of Technology

- Home page **(browser)**: https://sonification.highcharts.com/

What was verified: The page says the tool is free, needs no login, and aims to let people import, edit, visualise and sonify data "without having to write code". It is open source under the BSD 3-clause licence (excluding dependencies). It lists "Better sonification navigation for screen reader users" as a planned feature.

Honest difference: This is the closest existing no-code, no-login tool. It is a general workbench for making audio charts. HearGraph is narrower: the output is a student worksheet link with point-by-point screen reader announcements, a text description and practice questions.

**SAS Graphics Accelerator** — SAS

- Product page: https://support.sas.com/software/products/graphics-accelerator/index.html

What was verified: A free Chrome browser extension. It gives alternative presentations of charts: text descriptions, tabular data and interactive sonification. It can import CSV, TSV and XLSX files. It works with JAWS, NVDA and VoiceOver.

Honest difference: Much more capable for real data work. It must be installed as a browser extension, which may not be possible on locked-down school devices. HearGraph needs only a link.

**PhET Interactive Simulations: inclusive features** — University of Colorado Boulder

- Inclusive features page **(browser)**: https://phet.colorado.edu/en/inclusive-design/features

What was verified: PhET lists Alternative Input, Sound and Sonification, Voicing, Interactive Description (used with a screen reader), Pan and Zoom and more. It describes sonifications as sounds "carefully mapped to changing values in the simulation". It also notes that not every feature is in every simulation.

Honest difference: PhET builds complete, researched simulations. HearGraph is not a simulation. It only presents a teacher's own small data table.

**Apple Audio Graphs** — Apple

- Documentation: https://developer.apple.com/documentation/accessibility/audio-graphs (text read from https://developer.apple.com/documentation/accessibility/audio-graphs.md)
- WWDC21 session "Bring accessibility to charts in your app": https://developer.apple.com/videos/play/wwdc2021/10122/

What was verified: App developers describe a chart to the system (using `AXChart` and `AXChartDescriptor`). VoiceOver then builds an audio version. The docs say the x-axis is typically played as time and the y-axis as pitch. The session shows VoiceOver users scrubbing through data and hearing a spoken summary.

Honest difference: This is a built-in platform feature and is well designed. It only helps inside apps on Apple devices whose developers adopt it. HearGraph is a web page that works in a browser on any device.

**Sonification Sandbox** — Georgia Tech Sonification Lab

- Verified only through the Highcharts Sonification Studio page above, which names the Georgia Tech Sonification Lab as the original authors of "a tool called the Sonification Sandbox".

Honest difference: It is an earlier research tool. Its successor (Highcharts Sonification Studio) is the fairer comparison.

**TwoTone** — Sonify, supported by Google News Initiative

- Site: https://twotone.io/

What was verified: The page calls it "A free open-source web app to turn data into music." It says no code is needed and that it was originally developed by Datavized Technologies.

Honest difference: TwoTone is about turning data into music. It is not designed around screen reader announcements, a data table or practice questions.

**Tactile graphics practice** — Braille Authority of North America (BANA), APH, Perkins / Paths to Literacy, NCAM

- BANA tactile graphics guidelines page (2010 edition): https://www.brailleauthority.org/tg/
- BANA guidelines, online table of contents: https://www.brailleauthority.org/tg/web-manual/toc.html
- BANA page on the 2022 edition: https://brailleauthority.org/node/49
- Paths to Literacy, "Creating Large Print and Tactile Graphs" (Gwyn McCormack): https://www.pathstoliteracy.org/creating-large-print-and-tactile-graphs
- NCAM (GBH) Accessible Digital Media Guidelines, Guideline F: Graphs (archived resource): https://www.wgbh.org/foundation/services/ncam/guideline-f-graphs

What was verified: BANA publishes "Guidelines and Standards for Tactile Graphics". The 2022 page says they give transcribers, educators and producers information about best practices. The manual has a unit on "Mathematical and Scientific Diagrams". The 2010 page says hard copies are available through APH. Paths to Literacy says students with visual impairments "must be specifically taught how to interpret tactile graphics". NCAM's guideline describes tactile graphs as "one of the most thorough ways" to convey static graphs to blind users, and also lists text descriptions, tones and keyboard exploration as techniques.

Why this matters for HearGraph: Sound and text are a supplement. A student who reads tactile graphics, and the teacher of students with visual impairments (TVI) who supports them, should still decide what format the student needs. HearGraph should say this in its limitations.

---

## 2. Standards and guidance used

### WCAG 2.2

- Web Content Accessibility Guidelines (WCAG) 2.2, W3C Recommendation, dated 12 December 2024: https://www.w3.org/TR/WCAG22/

Each "Understanding" page below was opened. The summaries are paraphrases.

| SC | Name | Level | What it asks (short paraphrase) | Official URL |
|---|---|---|---|---|
| 1.1.1 | Non-text Content | A | Non-text content needs a text alternative with the same purpose. The page uses charts as an example needing a short and a long alternative. | https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html |
| 1.3.1 | Info and Relationships | A | Structure shown visually (such as table headers) must be available to assistive technology. | https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html |
| 1.4.1 | Use of Color | A | Colour must not be the only way information is conveyed. | https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html |
| 1.4.2 | Audio Control | A | Audio that plays automatically for more than 3 seconds needs a pause, stop or volume control. | https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html |
| 1.4.3 | Contrast (Minimum) | AA | Text contrast of at least 4.5:1, or 3:1 for large text. | https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html |
| 1.4.4 | Resize Text | AA | Text can be enlarged to 200% without losing content or function. | https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html |
| 1.4.10 | Reflow | AA | Content works at 320 CSS pixels wide without two-direction scrolling, with exceptions such as data tables. | https://www.w3.org/WAI/WCAG22/Understanding/reflow.html |
| 1.4.11 | Non-text Contrast | AA | Interface components and meaningful graphics need at least 3:1 contrast. The page names "each line in a graph" as an example. | https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html |
| 2.1.1 | Keyboard | A | All functions can be operated with a keyboard. | https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html |
| 2.4.1 | Bypass Blocks | A | A way to skip blocks of content repeated across pages. | https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html |
| 2.4.7 | Focus Visible | AA | The keyboard focus indicator is visible. | https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html |
| 4.1.3 | Status Messages | AA | Status messages can be announced by assistive technology without moving focus, using roles such as `status`, `alert` or `log`. | https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html |

Note: HearGraph's sound only plays when the student asks for it. That keeps it clear of the automatic-audio case in 1.4.2, but a stop control is still good practice.

### WAI-ARIA and the ARIA Authoring Practices Guide (APG)

**What the APG says in general**

- APG "Read Me First": https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/
  The page's headline principle is "No ARIA is better than Bad ARIA". It also says a role is a promise: if you give an element a role, you must supply the keyboard behaviour that role implies. It tells authors to test with real browser and assistive technology combinations.

**Keyboard interface for a custom widget**

- APG "Developing a Keyboard Interface": https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/
  Tab moves between components, and arrow keys move inside a composite component, so the widget is a single stop in the tab order. Focus inside can be managed with a roving `tabindex` or with `aria-activedescendant`. The page says "The visual focus indicator must always be visible." It also lists key combinations to avoid because they clash with the operating system, browsers or assistive technology.

**`role="application"`**

- The APG has no page dedicated to `role="application"`. The APG practices index (https://www.w3.org/WAI/ARIA/apg/practices/) lists seven practice pages and none covers it. The APG landmark page (https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/) only mentions the role in passing.
- WAI-ARIA 1.2 specification: https://www.w3.org/TR/wai-aria-1.2/#application
  It defines `application` as a structure with focusable elements that need user input, notes that some assistive technologies use special interaction modes for such regions, and requires an accessible name.
- MDN, "ARIA: application role": https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/application_role
  Inside an application region, screen reader browse-mode reading and quick-navigation keys do not apply, and the author is responsible for all keyboard handling and focus management. MDN advises using it rarely, on the smallest container possible, never on `<body>`, and making sure users cannot get trapped.

  What this means for HearGraph: if the graph uses `role="application"`, it should wrap only the graph widget, have a clear label, handle every key itself, and leave the description, table and questions as normal readable content outside it.

**Live regions and announcements**

- The APG has no page dedicated to live regions (same index as above).
- APG Alert pattern: https://www.w3.org/WAI/ARIA/apg/patterns/alert/
  Alerts are for brief, important messages. They must not move keyboard focus. Too many interruptions hurt usability, especially for people with visual or cognitive disabilities.
- W3C technique ARIA22, "Using role=status to present status messages": https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22
  `role="status"` is a live region with an implicit polite setting. The container should exist with the role before the message is put inside it. This is a sufficient technique for SC 4.1.3.
- MDN, "ARIA live regions": https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions
  `polite` waits until the user is idle. `assertive` interrupts and should be used sparingly. The most reliable approach is to include the empty live region in the initial markup and then change its content.

  What this means for HearGraph: point announcements and answer feedback belong in a polite live region that is present when the page loads.

### W3C WAI guidance on complex images

- W3C WAI Images Tutorial, "Complex Images": https://www.w3.org/WAI/tutorials/images/complex/
  Complex images, such as graphs and charts, hold more information than a short phrase can carry. They need two parts: a short description that identifies the image, and a long description giving the essential information. One approach shown pairs an overview with a data table. The tutorial recommends making the long description available to everyone, not only screen reader users.

  This supports HearGraph's design: a generated plain-language description plus a real data table, both visible on the page.

---

## 3. Background on the barrier

1. **Screen-reader users get much less out of online charts than other users.**
   A study with 36 screen-reader users and 36 non-screen-reader users found that screen-reader users extracted information 61.48% less accurately and spent 210.96% more time on online data visualisations. Participants suggested tables and text as ways to improve access.
   Source: Sharif, Chintalapati, Wobbrock and Reinecke, "Understanding Screen-Reader Users' Experiences with Online Data Visualizations", ASSETS '21. Numbers read from the abstract on page 1 of the PDF.
   URL: https://faculty.washington.edu/wobbrock/pubs/assets-21.01.pdf (DOI: https://doi.org/10.1145/3441852.3471202)
   Accessed 2026-11-15.
   Caveat: the study is about online data visualisations in general, not school graphs specifically.

2. **Graphs need more than short alt text.**
   W3C guidance says graphs and charts are complex images that need a short description plus a long description of the essential information, and shows a data table as part of one approach.
   Source: W3C WAI Images Tutorial, "Complex Images".
   URL: https://www.w3.org/WAI/tutorials/images/complex/
   Accessed 2026-11-15.

3. **Missing image descriptions are still very common on the web.**
   WebAIM's 2026 analysis of one million home pages found missing alternative text for images on 53.1% of home pages, and 16.2% of all home page images had missing alternative text.
   Source: WebAIM, "The WebAIM Million" (2026 report).
   URL: https://webaim.org/projects/million/
   Accessed 2026-11-15.
   Caveat: this covers home pages in general, not educational material or graphs.

4. **Screen reader users themselves rank poor image descriptions as a real problem.**
   In WebAIM's Screen Reader User Survey #10 (1,539 valid responses, December 2023 to January 2024), "Images with missing or improper descriptions (alt text)" ranked 6th of 12 most problematic items. WebAIM notes the sample was not controlled.
   Source: WebAIM, "Screen Reader User Survey #10 Results".
   URL: https://webaim.org/projects/screenreadersurvey10/
   Accessed 2026-11-15.

5. **Text and table alternatives alone are a basic level of access; interactive exploration adds more.**
   A EuroVis 2022 paper notes that current guidelines ask for basic alternatives such as text descriptions and raw data tables, and argues for richer keyboard exploration at different levels of detail. It reports a study with 13 blind and low vision readers.
   Source: Zong, Lee, Lundgard, Jang, Hajas and Satyanarayan, "Rich Screen Reader Experiences for Accessible Data Visualization".
   URL: https://arxiv.org/abs/2205.04917
   Accessed 2026-11-15.

No statement is included here about how well sonification improves blind students' graph comprehension. See section 5.

---

## 4. Libraries and tools used in the build

Licences below were read from each project's own repository page on 2026-11-15. Check the exact versions in `package.json` before submitting.

| Tool | Official URL | Licence (as verified) | Where verified |
|---|---|---|---|
| Next.js | https://nextjs.org | MIT | https://github.com/vercel/next.js |
| React | https://react.dev | MIT | https://github.com/facebook/react |
| TypeScript | https://www.typescriptlang.org | Apache-2.0 | https://github.com/microsoft/TypeScript |
| Vitest | https://vitest.dev | MIT | https://github.com/vitest-dev/vitest |
| Playwright | https://playwright.dev | Apache-2.0 | https://github.com/microsoft/playwright |
| axe-core | https://github.com/dequelabs/axe-core | MPL-2.0 | https://github.com/dequelabs/axe-core |
| @axe-core/playwright | https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright | MPL-2.0 (stated for the `axe-core-npm` repository that contains the package) | https://github.com/dequelabs/axe-core-npm |
| Web Audio API | https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API | Browser API (a web standard, not a library) | MDN reference page |
| Vercel (hosting) | https://vercel.com/docs/deployments | Hosted service, not a library | Vercel docs page |

Notes:

- The Web Audio API page describes `AudioContext`, `OscillatorNode` (a periodic waveform such as a sine wave) and `GainNode` (volume). These are the pieces a pitch sweep needs.
- The axe-core README says automated tools find "on average 57% of WCAG issues automatically". So passing axe checks does not prove the app is accessible. Manual screen reader testing is still needed, and the project should say so.
- The official home pages (nextjs.org, react.dev, typescriptlang.org, vitest.dev, playwright.dev) were taken from each repository page. The home pages themselves were not opened separately.

---

## 5. Could not verify

- **Sonification Sandbox primary page.** The Georgia Tech Sonification Lab page (sonify.psych.gatech.edu) failed with a certificate error, and the Georgia Tech repository record for the paper "Sonification sandbox: A graphical toolkit for auditory graphs" loaded only its title. Details such as it being a Java application came only from a search summary, so they are left out above.
- **Research on sonification and blind students' graph comprehension.** A search surfaced candidate studies (for example Walker and Mauney 2010 on sonification mappings, and classroom work from the Georgia Tech Sonification Lab), but no primary page for them was opened successfully. No findings from them are cited. Do not claim that sonification is proven to improve graph comprehension unless a primary source is added.
- **BANA 2022 guidelines content.** The 2022 PDF was too large to open. Only the BANA web pages and the online table of contents were read. Specific rules from the guidelines are not quoted.
- **APH (American Printing House for the Blind) pages.** Two APH URLs returned "not found". APH is mentioned only as far as the BANA page mentions it (hard copies available through APH).
- **@axe-core/playwright licence on npm.** The npm page blocked access. The MPL-2.0 licence is taken from the containing GitHub repository, not the package's own licence field.
- **Whether any existing tool has the exact HearGraph combination** (data in the URL hash, no server, built-in auto-generated practice questions). None of the pages opened describe that combination, but this was not an exhaustive search. Do not claim HearGraph is the first or only tool to do this.
- **Whether Highcharts Sonification Studio offers shareable links or student-facing screen reader navigation.** The home page does not say. It lists better screen reader navigation as planned.
- **Desmos features on shared classroom activities.** Only the calculator accessibility pages were read. Nothing is claimed about Desmos Classroom.
- **ACM Digital Library pages.** dl.acm.org blocked access. The Sharif et al. figures come from the author-hosted PDF instead.
- **Offline behaviour, licence versions and exact package versions** of the build tools were not checked. Only the licence named on each repository page was read.
