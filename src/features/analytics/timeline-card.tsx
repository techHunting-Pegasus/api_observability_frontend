"use client";
import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/feedback";
import { Segmented } from "@/components/ui/segmented";
import { useAsync } from "@/hooks/use-async";
import { getTimeline } from "@/lib/api/analytics";
import { fillBuckets } from "@/lib/utils/date-range";
import { formatCount } from "@/lib/utils/format";
import { useAnalyticsFilters } from "./filters-context";
import { TimelineChart } from "./timeline-chart";

export function TimelineCard({ projectId }: { projectId: string }) {
  const { filters, range, interval, intervalAllowed, setInterval, refreshKey } = useAnalyticsFilters();
  const timeline = useAsync((signal) => getTimeline(projectId, filters, interval, signal), [projectId, filters, interval, refreshKey]);

  const buckets = useMemo(() => (timeline.data ? fillBuckets(timeline.data, range, interval) : []), [timeline.data, range, interval]);
  const total = buckets.reduce((sum, b) => sum + b.count, 0);

  const toggle = (
    <Segmented
      label="Group by"
      value={interval}
      onChange={setInterval}
      options={[
        { value: "hour", label: "Hourly", disabled: !intervalAllowed.hour, title: intervalAllowed.hour ? undefined : "Hourly needs a range of about 4 days or less" },
        { value: "day", label: "Daily", disabled: !intervalAllowed.day },
      ]}
    />
  );

  return (
    <Card
      className="mb-5"
      title="Events over time"
      subtitle={timeline.data ? `${formatCount(total)} events · days are grouped in UTC` : "Days are grouped in UTC"}
      actions={toggle}
    >
      {timeline.error && !timeline.data ? (
        <ErrorState compact error={timeline.error} title="Unable to load the graph" description="The timeline could not be loaded." onRetry={timeline.reload} />
      ) : !timeline.data ? (
        <Skeleton className="h-60 w-full" />
      ) : total === 0 ? (
        <EmptyState icon={<BarChart3 className="h-5 w-5" />} title="No events in this period" description="Try a longer date range or another platform." />
      ) : (
        <TimelineChart buckets={buckets} interval={interval} dim={timeline.loading} />
      )}
    </Card>
  );
}
