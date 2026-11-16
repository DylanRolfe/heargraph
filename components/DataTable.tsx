import { formatNumber } from '@/lib/describe';
import type { Worksheet } from '@/lib/types';

function heading(label: string, unit: string): string {
  return unit ? `${label} (${unit})` : label;
}

export function DataTable({ worksheet, scroll = true }: { worksheet: Worksheet; scroll?: boolean }) {
  const table = (
    <table className="data-table">
      <caption>
        {worksheet.title}: {worksheet.x.values.length} rows. Each row is one point on the graph.
      </caption>
      <thead>
        <tr>
          <th scope="col">{heading(worksheet.x.label, worksheet.x.unit)}</th>
          {worksheet.series.map((s, i) => (
            <th key={i} scope="col">
              {heading(s.label, s.unit)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {worksheet.x.values.map((x, i) => (
          <tr key={i}>
            <th scope="row">{formatNumber(x)}</th>
            {worksheet.series.map((s, si) => (
              <td key={si}>{formatNumber(s.values[i])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
  if (!scroll) return table;
  return (
    <div className="table-scroll" role="region" aria-label={`Data table for ${worksheet.title}`} tabIndex={0}>
      {table}
    </div>
  );
}
