"use client";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useAsync, type AsyncState } from "@/hooks/use-async";
import { getPlatforms } from "@/lib/api/analytics";
import {
  DAY,
  MAX_POINTS,
  PRESETS,
  autoInterval,
  customRange,
  pointCount,
  presetRange,
  toDayString,
  type DateRange,
  type RangePreset,
} from "@/lib/utils/date-range";
import type { AnalyticsFilters, AnalyticsInterval, PlatformStat } from "@/types";

interface FiltersValue {
  preset: RangePreset;
  setPreset: (preset: RangePreset) => void;
  customFrom: string;
  customTo: string;
  setCustom: (from: string, to: string) => void;
  rangeError: string | null;
  range: DateRange;

  platform: string;
  setPlatform: (platform: string) => void;
  /** Platforms seen in the selected date range (not narrowed by the platform filter). */
  platforms: AsyncState<PlatformStat[]>;

  interval: AnalyticsInterval;
  intervalAllowed: Record<AnalyticsInterval, boolean>;
  setInterval: (interval: AnalyticsInterval) => void;

  /** Memoised, safe to use as an effect dependency. */
  filters: AnalyticsFilters;
  refreshKey: number;
  refresh: () => void;
}

const FiltersContext = createContext<FiltersValue | null>(null);

/** Date range, platform and interval shared by the analytics page and the event detail page. */
export function AnalyticsFiltersProvider({ children }: { children: ReactNode }) {
  const { projectId } = useParams<{ projectId: string }>();
  const [preset, setPresetState] = useState<RangePreset>("7d");
  const [anchor, setAnchor] = useState(() => Date.now());
  const [customFrom, setCustomFrom] = useState(() => toDayString(new Date(Date.now() - 6 * DAY)));
  const [customTo, setCustomTo] = useState(() => toDayString(new Date()));
  const [platform, setPlatform] = useState("");
  const [manualInterval, setManualInterval] = useState<AnalyticsInterval | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const custom = useMemo(() => (preset === "custom" ? customRange(customFrom, customTo) : null), [preset, customFrom, customTo]);
  // While a custom range is invalid (mid-edit), keep showing the last valid one instead of refetching.
  const lastValid = useRef<DateRange | null>(null);
  const range = useMemo<DateRange>(() => {
    if (custom) return custom.range ?? lastValid.current ?? presetRange(7 * DAY, anchor);
    const ms = PRESETS.find((p) => p.id === preset)?.ms ?? 7 * DAY;
    return presetRange(ms, anchor);
  }, [custom, preset, anchor]);
  lastValid.current = range;

  const intervalAllowed = useMemo(
    () => ({ day: pointCount(range.spanMs, "day") <= MAX_POINTS, hour: pointCount(range.spanMs, "hour") <= MAX_POINTS }),
    [range.spanMs],
  );
  const auto = autoInterval(range.spanMs);
  const interval: AnalyticsInterval =
    manualInterval && intervalAllowed[manualInterval] ? manualInterval : intervalAllowed[auto] ? auto : intervalAllowed.day ? "day" : "hour";

  const filters = useMemo<AnalyticsFilters>(() => ({ from: range.from, to: range.to, platform: platform || undefined }), [range.from, range.to, platform]);
  const platforms = useAsync((signal) => getPlatforms(projectId, { from: range.from, to: range.to }, signal), [projectId, range.from, range.to, refreshKey]);

  const setPreset = useCallback((next: RangePreset) => {
    setPresetState(next);
    setManualInterval(null);
    if (next !== "custom") setAnchor(Date.now());
  }, []);
  const setCustom = useCallback((from: string, to: string) => {
    setCustomFrom(from);
    setCustomTo(to);
    setManualInterval(null);
  }, []);
  const refresh = useCallback(() => {
    setAnchor(Date.now());
    setRefreshKey((k) => k + 1);
  }, []);

  const value = useMemo<FiltersValue>(
    () => ({
      preset,
      setPreset,
      customFrom,
      customTo,
      setCustom,
      rangeError: custom?.error ?? null,
      range,
      platform,
      setPlatform,
      platforms,
      interval,
      intervalAllowed,
      setInterval: setManualInterval,
      filters,
      refreshKey,
      refresh,
    }),
    [preset, setPreset, customFrom, customTo, setCustom, custom, range, platform, platforms, interval, intervalAllowed, filters, refreshKey, refresh],
  );

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useAnalyticsFilters(): FiltersValue {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useAnalyticsFilters must be used inside AnalyticsFiltersProvider");
  return ctx;
}
