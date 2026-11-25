import type { AnalyticsInterval, TimelinePoint } from "@/types";

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;
/** The backend rejects timelines with more points than this. */
export const MAX_POINTS = 100;

export type RangePreset = "24h" | "7d" | "30d" | "90d" | "custom";

export const PRESETS: { id: Exclude<RangePreset, "custom">; label: string; ms: number }[] = [
  { id: "24h", label: "24 hours", ms: DAY },
  { id: "7d", label: "7 days", ms: 7 * DAY },
  { id: "30d", label: "30 days", ms: 30 * DAY },
  { id: "90d", label: "90 days", ms: 90 * DAY },
];

export interface DateRange {
  from: string;
  to: string;
  spanMs: number;
}

export function presetRange(ms: number, now = Date.now()): DateRange {
  return { from: new Date(now - ms).toISOString(), to: new Date(now).toISOString(), spanMs: ms };
}

/** "yyyy-mm-dd" in the user's local time zone (what <input type="date"> uses). */
export function toDayString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDay(day: string, endOfDay: boolean): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  return endOfDay ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d);
}

/** Whole local days, from the start of `fromDay` to the end of `toDay`. */
export function customRange(fromDay: string, toDay: string): { range: DateRange | null; error: string | null } {
  const from = parseDay(fromDay, false);
  const to = parseDay(toDay, true);
  if (!from || !to) return { range: null, error: "Pick both dates." };
  if (from > to) return { range: null, error: "The start date must be before the end date." };
  const spanMs = to.getTime() - from.getTime();
  if (pointCount(spanMs, "day") > MAX_POINTS) return { range: null, error: "Pick a range of up to 99 days." };
  return { range: { from: from.toISOString(), to: to.toISOString(), spanMs }, error: null };
}

/** Like Firebase: short ranges are shown per hour, longer ones per day. */
export function autoInterval(spanMs: number): AnalyticsInterval {
  return spanMs <= 2 * DAY ? "hour" : "day";
}

export function pointCount(spanMs: number, interval: AnalyticsInterval): number {
  return Math.ceil(spanMs / (interval === "hour" ? HOUR : DAY)) + 1;
}

export interface Bucket {
  time: number;
  count: number;
}

/**
 * Adds zero-count buckets so the chart has no gaps. If the backend buckets don't line up with ours
 * (checked by comparing totals), the raw points are returned untouched.
 */
export function fillBuckets(points: TimelinePoint[], range: DateRange, interval: AnalyticsInterval): Bucket[] {
  const raw = points
    .map((p) => ({ time: new Date(p.time).getTime(), count: p.count }))
    .filter((p) => Number.isFinite(p.time))
    .sort((a, b) => a.time - b.time);
  const step = interval === "hour" ? HOUR : DAY;
  const start = Math.floor(Date.parse(range.from) / step) * step;
  const end = Math.floor(Date.parse(range.to) / step) * step;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return raw;

  const known = new Map(raw.map((p) => [p.time, p.count]));
  const filled: Bucket[] = [];
  let matched = 0;
  for (let t = start; t <= end; t += step) {
    const count = known.get(t) ?? 0;
    matched += count;
    filled.push({ time: t, count });
  }
  const total = raw.reduce((sum, p) => sum + p.count, 0);
  return matched === total && filled.length <= MAX_POINTS + 1 ? filled : raw;
}
