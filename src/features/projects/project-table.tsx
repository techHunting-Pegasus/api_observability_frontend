import Link from "next/link";
import { ArrowUpRight, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/feedback";
import { formatDate } from "@/lib/utils/format";
import type { Project } from "@/types";

export function ProjectTable({ projects, onDelete }: { projects: Project[]; onDelete: (p: Project) => void }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-white">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="border-b border-line bg-canvas/60 text-xs text-ink-soft">
          <tr>
            <th className="px-4 py-2.5 font-medium">Project</th>
            <th className="px-4 py-2.5 font-medium">Bundle ID</th>
            <th className="px-4 py-2.5 font-medium">Created</th>
            <th className="px-4 py-2.5 font-medium">Updated</th>
            <th className="px-4 py-2.5 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {projects.map((p) => (
            <tr key={p.id} className="hover:bg-canvas/50">
              <td className="px-4 py-3 font-medium">
                <Link href={`/projects/${p.id}`} className="hover:text-brand hover:underline">
                  {p.name}
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-ink-soft">{p.bundleId}</td>
              <td className="px-4 py-3 text-ink-soft">{formatDate(p.createdAt)}</td>
              <td className="px-4 py-3 text-ink-soft">{formatDate(p.updatedAt)}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Link href={`/projects/${p.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line-strong bg-white px-2.5 text-xs font-medium hover:bg-canvas">
                    Open <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href={`/projects/${p.id}/settings`}
                    aria-label={`Settings for ${p.name}`}
                    title="Project settings"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line-strong bg-white hover:bg-canvas"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </Link>
                  <Button size="sm" onClick={() => onDelete(p)} aria-label={`Delete project ${p.name}`} className="text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProjectTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white" aria-busy="true" aria-label="Loading projects">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-6 border-b border-line px-4 py-4 last:border-0">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="hidden h-4 w-24 sm:block" />
          <Skeleton className="ml-auto h-8 w-28" />
        </div>
      ))}
    </div>
  );
}
