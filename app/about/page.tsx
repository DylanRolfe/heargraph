import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'About and limitations' };

export default function AboutPage() {
  return (
    <>
      <h1>About HearGraph</h1>
      <p className="lead">
        HearGraph is a prototype built by one student, Dylan Rolfe, for the AccessED Hacks hackathon in November
        2026, with help from an AI coding agent.
      </p>

      <h2>The barrier</h2>
      <p>
        Many physics and math worksheets show graphs as pictures. A screen reader reads a picture as
        &ldquo;image&rdquo; or a short label such as &ldquo;graph of velocity&rdquo;. From that, a student cannot read
        a value, find the highest point, or tell when a quantity crosses zero.
      </p>

      <h2>What HearGraph changes</h2>
      <p>
        If the teacher has the numbers behind the graph, HearGraph gives the student four ways to reach them: a short
        description in plain language, point-by-point keyboard exploration with spoken values, the graph played as
        sound, and a data table. Practice questions with explained feedback follow.
      </p>

      <h2>Limitations</h2>
      <ul>
        <li>The teacher must supply the numbers. HearGraph cannot read a picture of a graph.</li>
        <li>One or two lines only, with 2 to 50 points.</li>
        <li>
          Sound is a supplement. It does not replace tactile graphics or a teacher of students with visual
          impairments.
        </li>
        <li>
          Testing so far is automated checks plus the builder&rsquo;s own keyboard and screen-reader passes. It has
          not been tested with blind or low-vision students, and no learning gains are claimed.
        </li>
        <li>
          Values between data points, such as a zero crossing that falls between two rows, are estimated with a
          straight line and labelled &ldquo;about&rdquo;.
        </li>
        <li>Braille displays, braille embossers and tactile printers have not been tested.</li>
        <li>The description and questions are made from templates, in English only.</li>
        <li>
          The data lives in the link. Anyone with the link can read it, and very long links may be cut short by some
          messaging apps.
        </li>
      </ul>

      <h2>Privacy</h2>
      <p>
        There are no accounts, no analytics and no database. Graph data stays in the link. Settings stay in this
        browser. The built-in examples use made-up numbers.
      </p>

      <h2>Existing tools</h2>
      <p>
        HearGraph is not the first tool to make graphs audible or keyboard-accessible. Desmos has Audio Trace,
        Highcharts has Sonification Studio, and Chart2Music and MAIDR are libraries for developers. Those tools are
        more capable. HearGraph is narrower: a teacher pastes a small table, shares a link, and the student gets a
        description, a table and practice questions in one page.
      </p>

      <h2>Source and credits</h2>
      <p>
        HearGraph is open source under the MIT licence. It is built with Next.js, React and TypeScript, and uses the
        browser&rsquo;s Web Audio API for sound. The full list of sources, credits and the AI-assistance disclosure
        are in the project README.
      </p>
      <p>
        <a href="/student/?sample=cart">Try the student example</a>
      </p>
    </>
  );
}
