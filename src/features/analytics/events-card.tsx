"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search, SearchX, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form";
import { useAsync } from "@/hooks/use-async";
import { getEvents } from "@/lib/api/analytics";
import { cn } from "@/lib/utils/cn";
import { formatCount, formatDateTime, relativeTime } from "@/lib/utils/format";
import type { EventType } from "@/types";
import { useAnalyticsFilters } from "./filters-context";
import { SortSelect, toSortParams, type SortKey } from "./sort-select";

const PAGE_SIZE = 50;

const TYPE_STYLES: Record<EventType, string> = {
  custom: "border-brand/20 bg-brand-soft text-brand",
  screen: "border-sky-200 bg-sky-50 text-sky-700",
  default: "border-zinc-200 bg-zinc-100 text-zinc-700",
};

export function TypeBadge({ type }: { type: EventType }) {
  return <span className={cn("rounded border px-1.5 py-0.5 text-[11px] font-medium", TYPE_STYLES[type] ?? TYPE_STYLES.default)}>{type}</span>;
}

export function EventsCard({ projectId }: { projectId: string }) {
  const { filters, refreshKey } = useAnalyticsFilters();
  const [sort, setSort] = useState<SortKey>("count:desc");
  const [query, setQuery] = useState("");
  const [type, setType] = useState<EventType | "all">("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const events = useAsync((signal) => getEvents(projectId, filters, toSortParams(sort), signal), [projectId, filters, sort, refreshKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (events.data ?? []).filter((e) => (type === "all" || e.type === type) && (!q || e.name.toLowerCase().includes(q)));
  }, [events.data, query, type]);

  const base = `/projects/${encodeURIComponent(projectId)}/analytics/events`;
  const searching = query.trim() !== "" || type !== "all";

  return (
    <Card
      title="Events"
      subtitle={events.data ? `${searching ? `${filtered.length} of ` : ""}${events.data.length} events` : undefined}
      actions={<SortSelect value={sort} onChange={(v) => { setSort(v); setVisible(PAGE_SIZE); }} label="Sort events" />}
      bodyClassName="p-0"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-3" role="search">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ink-faint" aria-hidden />
          <Input
            aria-label="Search events"
            placeholder="Search events by name..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setVisible(PAGE_SIZE); }}
            className="pl-8 pr-8"
          />
          {query && (
            <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-2 top-2 rounded p-0.5 text-ink-faint hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select aria-label="Event type" value={type} onChange={(e) => { setType(e.target.value as EventType | "all"); setVisible(PAGE_SIZE); }} className="w-auto">
          <option value="all">All types</option>
          <option value="custom">Custom</option>
          <option value="screen">Screen</option>
          <option value="default">Default</option>
        </Select>
      </div>

      {events.error && !events.data ? (
        <div className="p-4">
          <ErrorState compact error={events.error} title="Unable to load events" description="The events list could not be loaded." onRetry={events.reload} />
        </div>
      ) : !events.data ? (
        <div className="space-y-2 p-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : events.data.length === 0 ? (
        <div className="p-4">
          <EmptyState title="No events yet" description="Events sent by your app's SDK in this period will show up here." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-4">
          <EmptyState icon={<SearchX className="h-5 w-5" />} title="No matching events" description="No event name matches your search or type filter." />
        </div>
      ) : (
        <>
          <div className={cn("overflow-x-auto transition-opacity", events.loading && "opacity-50")}>
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-line bg-canvas/60 text-xs text-ink-soft">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Event name</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 text-right font-medium">Count</th>
                  <th className="px-4 py-2.5 font-medium">Last seen</th>
                  <th className="w-8 px-2 py-2.5" aria-label="Open" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.slice(0, visible).map((event) => (
                  <tr key={`${event.name}:${event.type}`} className="hover:bg-canvas/50">
                    <td className="px-4 py-2.5 font-medium">
                      <Link href={`${base}/${encodeURIComponent(event.name)}`} className="break-all font-mono text-[13px] hover:text-brand hover:underline">
                        {event.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <TypeBadge type={event.type} />
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatCount(event.count)}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-ink-soft" title={formatDateTime(event.lastSeenAt)}>
                      {relativeTime(event.lastSeenAt)}
                    </td>
                    <td className="px-2 py-2.5 text-ink-faint">
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > visible && (
            <button type="button" onClick={() => setVisible((v) => v + PAGE_SIZE)} className="w-full border-t border-line px-4 py-2.5 text-xs font-medium text-brand hover:bg-canvas/60">
              Show more ({filtered.length - visible} left)
            </button>
          )}
        </>
      )}
    </Card>
  );
}
