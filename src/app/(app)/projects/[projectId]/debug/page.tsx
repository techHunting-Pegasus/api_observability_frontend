"use client";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/feedback";
import { DebugView } from "@/features/debug/debug-view";

export default function ProjectDebugPage() {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <>
      <PageHeader title="Debug view" subtitle="Live events from a test device. Newest events appear at the top." />
      <DebugView projectId={projectId} />
    </>
  );
}
