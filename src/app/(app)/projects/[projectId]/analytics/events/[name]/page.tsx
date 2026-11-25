"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/feedback";
import { EventProperties } from "@/features/analytics/event-properties";
import { EventRows } from "@/features/analytics/event-rows";
import { FilterBar } from "@/features/analytics/filter-bar";
import { safeDecode } from "@/lib/utils/url";

export default function EventDetailPage() {
  const { projectId, name: rawName } = useParams<{ projectId: string; name: string }>();
  const name = safeDecode(rawName);

  return (
    <>
      <Link href={`/projects/${projectId}/analytics`} className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to analytics
      </Link>
      <PageHeader title={<span className="font-mono text-lg">{name}</span>} subtitle="Property values and recent occurrences of this event." />
      <FilterBar />
      <EventProperties projectId={projectId} name={name} />
      <EventRows projectId={projectId} name={name} />
    </>
  );
}
