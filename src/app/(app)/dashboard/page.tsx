"use client";
import { useState } from "react";
import { FolderPlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { useAsync } from "@/hooks/use-async";
import { getProjects } from "@/lib/api/projects";
import { CreateProjectDialog } from "@/features/projects/create-project-dialog";
import { DeleteProjectDialog } from "@/features/projects/delete-project-dialog";
import { ProjectTable, ProjectTableSkeleton } from "@/features/projects/project-table";
import type { Project } from "@/types";

export default function DashboardPage() {
  const toast = useToast();
  const { data, setData, error, loading, reload } = useAsync((signal) => getProjects(signal), []);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Project | null>(null);

  const createButton = (
    <Button variant="primary" onClick={() => setCreating(true)}>
      <Plus className="h-4 w-4" /> Create Project
    </Button>
  );

  return (
    <>
      <PageHeader title="Projects" subtitle="Each project maps to one app and collects its API request logs." actions={data && data.length > 0 ? createButton : undefined} />

      {loading ? (
        <ProjectTableSkeleton />
      ) : error ? (
        <ErrorState error={error} title="Unable to load projects" description="Something went wrong while loading your projects." onRetry={reload} />
      ) : data && data.length === 0 ? (
        <EmptyState
          icon={<FolderPlus className="h-5 w-5" />}
          title="No projects yet"
          description="Create your first project to start monitoring API requests and application issues."
          action={
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> Create Project
            </Button>
          }
        />
      ) : (
        <ProjectTable projects={data ?? []} onDelete={setToDelete} />
      )}

      <CreateProjectDialog open={creating} onClose={() => setCreating(false)} onCreated={(p) => setData((cur) => [p, ...(cur ?? [])])} />
      <DeleteProjectDialog
        project={toDelete}
        onClose={() => setToDelete(null)}
        onDeleted={(res) => {
          setData((cur) => (cur ?? []).filter((p) => p.id !== res.projectId));
          setToDelete(null);
          toast.success(`Project "${res.projectName}" deleted successfully.`);
        }}
      />
    </>
  );
}
