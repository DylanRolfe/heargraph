# 15-minute manual screen-reader checklist (for Dylan)

Do this on the **live URL**. Use NVDA with Firefox or Chrome on Windows (NVDA is free: nvaccess.org), and/or VoiceOver with Safari on a Mac or iPhone. Record the results in the table at the bottom, then copy them into the "Manual passes by Dylan" section of `docs/TESTING.md`. Write down failures as they are. A failure that is recorded honestly is worth more to the judges than a blank.

"Expected" below is the text HearGraph sends. A screen reader may add its own words (such as "application", "button", "heading level 2") and may pronounce minus signs or units slightly differently. Note any difference that would confuse a student.

Before you start: note the date, screen reader and version (NVDA menu, Help, About), browser and version, and operating system.

NVDA basics: `Ctrl` stops speech. `NVDA+Space` switches between browse mode and focus mode (NVDA key is `Insert` or `Caps Lock`). `H` jumps between headings and `T` jumps to the next table in browse mode.

## A. Landing page (1 minute)

| # | Do this | Expected |
|---|---|---|
| A1 | Open the live URL. Press `Tab` once. | "Skip to main content", link. |
| A2 | Press `Enter`, then `Tab`. | Focus is inside the main content: "I'm a teacher: make an accessible graph", link. |
| A3 | Press `Tab`, then `Enter`. | "Try the student example" opens the page titled "Cart on a track: velocity vs time". |

## B. Student page: description and graph (6 minutes)

| # | Do this | Expected |
|---|---|---|
| B1 | In browse mode press `H` a few times. | Headings in order: "Cart on a track: velocity vs time" (level 1), "Summary", "Explore the graph", "Data table", "Practice questions", "Built-in examples" (level 2). |
| B2 | Read the Summary section (Down arrow). | "Velocity starts at 6 m/s and ends at -6 m/s. It falls steadily the whole way. It reaches 0 m/s at 4 s and is negative after that. Highest value: 6 m/s at 0 s. Lowest value: -6 m/s at 8 s." Check that "-6" is read as negative. |
| B3 | Press `Tab` until you reach the graph. | "Graph: Cart on a track: velocity vs time", then the key instructions ("Left and Right arrows move between points…"). NVDA should switch to focus mode by itself (a click sound). |
| B4 | Press `Right arrow`. | A short tone, and "Time 1 second, velocity 4.5 metres per second. Point 2 of 9." |
| B5 | Press `Right arrow` three more times. | Tones get lower. Last one: "Time 4 seconds, velocity 0 metres per second, crossing zero. Point 5 of 9." plus one click. |
| B6 | Press `End`. | "Time 8 seconds, velocity -6 metres per second, lowest value. Point 9 of 9." plus two low ticks. |
| B7 | Press `Right arrow` again. | "Last point." then the same point. |
| B8 | Press `Home`. | "Time 0 seconds, velocity 6 metres per second, highest value. Point 1 of 9." plus two high ticks. |
| B9 | Press `Z`. | Jumps to "Time 4 seconds, velocity 0 metres per second, crossing zero. Point 5 of 9." |
| B10 | Press `M`, then `N`. | Highest value (point 1), then lowest value (point 9). |
| B11 | Press `S`. | The summary sentence from B2 is read. |
| B12 | Press `Space`. | "Playing Velocity as sound…", then nine tones falling in pitch, with two high ticks at the start, a click in the middle and two low ticks at the end. Then "Finished playing." Check: can you still understand the speech over the tones? |
| B13 | Press `Space`, then `Space` again straight away. | Playback starts, then "Stopped." and silence. |
| B14 | Press `Tab`. | Leaves the graph: "Previous point", button. Then "Next point", "Play graph as sound", and "Turn sound off". |
| B15 | Press `Enter` on "Next point". | The next point is announced (same wording as the arrow keys). |

## C. Data table and practice (4 minutes)

