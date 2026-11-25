"use client";
import { useMemo, useState } from "react";
import { useElementWidth } from "@/hooks/use-element-width";
import { cn } from "@/lib/utils/cn";
import { formatCount } from "@/lib/utils/format";
import type { Bucket } from "@/lib/utils/date-range";
import type { AnalyticsInterval } from "@/types";

const HEIGHT = 240;
const MARGIN = { top: 10, right: 8, bottom: 26, left: 44 };
const TICKS = 4;

/** Round the top of the axis up to a tidy number so the 4 grid lines are whole counts. */
function niceMax(value: number): number {
  if (value <= TICKS) return TICKS;
  const magnitude = 10 ** Math.floor(Math.log10(value / TICKS));
  const n = value / TICKS / magnitude;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * magnitude * TICKS;
}

function axisLabel(time: number, interval: AnalyticsInterval): string {
  const date = new Date(time);
  if (interval === "day") return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  if (date.getHours() === 0) return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return date.toLocaleTimeString("en-US", { hour: "numeric" });
}

function tooltipLabel(time: number, interval: AnalyticsInterval): string {
  const date = new Date(time);
  if (interval === "day") return `${date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })} (UTC)`;
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/** Bar chart of events per day or hour. Drawn with plain SVG, themed with the brand colour. */
export function TimelineChart({ buckets, interval, dim }: { buckets: Bucket[]; interval: AnalyticsInterval; dim?: boolean }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const { max, total, peak } = useMemo(() => {
    const counts = buckets.map((b) => b.count);
    const top = Math.max(0, ...counts);
    return { max: niceMax(top), total: counts.reduce((a, b) => a + b, 0), peak: buckets.find((b) => b.count === top) };
  }, [buckets]);

  const innerW = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const band = buckets.length ? innerW / buckets.length : 0;
  const barW = Math.max(1, Math.min(band * 0.72, 36));
  const labelEvery = Math.max(1, Math.ceil(buckets.length / Math.max(1, Math.floor(innerW / 64))));
  const y = (value: number) => MARGIN.top + innerH - (value / max) * innerH;

  const hovered = hover !== null ? buckets[hover] : null;
  const tipLeft = hover !== null ? Math.min(Math.max(MARGIN.left + (hover + 0.5) * band, 80), Math.max(80, width - 80)) : 0;

  return (
    <div ref={ref} className={cn("relative transition-opacity", dim && "opacity-50")} style={{ height: HEIGHT }}>
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`Events per ${interval}. ${formatCount(total)} in total${peak ? `, busiest ${tooltipLabel(peak.time, interval)} with ${formatCount(peak.count)}` : ""}.`}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const x = e.clientX - e.currentTarget.getBoundingClientRect().left - MARGIN.left;
            const index = band ? Math.floor(x / band) : -1;
            setHover(index >= 0 && index < buckets.length ? index : null);
          }}
        >
          {Array.from({ length: TICKS + 1 }, (_, i) => {
            const value = (max / TICKS) * i;
            return (
              <g key={i}>
                <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(value)} y2={y(value)} className="stroke-line" />
                <text x={MARGIN.left - 8} y={y(value) + 4} textAnchor="end" className="fill-ink-faint text-[11px] tabular-nums">
                  {formatCount(value)}
                </text>
              </g>
            );
          })}

          {buckets.map((bucket, i) => {
            const x = MARGIN.left + i * band + (band - barW) / 2;
            const h = innerH - (y(bucket.count) - MARGIN.top);
            return (
              <g key={bucket.time}>
                {hover === i && <rect x={MARGIN.left + i * band} y={MARGIN.top} width={band} height={innerH} className="fill-canvas" />}
                {bucket.count > 0 && <rect x={x} y={y(bucket.count)} width={barW} height={h} rx={Math.min(2, barW / 2)} className={hover === i ? "fill-brand-hover" : "fill-brand"} />}
                {i % labelEvery === 0 && (
                  <text x={MARGIN.left + (i + 0.5) * band} y={HEIGHT - 8} textAnchor="middle" className="fill-ink-faint text-[11px]">
                    {axisLabel(bucket.time, interval)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
      {hovered && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-white px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: tipLeft }}
        >
          <p className="text-ink-soft">{tooltipLabel(hovered.time, interval)}</p>
          <p className="font-semibold tabular-nums">{formatCount(hovered.count)} events</p>
        </div>
      )}
    </div>
  );
}
