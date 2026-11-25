"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { displayValue } from "@/features/analytics/event-properties";
import { cn } from "@/lib/utils/cn";
import { formatTimeMs } from "@/lib/utils/format";
import type { DebugEvent } from "@/types";

/** One event in the live feed: time, name and a short property preview. Click to see every property. */
export function DebugEventRow({ event, fresh }: { event: DebugEvent; fresh: boolean }) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(event.properties);
  const meta = [event.platform, event.deviceModel, event.country, event.appVersion && `v${event.appVersion}`].filter(Boolean).join(" · ");

  return (
    <li className={cn(fresh && "animate-flash")}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-canvas/60"
      >
        {open ? <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" /> : <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />}
        <span className="mt-0.5 shrink-0 font-mono text-xs tabular-nums text-ink-faint">{formatTimeMs(event.time)}</span>
        <span className="min-w-0 flex-1">
          <span className="block break-all font-mono text-[13px] font-semibold">{event.name}</span>
          {!open && entries.length > 0 && (
            <span className="mt-1 flex flex-wrap gap-1.5">
              {entries.slice(0, 4).map(([key, value]) => (
                <span key={key} className="max-w-[220px] truncate rounded bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-ink-soft" title={`${key}: ${displayValue(value)}`}>
                  {key}: {displayValue(value)}
                </span>
              ))}
              {entries.length > 4 && <span className="py-0.5 text-[11px] text-ink-faint">+{entries.length - 4} more</span>}
            </span>
          )}
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-line bg-canvas/40 px-4 py-3 pl-11">
          {entries.length === 0 ? (
            <p className="text-xs text-ink-faint">This event has no properties.</p>
          ) : (
            <dl className="grid grid-cols-[minmax(80px,200px)_1fr] gap-x-4 gap-y-1.5 text-xs">
              {entries.map(([key, value]) => (
                <div key={key} className="contents">
                  <dt className="break-all font-mono text-ink-soft">{key}</dt>
                  <dd className="break-all font-mono">{displayValue(value)}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-ink-faint">{meta || "No device details"}</p>
            <CopyButton text={JSON.stringify({ name: event.name, properties: event.properties }, null, 2)} label="Copy JSON" variant="ghost" />
          </div>
        </div>
      )}
    </li>
  );
}
