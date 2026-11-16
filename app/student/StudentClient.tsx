'use client';

import { useEffect } from 'react';
import { WorksheetView } from '@/components/WorksheetView';
import { useWorksheetFromLocation } from '@/components/useWorksheet';
import { samples } from '@/lib/samples';

export function StudentClient() {
  const loaded = useWorksheetFromLocation();

  useEffect(() => {
    if (loaded.status === 'ok') document.title = `${loaded.worksheet.title} | HearGraph`;
  }, [loaded]);

  if (loaded.status === 'loading') {
    return (
      <>
        <h1>Student view</h1>
        <p>Loading the graph…</p>
        <noscript>
          <p>HearGraph needs JavaScript to read the graph data from the link.</p>
        </noscript>
      </>
    );
  }

  if (loaded.status === 'error') {
    return (
      <>
        <h1>This graph could not be opened</h1>
        <p role="alert">{loaded.message}</p>
        <p>
          <a href="/student/?sample=cart">Open the built-in example instead</a>
        </p>
      </>
    );
  }

  return (
    <>
      <WorksheetView worksheet={loaded.worksheet} context={loaded.context} printHref={`/print/${loaded.locator}`} />
      {loaded.source === 'link' ? (
        <p>
          <a href={`/teacher/${loaded.locator}`}>Teachers: edit a copy of this graph</a>
        </p>
      ) : null}
      <section aria-labelledby="more-examples">
        <h2 id="more-examples">Built-in examples</h2>
        <p>All built-in examples use made-up numbers.</p>
        <ul>
          {samples.map((s) => (
            <li key={s.id}>
              {/* Plain links (full page load) so the address always matches the graph shown. */}
              <a href={`/student/?sample=${s.id}`}>{s.worksheet.title}</a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
