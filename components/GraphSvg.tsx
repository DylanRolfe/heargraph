import { formatNumber } from '@/lib/describe';
import type { Worksheet } from '@/lib/types';

/** Tick positions at "round" steps (1, 2 or 5 times a power of ten). */
export function niceTicks(min: number, max: number, target: number): number[] {
  if (!(max > min)) return [min];
  const rough = (max - min) / Math.max(1, target);
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const frac = rough / pow;
  const step = (frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10) * pow;
  const ticks: number[] = [];
  const first = Math.ceil(min / step - 1e-9) * step;
  for (let v = first; v <= max + step * 1e-9; v += step) {
    ticks.push(Math.abs(v) < step * 1e-9 ? 0 : Number(v.toPrecision(12)));
  }
  return ticks;
}

/** The y-range shown: all series, widened to round numbers, including zero when it is close. */
export function yDomain(w: Worksheet): { min: number; max: number; ticks: number[] } {
  let lo = Infinity;
  let hi = -Infinity;
  for (const s of w.series) {
    for (const v of s.values) {
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    lo = 0;
    hi = 1;
  }
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  if (lo > 0 && lo <= 0.6 * hi) lo = 0;
  if (hi < 0 && hi >= 0.6 * lo) hi = 0;
  const rough = niceTicks(lo, hi, 6);
  const step = rough.length > 1 ? rough[1] - rough[0] : hi - lo;
  const min = Math.floor(lo / step + 1e-9) * step;
  const max = Math.ceil(hi / step - 1e-9) * step;
  return { min, max, ticks: niceTicks(min, max, Math.round((max - min) / step)) };
}

export interface GraphSvgProps {
  worksheet: Worksheet;
  width: number;
  height: number;
  /** Highlighted point, or null for none. */
  active: { series: number; index: number } | null;
  onPointClick?: (series: number, index: number) => void;
  /** Adds a title element and role="img" for standalone use (print, download). */
  standaloneLabel?: string;
}

function axisTitle(label: string, unit: string): string {
  return unit ? `${label} (${unit})` : label;
}

export function GraphSvg({ worksheet, width, height, active, onPointClick, standaloneLabel }: GraphSvgProps) {
  const xs = worksheet.x.values;
  const twoSeries = worksheet.series.length > 1;
  const m = { left: 58, right: 18, top: twoSeries ? 54 : 34, bottom: 50 };
  const plotW = Math.max(10, width - m.left - m.right);
  const plotH = Math.max(10, height - m.top - m.bottom);
  const xMin = xs[0];
  const xMax = xs[xs.length - 1];
  const yd = yDomain(worksheet);
  const sx = (v: number) => m.left + (xMax === xMin ? plotW / 2 : ((v - xMin) / (xMax - xMin)) * plotW);
  const sy = (v: number) => m.top + plotH - ((v - yd.min) / (yd.max - yd.min)) * plotH;
  const xTicks = niceTicks(xMin, xMax, width < 420 ? 4 : 8);
  const showZero = yd.min < 0 && yd.max > 0;

  const activePoint =
    active && worksheet.series[active.series] && active.index < xs.length
      ? {
          cx: sx(xs[active.index]),
          cy: sy(worksheet.series[active.series].values[active.index]),
          x: xs[active.index],
          y: worksheet.series[active.series].values[active.index],
        }
      : null;

  // Keep the value label inside the plot.
  let labelX = 0;
  let labelY = 0;
  let labelAnchor: 'start' | 'end' = 'start';
  if (activePoint) {
    labelAnchor = activePoint.cx > m.left + plotW * 0.6 ? 'end' : 'start';
    labelX = activePoint.cx + (labelAnchor === 'start' ? 16 : -16);
    labelY = activePoint.cy < m.top + 34 ? activePoint.cy + 30 : activePoint.cy - 16;
  }

  return (
    <svg
      className="graph-svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      role={standaloneLabel ? 'img' : undefined}
      aria-label={standaloneLabel}
      aria-hidden={standaloneLabel ? undefined : true}
      focusable="false"
    >
      {standaloneLabel ? <title>{standaloneLabel}</title> : null}
      <rect className="g-bg" x={m.left} y={m.top} width={plotW} height={plotH} />

      {yd.ticks.map((t) => (
        <g key={`y${t}`}>
          <line className="g-grid" x1={m.left} x2={m.left + plotW} y1={sy(t)} y2={sy(t)} />
          <text className="g-text" x={m.left - 8} y={sy(t)} textAnchor="end" dominantBaseline="middle">
            {formatNumber(t)}
          </text>
        </g>
      ))}
      {xTicks.map((t) => (
        <g key={`x${t}`}>
          <line className="g-grid" x1={sx(t)} x2={sx(t)} y1={m.top} y2={m.top + plotH} />
          <text className="g-text" x={sx(t)} y={m.top + plotH + 18} textAnchor="middle">
            {formatNumber(t)}
          </text>
        </g>
      ))}

      <rect className="g-frame" x={m.left} y={m.top} width={plotW} height={plotH} />
      {showZero ? <line className="g-zero" x1={m.left} x2={m.left + plotW} y1={sy(0)} y2={sy(0)} /> : null}

      <text className="g-text g-axis-title" x={m.left + plotW / 2} y={height - 8} textAnchor="middle">
        {axisTitle(worksheet.x.label, worksheet.x.unit)}
      </text>

      {/* y-axis title / legend, written horizontally so it stays readable */}
      {worksheet.series.map((s, si) => {
        const y = 16 + si * 20;
        return (
          <g key={`legend${si}`}>
            {twoSeries ? (
              <>
                <line className={`g-line g-line-${si}`} x1={8} x2={40} y1={y} y2={y} />
                {si === 0 ? (
                  <circle className={`g-marker g-marker-${si}`} cx={24} cy={y} r={4.5} />
                ) : (
                  <rect className={`g-marker g-marker-${si}`} x={19.5} y={y - 4.5} width={9} height={9} />
                )}
              </>
            ) : null}
            <text className="g-text g-axis-title" x={twoSeries ? 48 : 8} y={y} dominantBaseline="middle">
              {axisTitle(s.label, s.unit)}
            </text>
          </g>
        );
      })}

      {worksheet.series.map((s, si) => (
        <g key={`series${si}`}>
          <polyline
            className={`g-line g-line-${si}`}
            fill="none"
            points={s.values.map((v, i) => `${sx(xs[i]).toFixed(2)},${sy(v).toFixed(2)}`).join(' ')}
          />
          {s.values.map((v, i) =>
            si === 0 ? (
              <circle key={i} className={`g-marker g-marker-${si}`} cx={sx(xs[i])} cy={sy(v)} r={4.5} />
            ) : (
              <rect
                key={i}
                className={`g-marker g-marker-${si}`}
                x={sx(xs[i]) - 4.5}
                y={sy(v) - 4.5}
                width={9}
                height={9}
              />
            ),
          )}
        </g>
      ))}

      {activePoint ? (
        <g>
          <line className="g-guide" x1={activePoint.cx} x2={activePoint.cx} y1={m.top} y2={m.top + plotH} />
          <circle className="g-active-halo" cx={activePoint.cx} cy={activePoint.cy} r={13} />
          <circle className="g-active" cx={activePoint.cx} cy={activePoint.cy} r={7} />
          <text className="g-text g-value-label" x={labelX} y={labelY} textAnchor={labelAnchor}>
            {`${formatNumber(activePoint.x)}, ${formatNumber(activePoint.y)}`}
          </text>
        </g>
      ) : null}

      {onPointClick
        ? worksheet.series.map((s, si) =>
            s.values.map((v, i) => (
              <circle
                key={`hit${si}-${i}`}
                className="g-hit"
                cx={sx(xs[i])}
                cy={sy(v)}
                r={Math.max(8, Math.min(18, plotW / xs.length / 2))}
                onClick={() => onPointClick(si, i)}
              />
            )),
          )
        : null}
    </svg>
  );
}
