'use client';

import { useEffect, useRef, useState } from 'react';
import { parseCsv, tableToCsv, validateWorksheet } from '@/lib/data';
import { describeWorksheet, formatNumber } from '@/lib/describe';
import { getSample } from '@/lib/samples';
import { decodeWorksheet, encodeWorksheet } from '@/lib/share';
import {
  MAX_ANSWER_LENGTH,
  MAX_EXPLANATION_LENGTH,
  MAX_LABEL_LENGTH,
  MAX_POINTS,
  MAX_PROMPT_LENGTH,
  MAX_QUESTIONS,
  MAX_TITLE_LENGTH,
  MAX_UNIT_LENGTH,
  type Question,
  type Worksheet,
} from '@/lib/types';

interface Row {
  x: string;
  y1: string;
  y2: string;
}

interface OwnQuestion {
  prompt: string;
  answer: string;
  explanation: string;
}

interface Created {
  studentUrl: string;
  printUrl: string;
  description: string[];
}

const BLANK_ROWS = 5;
const blankRow = (): Row => ({ x: '', y1: '', y2: '' });
const blankQuestion = (): OwnQuestion => ({ prompt: '', answer: '', explanation: '' });

/** Strict number for table cells: digits, optional sign, optional decimal point or decimal comma. */
function parseCell(text: string): number | null {
  const t = text.trim().replace(/[−–]/g, '-');
  if (!/^[+-]?(\d+([.,]\d*)?|[.,]\d+)$/.test(t)) return null;
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function TeacherEditor() {
  const [title, setTitle] = useState('');
  const [xLabel, setXLabel] = useState('');
  const [xUnit, setXUnit] = useState('');
  const [y1Label, setY1Label] = useState('');
  const [y1Unit, setY1Unit] = useState('');
  const [twoSeries, setTwoSeries] = useState(false);
  const [y2Label, setY2Label] = useState('');
  const [y2Unit, setY2Unit] = useState('');
  const [rows, setRows] = useState<Row[]>(() => Array.from({ length: BLANK_ROWS }, blankRow));
  const [csv, setCsv] = useState('');
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [questionMode, setQuestionMode] = useState<'auto' | 'own'>('auto');
  const [own, setOwn] = useState<OwnQuestion[]>(() => Array.from({ length: MAX_QUESTIONS }, blankQuestion));
  const [errors, setErrors] = useState<string[]>([]);
  const [notices, setNotices] = useState<string[]>([]);
  const [created, setCreated] = useState<Created | null>(null);
  const [copyStatus, setCopyStatus] = useState('');

  const errorRef = useRef<HTMLDivElement>(null);
  const csvErrorRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);

  /** Any edit makes an earlier link out of date, so hide it. */
  const touched = () => {
    if (created) setCreated(null);
    if (copyStatus) setCopyStatus('');
  };

  const fillFromWorksheet = (w: Worksheet) => {
    setTitle(w.title);
    setXLabel(w.x.label);
    setXUnit(w.x.unit);
    setY1Label(w.series[0].label);
    setY1Unit(w.series[0].unit);
    const second = w.series[1];
    setTwoSeries(Boolean(second));
    setY2Label(second ? second.label : '');
    setY2Unit(second ? second.unit : '');
    setRows(
      w.x.values.map((x, i) => ({
        x: formatNumber(x),
        y1: formatNumber(w.series[0].values[i]),
        y2: second ? formatNumber(second.values[i]) : '',
      })),
    );
    if (w.questions.length > 0) {
      setQuestionMode('own');
      setOwn(
        Array.from({ length: MAX_QUESTIONS }, (_, i) => {
          const q = w.questions[i];
          if (!q) return blankQuestion();
          return {
            prompt: q.prompt,
            answer: q.kind === 'number' ? `${formatNumber(q.answer)}${q.unit ? ` ${q.unit}` : ''}` : q.answer,
            explanation: q.explanation,
          };
        }),
      );
    } else {
      setQuestionMode('auto');
      setOwn(Array.from({ length: MAX_QUESTIONS }, blankQuestion));
    }
    setCsv(tableToCsv(w.x, w.series));
    setCsvErrors([]);
    setErrors([]);
    setNotices([]);
    setCreated(null);
  };

  // A teacher can reopen a shared link here to edit a copy.
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (!/^v\d+\./.test(hash)) return;
    const decoded = decodeWorksheet(hash);
    if (decoded.ok) {
      fillFromWorksheet(decoded.worksheet);
      setStatus('The graph from the link has been loaded into the form.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (errors.length > 0) errorRef.current?.focus();
  }, [errors]);
  useEffect(() => {
    if (csvErrors.length > 0) csvErrorRef.current?.focus();
  }, [csvErrors]);
  useEffect(() => {
    if (created) resultRef.current?.focus();
  }, [created]);

  const useCsv = () => {
    touched();
    const result = parseCsv(csv);
    if (!result.ok) {
      setCsvErrors(result.errors);
      setStatus('');
      return;
    }
    setCsvErrors([]);
    const { x, series } = result.table;
    setXLabel(x.label);
    setXUnit(x.unit);
    setY1Label(series[0].label);
    setY1Unit(series[0].unit);
    setTwoSeries(series.length > 1);
    setY2Label(series[1]?.label ?? '');
    setY2Unit(series[1]?.unit ?? '');
    setRows(
      x.values.map((v, i) => ({
        x: formatNumber(v),
        y1: formatNumber(series[0].values[i]),
        y2: series[1] ? formatNumber(series[1].values[i]) : '',
      })),
    );
    setStatus(
      `The table below now has ${x.values.length} rows. ${result.notices.join(' ')}`.trim(),
    );
  };

  const loadExample = () => {
    const sample = getSample('cart');
    if (!sample) return;
    fillFromWorksheet({ ...sample.worksheet, questions: [] });
    setStatus('Example loaded: a cart on a track, 9 rows of made-up data. You can edit anything.');
  };

  const setCell = (i: number, key: keyof Row, value: string) => {
    touched();
    setRows((prev) => prev.map((r, ri) => (ri === i ? { ...r, [key]: value } : r)));
  };

  const addRow = () => {
    touched();
    setRows((prev) => (prev.length >= MAX_POINTS ? prev : [...prev, blankRow()]));
    setStatus(`Row ${rows.length + 1} added.`);
  };

  const removeRow = (i: number) => {
    touched();
    setRows((prev) => (prev.length <= 1 ? [blankRow()] : prev.filter((_, ri) => ri !== i)));
    setStatus(`Row ${i + 1} removed.`);
  };

  const setOwnField = (i: number, key: keyof OwnQuestion, value: string) => {
    touched();
    setOwn((prev) => prev.map((q, qi) => (qi === i ? { ...q, [key]: value } : q)));
  };

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    const problems: string[] = [];
    const notes: string[] = [];

    const xName = xLabel.trim() || 'x';
    const y1Name = y1Label.trim() || 'y';
    const y2Name = y2Label.trim() || 'y2';

    if (!title.trim()) problems.push('Add a title for the graph.');

    const points: { x: number; y1: number; y2: number }[] = [];
    rows.forEach((r, i) => {
      const cells = twoSeries ? [r.x, r.y1, r.y2] : [r.x, r.y1];
      if (cells.every((c) => c.trim() === '')) return; // blank rows are skipped
      const names = [xName, y1Name, y2Name];
      const nums = cells.map((c, ci) => {
        if (c.trim() === '') {
          problems.push(`Row ${i + 1}: the ${names[ci]} cell is empty.`);
          return null;
        }
        const n = parseCell(c);
        if (n === null) problems.push(`Row ${i + 1}: "${c.trim()}" is not a number.`);
        return n;
      });
      if (nums.every((n) => n !== null)) {
        points.push({ x: nums[0] as number, y1: nums[1] as number, y2: twoSeries ? (nums[2] as number) : 0 });
      }
    });

    const sorted = [...points].sort((a, b) => a.x - b.x);
    if (sorted.some((p, i) => p !== points[i])) {
      notes.push(`Rows were sorted by ${xName} from smallest to largest.`);
    }

    const questions: Question[] = [];
    if (questionMode === 'own') {
      own.forEach((q, i) => {
        const prompt = q.prompt.trim();
        const answer = q.answer.trim();
        if (!prompt && !answer) return;
        if (!prompt) {
          problems.push(`Question ${i + 1}: write the question.`);
          return;
        }
        if (!answer) {
          problems.push(`Question ${i + 1}: write the expected answer.`);
          return;
        }
        const numeric = parseCell(answer);
        const explanation = q.explanation.trim();
        if (numeric !== null) {
          questions.push({
            kind: 'number',
            prompt,
            answer: numeric,
            tolerance: Math.max(Math.abs(numeric) * 0.01, 0.005),
            unit: '',
            explanation,
          });
        } else {
          questions.push({ kind: 'text', prompt, answer, explanation });
        }
      });
      if (questions.length === 0 && problems.length === 0) {
        notes.push('No questions were written, so questions will be generated automatically.');
      }
    }

    const worksheet: Worksheet = {
      title: title.trim(),
      x: { label: xName, unit: xUnit.trim(), values: sorted.map((p) => p.x) },
      series: [
        { label: y1Name, unit: y1Unit.trim(), values: sorted.map((p) => p.y1) },
        ...(twoSeries ? [{ label: y2Name, unit: y2Unit.trim(), values: sorted.map((p) => p.y2) }] : []),
      ],
      questions,
    };

    if (problems.length === 0) {
      for (const message of validateWorksheet(worksheet)) problems.push(message);
    }

    if (problems.length > 0) {
      setErrors(problems);
      setNotices([]);
      setCreated(null);
      return;
    }

    let hash: string;
    try {
      hash = encodeWorksheet(worksheet);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'The link could not be created.']);
      setCreated(null);
      return;
    }
    setErrors([]);
    setNotices(notes);
    setCopyStatus('');
    setCreated({
      studentUrl: `${window.location.origin}/student/#${hash}`,
      printUrl: `${window.location.origin}/print/#${hash}`,
      description: describeWorksheet(worksheet),
    });
  };

  const copy = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.studentUrl);
      setCopyStatus('Link copied to the clipboard.');
    } catch {
      linkRef.current?.focus();
      linkRef.current?.select();
      setCopyStatus('Copying was blocked by the browser. The link is selected: press Control C or Command C to copy it.');
    }
  };

  const atLimit = rows.length >= MAX_POINTS;

  return (
    <form onSubmit={create} noValidate className="teacher-form">
      <p className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {status}
      </p>

      <section aria-labelledby="step-title">
        <h2 id="step-title">1. Title</h2>
        <div className="field">
          <label htmlFor="title">Graph title</label>
          <input
            id="title"
            type="text"
            value={title}
            maxLength={MAX_TITLE_LENGTH}
            onChange={(e) => {
              touched();
              setTitle(e.target.value);
            }}
            aria-describedby="title-hint"
            autoComplete="off"
          />
          <p id="title-hint" className="hint">
            For example: Cart on a track: velocity vs time
          </p>
        </div>
        <p>
          <button type="button" className="secondary" onClick={loadExample}>
            Fill the form with example data
          </button>
        </p>
      </section>

      <section aria-labelledby="step-data">
        <h2 id="step-data">2. Data</h2>
        <p>Paste the numbers, or type them into the table. Up to {MAX_POINTS} rows, one or two lines.</p>

        <h3 id="paste-heading">Option A: paste from a spreadsheet or CSV file</h3>
        <div className="field">
          <label htmlFor="csv">Pasted data</label>
          <textarea
            id="csv"
            rows={6}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            aria-describedby="csv-hint"
            spellCheck={false}
            autoComplete="off"
          />
          <p id="csv-hint" className="hint">
            The first column is the horizontal axis. Add one or two more columns for the lines. A first row of
            names is optional; units go in brackets, like <code>Time (s), Velocity (m/s)</code>. Columns can be
            separated by commas, tabs or semicolons.
          </p>
        </div>
        {csvErrors.length > 0 ? (
          <div className="error-box" role="alert" tabIndex={-1} ref={csvErrorRef}>
            <h4>The pasted data could not be used</h4>
            <ul>
              {csvErrors.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <p>
          <button type="button" className="secondary" onClick={useCsv}>
            Put this data in the table
          </button>
        </p>

        <h3 id="table-heading">Option B: type into the table</h3>
        <fieldset>
          <legend>Horizontal axis</legend>
          <div className="field-pair">
            <div className="field">
              <label htmlFor="x-label">Name</label>
              <input
                id="x-label"
                type="text"
                value={xLabel}
                maxLength={MAX_LABEL_LENGTH}
                onChange={(e) => {
                  touched();
                  setXLabel(e.target.value);
                }}
                autoComplete="off"
              />
            </div>
            <div className="field">
              <label htmlFor="x-unit">Unit (optional)</label>
              <input
                id="x-unit"
                type="text"
                value={xUnit}
                maxLength={MAX_UNIT_LENGTH}
                onChange={(e) => {
                  touched();
                  setXUnit(e.target.value);
                }}
                autoComplete="off"
              />
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend>Line 1</legend>
          <div className="field-pair">
            <div className="field">
              <label htmlFor="y1-label">Name</label>
              <input
                id="y1-label"
                type="text"
                value={y1Label}
                maxLength={MAX_LABEL_LENGTH}
                onChange={(e) => {
                  touched();
                  setY1Label(e.target.value);
                }}
                autoComplete="off"
              />
            </div>
            <div className="field">
              <label htmlFor="y1-unit">Unit (optional)</label>
              <input
                id="y1-unit"
                type="text"
                value={y1Unit}
                maxLength={MAX_UNIT_LENGTH}
                onChange={(e) => {
                  touched();
                  setY1Unit(e.target.value);
                }}
                autoComplete="off"
              />
            </div>
          </div>
        </fieldset>
        <div className="choice">
          <input
            id="two-series"
            type="checkbox"
            checked={twoSeries}
            onChange={(e) => {
              touched();
              setTwoSeries(e.target.checked);
            }}
          />
          <label htmlFor="two-series">Add a second line</label>
        </div>
        {twoSeries ? (
          <fieldset>
            <legend>Line 2</legend>
            <div className="field-pair">
              <div className="field">
                <label htmlFor="y2-label">Name</label>
                <input
                  id="y2-label"
                  type="text"
                  value={y2Label}
                  maxLength={MAX_LABEL_LENGTH}
                  onChange={(e) => {
                    touched();
                    setY2Label(e.target.value);
                  }}
                  autoComplete="off"
                />
              </div>
              <div className="field">
                <label htmlFor="y2-unit">Unit (optional)</label>
                <input
                  id="y2-unit"
                  type="text"
                  value={y2Unit}
                  maxLength={MAX_UNIT_LENGTH}
                  onChange={(e) => {
                    touched();
                    setY2Unit(e.target.value);
                  }}
                  autoComplete="off"
                />
              </div>
            </div>
          </fieldset>
        ) : null}

        <div className="table-scroll" role="region" aria-label="Data entry table" tabIndex={0}>
          <table className="data-table edit-table">
            <caption>Data points. Blank rows are ignored.</caption>
            <thead>
              <tr>
                <th scope="col">Row</th>
                <th scope="col">{xLabel.trim() || 'x'}</th>
                <th scope="col">{y1Label.trim() || 'y'}</th>
                {twoSeries ? <th scope="col">{y2Label.trim() || 'y2'}</th> : null}
                <th scope="col">Remove</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <th scope="row">{i + 1}</th>
                  <td>
                    <input
                      type="text"
                      inputMode="text"
                      value={r.x}
                      onChange={(e) => setCell(i, 'x', e.target.value)}
                      aria-label={`Row ${i + 1}, ${xLabel.trim() || 'x'}`}
                      autoComplete="off"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      inputMode="text"
                      value={r.y1}
                      onChange={(e) => setCell(i, 'y1', e.target.value)}
                      aria-label={`Row ${i + 1}, ${y1Label.trim() || 'y'}`}
                      autoComplete="off"
                    />
                  </td>
                  {twoSeries ? (
                    <td>
                      <input
                        type="text"
                        inputMode="text"
                        value={r.y2}
                        onChange={(e) => setCell(i, 'y2', e.target.value)}
                        aria-label={`Row ${i + 1}, ${y2Label.trim() || 'y2'}`}
                        autoComplete="off"
                      />
                    </td>
                  ) : null}
                  <td>
                    <button type="button" className="secondary small" onClick={() => removeRow(i)}>
                      Remove<span className="visually-hidden"> row {i + 1}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          <button type="button" className="secondary" onClick={addRow} aria-disabled={atLimit} disabled={atLimit}>
            Add a row
          </button>{' '}
          {atLimit ? <span className="hint">The table is full ({MAX_POINTS} rows).</span> : null}
        </p>
      </section>

      <section aria-labelledby="step-questions">
        <h2 id="step-questions">3. Practice questions</h2>
        <fieldset>
          <legend>Where should the questions come from?</legend>
          <div className="choice">
            <input
              id="q-auto"
              type="radio"
              name="question-mode"
              checked={questionMode === 'auto'}
              onChange={() => {
                touched();
                setQuestionMode('auto');
              }}
            />
            <label htmlFor="q-auto">Make up to 3 questions automatically from the data</label>
          </div>
          <div className="choice">
            <input
              id="q-own"
              type="radio"
              name="question-mode"
              checked={questionMode === 'own'}
              onChange={() => {
                touched();
                setQuestionMode('own');
              }}
            />
            <label htmlFor="q-own">I will write my own (up to {MAX_QUESTIONS})</label>
          </div>
        </fieldset>
        {questionMode === 'own' ? (
          <>
            <p className="hint">
              If the expected answer is only a number, the student&rsquo;s answer is accepted within 1 percent.
              Other answers are compared as text, ignoring capital letters. Leave a question blank to skip it.
            </p>
            {own.map((q, i) => (
              <fieldset key={i}>
                <legend>Question {i + 1}</legend>
                <div className="field">
                  <label htmlFor={`own-prompt-${i}`}>Question</label>
                  <input
                    id={`own-prompt-${i}`}
                    type="text"
                    value={q.prompt}
                    maxLength={MAX_PROMPT_LENGTH}
                    onChange={(e) => setOwnField(i, 'prompt', e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="field">
                  <label htmlFor={`own-answer-${i}`}>Expected answer</label>
                  <input
                    id={`own-answer-${i}`}
                    type="text"
                    value={q.answer}
                    maxLength={MAX_ANSWER_LENGTH}
                    onChange={(e) => setOwnField(i, 'answer', e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="field">
                  <label htmlFor={`own-explanation-${i}`}>Explanation shown after answering (optional)</label>
                  <input
                    id={`own-explanation-${i}`}
                    type="text"
                    value={q.explanation}
                    maxLength={MAX_EXPLANATION_LENGTH}
                    onChange={(e) => setOwnField(i, 'explanation', e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </fieldset>
            ))}
          </>
        ) : null}
      </section>

      <section aria-labelledby="step-link">
        <h2 id="step-link">4. Create the link</h2>
        <p>
          The data is written into the link itself. Nothing is uploaded or stored. Anyone with the link can see the
          data, so do not include names or grades.
        </p>
        {errors.length > 0 ? (
          <div className="error-box" role="alert" tabIndex={-1} ref={errorRef} data-testid="form-errors">
            <h3>The link was not created. Please fix {errors.length === 1 ? 'this' : 'these'}:</h3>
            <ul>
              {errors.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <p>
          <button type="submit">Create link</button>
        </p>
      </section>

      {created ? (
        <section aria-labelledby="result-heading" className="result-box">
          <h2 id="result-heading" tabIndex={-1} ref={resultRef}>
            Your link is ready
          </h2>
          {notices.map((m, i) => (
            <p key={i}>{m}</p>
          ))}
          <div className="field">
            <label htmlFor="share-link">Link for students</label>
            <input
              id="share-link"
              ref={linkRef}
              type="text"
              readOnly
              value={created.studentUrl}
              onFocus={(e) => e.currentTarget.select()}
              data-testid="share-link"
            />
            <p className="hint">
              {created.studentUrl.length} characters.
              {created.studentUrl.length > 2000
                ? ' This is a long link. Some messaging apps cut long links short, so test it before sharing.'
                : ''}
            </p>
          </div>
          <div className="button-row">
            <button type="button" onClick={copy}>
              Copy link
            </button>
            <a className="button-link" href={created.studentUrl}>
              Open the student view
            </a>
            <a className="button-link" href={created.printUrl}>
              Download printable high-contrast version
            </a>
          </div>
          <p role="status" aria-live="polite" aria-atomic="true" data-testid="copy-status">
            {copyStatus}
          </p>
          <p className="hint">
            The printable version opens as a page you can print, save as a PDF, or download as an SVG picture. It has
            not been tested on braille embossers or tactile graphics printers.
          </p>
          <h3>What the student will read first</h3>
          {created.description.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>
      ) : null}
    </form>
  );
}
