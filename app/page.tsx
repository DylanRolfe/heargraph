
export default function HomePage() {
  return (
    <>
      <h1>HearGraph</h1>
      <p className="lead">
        Graphs on worksheets are often pictures. A screen reader can only say &ldquo;image&rdquo;. HearGraph turns
        the numbers behind a graph into something a student can explore by keyboard, hear as sound, read as plain
        text, and check in a data table.
      </p>

      <div className="compare">
        <div className="compare-card muted">
          <p className="compare-label">Before</p>
          <p className="compare-quote">&ldquo;Graph of velocity, image.&rdquo;</p>
        </div>
        <div className="compare-card">
          <p className="compare-label">With HearGraph</p>
          <p className="compare-quote">
            &ldquo;Time 4 seconds, velocity 0 metres per second, crossing zero.&rdquo;
          </p>
        </div>
      </div>
      <p className="hint">
        What a screen reader says for the same worksheet graph. The &ldquo;before&rdquo; line is an illustrative
        example.
      </p>

      <div className="big-buttons">
        <a className="big-button" href="/teacher/">
          <span className="big-button-title">I&rsquo;m a teacher: make an accessible graph</span>
          <span className="big-button-note">Paste a small data table and get a link to share. No account.</span>
        </a>
        <a className="big-button" href="/student/?sample=cart">
          <span className="big-button-title">Try the student example</span>
          <span className="big-button-note">A physics worksheet: a cart on a track, velocity against time.</span>
        </a>
      </div>

      <h2>How it works</h2>
      <ol>
        <li>The teacher pastes the numbers behind a graph, for example time and velocity.</li>
        <li>HearGraph makes a link. The numbers are stored inside the link itself, not on a server.</li>
        <li>
          The student opens the link and can read a short description, move through the graph point by point with
          the arrow keys, play the graph as sound, read the data table, and answer practice questions.
        </li>
      </ol>

      <h2>What it does not do</h2>
      <ul>
        <li>It cannot read numbers out of a picture of a graph. The teacher has to supply the numbers.</li>
        <li>It shows one or two lines of data, with up to 50 points.</li>
        <li>
          Sound is an extra way to explore. It does not replace tactile graphics or the work of a teacher of students
          with visual impairments.
        </li>
        <li>
          It has only been checked by its builder. It has not been tested with blind or low-vision students. See
          the <a href="/about/">About page</a>.
        </li>
      </ul>
    </>
  );
}
