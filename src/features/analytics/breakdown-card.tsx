"use client";
import { useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { ErrorState, Skeleton } from "@/components/ui/feedback";
import type { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import { formatCount } from "@/lib/utils/format";

export interface BreakdownItem {
  key: string;
  label: string;
  hint?: string;
  count: number;
}

interface Props {
  title: string;
  items: BreakdownItem[] | null;
  loading: boolean;
  error: ApiError | null;
  onRetry: () => void;
  emptyText: string;
  actions?: ReactNode;
  /** When set, rows are clickable (used to filter by platform). */
  onSelect?: (key: string) => void;
  selectedKey?: string;
  limit?: number;
}

/** A ranked list with a share bar per row: platforms, countries, devices. */
export function BreakdownCard({ title, items, loading, error, onRetry, emptyText, actions, onSelect, selectedKey, limit = 6 }: Props) {
  const [expanded, setExpanded] = useState(false);
  const total = items?.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const shown = items && !expanded ? items.slice(0, limit) : items;

  return (
    <Card title={title} actions={actions} bodyClassName="p-0">
      {error && !items ? (
        <div className="p-4">
          <ErrorState compact error={error} title={`Unable to load ${title.toLowerCase()}`} description="This report could not be loaded." onRetry={onRetry} />
        </div>
      ) : !items ? (
        <div className="space-y-3 p-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="p-4 text-sm text-ink-soft">{emptyText}</p>
      ) : (
        <>
          <ul className={cn("divide-y divide-line transition-opacity", loading && "opacity-50")}>
            {shown?.map((item) => {
              const percent = total ? (item.count / total) * 100 : 0;
              const selected = selectedKey === item.key;
              const row = (
                <>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium">
                      {item.label}
                      {item.hint && <span className="ml-2 font-mono text-xs font-normal text-ink-faint">{item.hint}</span>}
                    </span>
                    <span className="shrink-0 tabular-nums text-ink-soft">
                      {formatCount(item.count)} <span className="text-xs text-ink-faint">· {percent < 1 && percent > 0 ? "<1" : Math.round(percent)}%</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
                  </div>
                </>
              );
              return (
                <li key={item.key}>
                  {onSelect ? (
                    <button
                      type="button"
                      onClick={() => onSelect(selected ? "" : item.key)}
                      aria-pressed={selected}
                      className={cn("block w-full px-4 py-2.5 text-left hover:bg-canvas/60", selected && "bg-brand-soft/60")}
                    >
                      {row}
                    </button>
                  ) : (
                    <div className="px-4 py-2.5">{row}</div>
                  )}
                </li>
              );
            })}
          </ul>
          {items.length > limit && (
            <button type="button" onClick={() => setExpanded((v) => !v)} className="w-full border-t border-line px-4 py-2 text-xs font-medium text-brand hover:bg-canvas/60">
              {expanded ? "Show less" : `Show all ${items.length}`}
            </button>
          )}
        </>
      )}
    </Card>
  );
}
