"use client";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Segmented } from "@/components/ui/segmented";
import { formatDate, platformLabel } from "@/lib/utils/format";
import { PRESETS, type RangePreset } from "@/lib/utils/date-range";
import { useAnalyticsFilters } from "./filters-context";

const PRESET_OPTIONS: { value: RangePreset; label: string }[] = [
  ...PRESETS.map((p) => ({ value: p.id as RangePreset, label: p.label })),
  { value: "custom", label: "Custom" },
];

export function FilterBar() {
  const f = useAnalyticsFilters();
  const known = f.platforms.data?.map((p) => p.platform) ?? [];
  // Keep the selected platform in the list even if it has no events in the new range.
  const platformOptions = f.platform && !known.includes(f.platform) ? [f.platform, ...known] : known;

  return (
    <div className="mb-5 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Date range" options={PRESET_OPTIONS} value={f.preset} onChange={f.setPreset} />
        {f.preset === "custom" && (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              aria-label="From date"
              value={f.customFrom}
              max={f.customTo}
              onChange={(e) => f.setCustom(e.target.value, f.customTo)}
              className="w-auto"
            />
            <span className="text-xs text-ink-soft">to</span>
            <Input
              type="date"
              aria-label="To date"
              value={f.customTo}
              min={f.customFrom}
              onChange={(e) => f.setCustom(f.customFrom, e.target.value)}
              className="w-auto"
            />
          </div>
        )}
        <Select aria-label="Platform" value={f.platform} onChange={(e) => f.setPlatform(e.target.value)} className="w-auto min-w-[150px]">
          <option value="">All platforms</option>
          {platformOptions.map((p) => (
            <option key={p} value={p}>
              {platformLabel(p)}
            </option>
          ))}
        </Select>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-ink-soft">
            {formatDate(f.range.from)} – {formatDate(f.range.to)}
          </span>
          <Button onClick={f.refresh}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>
      {f.rangeError && (
        <p role="alert" className="text-xs text-red-600">
          {f.rangeError}
        </p>
      )}
    </div>
  );
}
