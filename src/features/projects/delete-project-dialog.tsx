"use client";
import { ConfirmDialog } from "@/components/ui/overlay";
import { deleteProject } from "@/lib/api/projects";
import type { DeleteProjectResponse, Project } from "@/types";

export function DeleteProjectDialog({ project, onClose, onDeleted }: { project: Project | null; onClose: () => void; onDeleted: (res: DeleteProjectResponse) => void }) {
  return (
    <ConfirmDialog
      open={!!project}
      title="Delete project?"
      confirmLabel="Delete Project"
      errorTitle="Unable to delete project"
      onClose={onClose}
      onConfirm={async () => {
        if (!project) return;
        const res = await deleteProject(project.id);
        onDeleted(res);
      }}
    >
      <p>
        Are you sure you want to delete <strong className="text-ink">&ldquo;{project?.name}&rdquo;</strong>?
      </p>
      <p className="font-medium text-ink">This action is permanent.</p>
      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">All API logs associated with this project will also be permanently deleted.</p>
    </ConfirmDialog>
  );
}
