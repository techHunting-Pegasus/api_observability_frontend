"use client";
import { Activity, Layers, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { ErrorState, Skeleton } from "@/components/ui/feedback";
import { useAsync } from "@/hooks/use-async";
import { getOverview } from "@/lib/api/analytics";
import { cn } from "@/lib/utils/cn";
import { formatCount } from "@/lib/utils/format";
import { useAnalyticsFilters } from "./filters-context";

interface StatProps {
  label: string;
  hint: string;
  value: number | undefined;
  icon: ReactNode;
  dim: boolean;
  /** Draws attention to the key number. */
  highlight?: boolean;
}

function Stat({ label, hint, value, icon, dim, highlight }: StatProps) {
  return (
    <Card className={cn(highlight && "border-brand/30 bg-brand-soft/40")}>
      <div className="flex items-center gap-3">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", highlight ? "bg-brand text-white" : "bg-brand-soft text-brand")}>{icon}</span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-soft">{label}</p>
          {value === undefined ? (
            <Skeleton className="mt-1 h-8 w-20" />
          ) : (
            <p className={cn("text-3xl font-semibold tabular-nums tracking-tight transition-opacity", dim && "opacity-50")}>{formatCount(value)}</p>
          )}
          <p className="mt-0.5 text-[11px] text-ink-faint">{hint}</p>
        </div>
      </div>
    </Card>
  );
}

export function OverviewCards({ projectId }: { projectId: string }) {
  const { filters, refreshKey } = useAnalyticsFilters();
  const overview = useAsync((signal) => getOverview(projectId, filters, signal), [projectId, filters, refreshKey]);

  if (overview.error && !overview.data) {
    return (
      <div className="mb-5">
        <ErrorState compact error={overview.error} title="Unable to load overview" description="Totals could not be loaded." onRetry={overview.reload} />
      </div>
    );
  }

  const data = overview.data ?? undefined;
  return (
    <div className="mb-5 grid gap-4 sm:grid-cols-3">
      <Stat highlight label="Unique users" hint="Different people who sent events" value={data?.users} icon={<Users className="h-5 w-5" />} dim={overview.loading} />
      <Stat label="Total events" hint="All events in this period" value={data?.totalEvents} icon={<Activity className="h-5 w-5" />} dim={overview.loading} />
      <Stat label="Sessions" hint="App opens in this period" value={data?.sessions} icon={<Layers className="h-5 w-5" />} dim={overview.loading} />
    </div>
  );
}