| # | Do this | Expected |
|---|---|---|
| C1 | In browse mode press `T` to reach the table. | Caption: "Cart on a track: velocity vs time: 9 rows. Each row is one point on the graph." Table with 10 rows and 2 columns. |
| C2 | Move through cells with `Ctrl+Alt+arrow keys`. | Column headers "Time (s)" and "Velocity (m/s)" are announced when you change column. The time is announced as the row header when you change row. |
| C3 | `Tab` to Question 1. | "Question 1. At what time does the cart stop? Answer in s." edit field. |
| C4 | Type `3`, press `Enter`. | "Not quite. The answer is 4 s. The cart stops when its velocity is 0 m/s. Press Z in the graph…" is announced without moving focus. |
| C5 | Clear it, type `4`, press `Enter`. | "Correct. The cart stops when its velocity is 0 m/s…" |
| C6 | `Tab` to Question 2. Use the arrow keys to pick "Slowing down", `Tab` to "Check answer", press `Enter`. | The group is announced as "Question 2. Is the cart speeding up or slowing down between 0 and 4 s?" with radio buttons "1 of 3" etc. Feedback: "Correct. The velocity goes from 6 m/s down to 0 m/s…" |
| C7 | Question 3: type `-3`, press `Enter`. | "Correct. Move to the point where time is 6 s…" |

## D. Teacher page (3 minutes)

| # | Do this | Expected |
|---|---|---|
| D1 | Open "For teachers". `Tab` to "Create link" (near the bottom) and press `Enter` with the form empty. | Focus moves to an error box: "The link was not created. Please fix this: Add a title for the graph." |
| D2 | Activate "Fill the form with example data". | Announced: "Example loaded: a cart on a track, 9 rows of made-up data. You can edit anything." |
| D3 | `Tab` through the table inputs. | Each input has a name such as "Row 1, Time" and "Row 1, Velocity". Remove buttons say "Remove row 1". |
| D4 | Activate "Create link". | Focus moves to the heading "Your link is ready". |
| D5 | `Tab` to "Copy link", press `Enter`. | "Link copied to the clipboard." |
| D6 | Activate "Open the student view". | The cart worksheet opens from the link, with the same title and summary. |

## E. Quick low-vision checks (1 minute, no screen reader needed)

| # | Do this | Expected |
|---|---|---|
| E1 | Settings: turn on "High contrast" and "Large text". Open the student example. | Black background, light orange line, larger text. Focus outlines are easy to see. Nothing overlaps or is cut off. |
| E2 | Browser zoom to 200 percent (`Ctrl` and `+`). | No sideways scrolling of the page. The graph is still readable. |
| E3 | Windows Magnifier (`Win` and `+`) at 200 percent, move through the graph with the arrow keys. | The ringed point and its value label are easy to find. (If the magnifier does not follow the point, write that down.) |

## Optional: VoiceOver on iPhone or Mac

Arrow keys are not available with touch. Check that the buttons "Previous point", "Next point" and "Play graph as sound" under the graph work with a double tap, and that each point is announced.

## Results (fill this in)

- Date and time:
- Tester: Dylan Rolfe (the builder; sighted, not a regular screen-reader user: [confirm or correct])
- Screen reader and version:
- Browser and version:
- Operating system:
- Live URL tested:

| Step | Pass / Fail | What actually happened (if different) |
|---|---|---|
| A1 | | |
| A2 | | |
| A3 | | |
| B1 | | |
| B2 | | |
| B3 | | |
| B4 | | |
| B5 | | |
| B6 | | |
| B7 | | |
| B8 | | |
| B9 | | |
| B10 | | |
| B11 | | |
| B12 | | |
| B13 | | |
| B14 | | |
| B15 | | |
| C1 | | |
| C2 | | |
| C3 | | |
| C4 | | |
| C5 | | |
| C6 | | |
| C7 | | |
| D1 | | |
| D2 | | |
| D3 | | |
| D4 | | |
| D5 | | |
| D6 | | |
| E1 | | |
| E2 | | |
| E3 | | |

Anything confusing, slow or annoying that is not on the list:
