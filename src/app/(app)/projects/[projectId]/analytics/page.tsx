"use client";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/feedback";
import { CountriesCard, DevicesCard, PlatformsCard } from "@/features/analytics/breakdowns";
import { EventsCard } from "@/features/analytics/events-card";
import { FilterBar } from "@/features/analytics/filter-bar";
import { OverviewCards } from "@/features/analytics/overview-cards";
import { TimelineCard } from "@/features/analytics/timeline-card";

export default function ProjectAnalyticsPage() {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <>
      <PageHeader title="Analytics" subtitle="Events sent by your app's SDK. Debug events are not counted here." />
      <FilterBar />
      <OverviewCards projectId={projectId} />
      <TimelineCard projectId={projectId} />
      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <PlatformsCard />
        <CountriesCard projectId={projectId} />
        <DevicesCard projectId={projectId} />
      </div>
      <EventsCard projectId={projectId} />
    </>
  );
}
