"use client";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/feedback";
import { useAsync } from "@/hooks/use-async";
import { getEventProperties } from "@/lib/api/analytics";
import { cn } from "@/lib/utils/cn";
import { formatCount } from "@/lib/utils/format";
import { useAnalyticsFilters } from "./filters-context";

export function displayValue(value: unknown): string {
  if (typeof value === "string") return value === "" ? '""' : value;
  if (value === null || value === undefined) return "null";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

/** For each property key: how often it was sent and its most used values. */
export function EventProperties({ projectId, name }: { projectId: string; name: string }) {
  const { filters, refreshKey } = useAnalyticsFilters();
  const result = useAsync((signal) => getEventProperties(projectId, name, filters, signal), [projectId, name, filters, refreshKey]);
  const data = result.data;

  return (
    <Card
      className="mb-5"
      title="Properties"
      subtitle={data ? `Based on the latest ${formatCount(data.sampledEvents)} events` : "Most used values for each property"}
    >
      {result.error && !data ? (
        <ErrorState compact error={result.error} title="Unable to load properties" description="Property details could not be loaded." onRetry={result.reload} />
      ) : !data ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : data.properties.length === 0 ? (
        <EmptyState title="No properties" description="This event was sent without any properties in this period." />
      ) : (
        <div className={cn("grid gap-3 md:grid-cols-2", result.loading && "opacity-50")}>
          {data.properties.map((property) => {
            const seen = data.sampledEvents ? Math.round((property.count / data.sampledEvents) * 100) : 0;
            return (
              <div key={property.key} className="rounded-md border border-line p-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 truncate font-mono text-[13px] font-semibold" title={property.key}>
                    {property.key}
                  </p>
                  <p className="shrink-0 text-xs text-ink-faint">
                    in {formatCount(property.count)} events · {seen}%
                  </p>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {property.topValues.map((entry, i) => {
                    const share = property.count ? (entry.count / property.count) * 100 : 0;
                    return (
                      <li key={i} className="text-xs">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="min-w-0 truncate font-mono" title={displayValue(entry.value)}>
                            {displayValue(entry.value)}
                          </span>
                          <span className="shrink-0 tabular-nums text-ink-soft">{formatCount(entry.count)}</span>
                        </div>
                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-canvas">
                          <div className="h-full rounded-full bg-brand/70" style={{ width: `${share}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
