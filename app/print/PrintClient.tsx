'use client';

import { useRef } from 'react';
import { DataTable } from '@/components/DataTable';
import { GraphSvg } from '@/components/GraphSvg';
import { useDocumentTitle } from '@/components/useDocumentTitle';
import { useWorksheetFromLocation } from '@/components/useWorksheet';
import { describeWorksheet } from '@/lib/describe';

/** Styles copied into the downloaded SVG so it looks the same outside the site. */
const SVG_STYLE = `
text{font-family:Arial,Helvetica,sans-serif;font-size:16px;fill:#000}
.g-axis-title{font-weight:700}
.g-bg{fill:#fff}.g-frame{fill:none;stroke:#000;stroke-width:2}
.g-grid{stroke:#000;stroke-width:.5;stroke-dasharray:2 4}
.g-zero{stroke:#000;stroke-width:2.5}
.g-line{stroke:#000;stroke-width:3.5;fill:none}.g-line-1{stroke-dasharray:10 6}
.g-marker{fill:#000;stroke:#fff;stroke-width:1.5}.g-marker-1{fill:#fff;stroke:#000;stroke-width:2.5}
`;

export function PrintClient() {
  const loaded = useWorksheetFromLocation();
  const holder = useRef<HTMLDivElement>(null);
  useDocumentTitle(loaded.status === 'ok' ? `Printable: ${loaded.worksheet.title} | HearGraph` : null);


  if (loaded.status === 'loading') {
    return (
      <>
        <h1>Printable version</h1>
        <p className="loading">Loading the graph…</p>
      </>
    );
  }
  if (loaded.status === 'error') {
    return (
      <>
        <h1>This graph could not be opened</h1>
        <p role="alert">{loaded.message}</p>
      </>
    );
  }

  const w = loaded.worksheet;
  const paragraphs = describeWorksheet(w);

  const downloadSvg = () => {
    const svg = holder.current?.querySelector('svg');
    if (!svg) return;
    const copy = svg.cloneNode(true) as SVGSVGElement;
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = SVG_STYLE;
    copy.insertBefore(style, copy.firstChild);
    const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n', new XMLSerializer().serializeToString(copy)], {
      type: 'image/svg+xml',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${w.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'graph'}.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="print-page">
      <h1>{w.title}</h1>
      <div className="no-print">
        <p>
          This page is a black-on-white version with thick lines and large text, for printing or saving as a PDF.
          It has not been tested on braille embossers or tactile graphics printers.
        </p>
        <div className="button-row">
          <button type="button" onClick={() => window.print()}>
            Print or save as PDF
          </button>
          <button type="button" onClick={downloadSvg}>
            Download the graph as an SVG file
          </button>
          <a className="button-link" href={`/student/${loaded.locator}`}>
            Back to the interactive graph
          </a>
        </div>
      </div>
      <div ref={holder} className="print-graph">
        <GraphSvg
          worksheet={w}
          width={680}
          height={440}
          active={null}
          standaloneLabel={`Line graph: ${w.title}. A text description and data table follow.`}
        />
      </div>
      <h2>Description</h2>
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      <h2>Data table</h2>
      <DataTable worksheet={w} scroll={false} />
    </div>
  );
}
