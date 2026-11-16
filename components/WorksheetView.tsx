'use client';

import { useMemo } from 'react';
import { describeWorksheet } from '@/lib/describe';
import { generateQuestions } from '@/lib/questions';
import type { Worksheet } from '@/lib/types';
import { DataTable } from './DataTable';
import { JumpLink } from './JumpLink';
import { GraphExplorer } from './GraphExplorer';
import { Practice } from './Practice';

export function WorksheetView({
  worksheet,
  context,
  printHref,
}: {
  worksheet: Worksheet;
  context?: string;
  printHref: string;
}) {
  const paragraphs = useMemo(() => describeWorksheet(worksheet), [worksheet]);
  const questions = useMemo(
    () => (worksheet.questions.length > 0 ? worksheet.questions : generateQuestions(worksheet)),
    [worksheet],
  );

  return (
    <>
      <h1>{worksheet.title}</h1>
      {context ? <p className="context">{context}</p> : null}
      <nav aria-label="On this page" className="page-nav">
        <ul>
          <li>
            <JumpLink targetId="summary">Summary</JumpLink>
          </li>
          <li>
            <JumpLink targetId="explore">Explore the graph</JumpLink>
          </li>
          <li>
            <JumpLink targetId="table">Data table</JumpLink>
          </li>
          <li>
            <JumpLink targetId="practice">Practice questions</JumpLink>
          </li>
        </ul>
      </nav>

      <section aria-labelledby="summary">
        <h2 id="summary" tabIndex={-1}>
          Summary
        </h2>
        {paragraphs.map((p, i) => (
          <p key={i} data-testid={i === 1 ? 'summary-text' : undefined}>
            {p}
          </p>
        ))}
      </section>

      <section aria-labelledby="explore">
        <h2 id="explore" tabIndex={-1}>
          Explore the graph
        </h2>
        <GraphExplorer worksheet={worksheet} />
      </section>

      <section aria-labelledby="table">
        <h2 id="table" tabIndex={-1}>
          Data table
        </h2>
        <DataTable worksheet={worksheet} />
      </section>

      <section aria-labelledby="practice">
        <h2 id="practice" tabIndex={-1}>
          Practice questions
        </h2>
        <Practice questions={questions} resetKey={worksheet.title + worksheet.x.values.join(',')} />
      </section>

      <p>
        <a href={printHref}>Printable high-contrast version of this graph</a>
      </p>
    </>
  );
}
