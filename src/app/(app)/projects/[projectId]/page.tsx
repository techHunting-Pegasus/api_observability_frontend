"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, RefreshCw, ScrollText, SearchX, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { useAsync } from "@/hooks/use-async";
import { useDebounced } from "@/hooks/use-debounced";
import { getProjectLogs } from "@/lib/api/logs";
import { getProjects } from "@/lib/api/projects";
import { CurlPanel } from "@/features/logs/curl-panel";
import { DeleteLogDialog } from "@/features/logs/delete-log-dialog";
import { filterAndSort, LogFilters, type SearchField, type SortOrder } from "@/features/logs/log-filters";
import { LogTable, LogTableSkeleton } from "@/features/logs/log-table";
import { DeleteProjectDialog } from "@/features/projects/delete-project-dialog";
import type { ApiRequestLog } from "@/types";

export default function ProjectLogsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const toast = useToast();

  const projects = useAsync((s) => getProjects(s), []);
  const logs = useAsync((s) => getProjectLogs(projectId, s), [projectId]);
  const project = projects.data?.find((p) => p.id === projectId) ?? null;

  const [field, setField] = useState<SearchField>("requestId");
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<SortOrder>("newest");
  const debounced = useDebounced(query, 250);

  const [curlLog, setCurlLog] = useState<ApiRequestLog | null>(null);
  const [deleteLog, setDeleteLog] = useState<ApiRequestLog | null>(null);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);

  const visible = useMemo(() => filterAndSort(logs.data ?? [], field, debounced, order), [logs.data, field, debounced, order]);

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1 text-xs text-ink-soft">
        <Link href="/dashboard" className="hover:text-ink hover:underline">
          Projects
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-ink">{project?.name ?? "Project"}</span>
      </nav>

      <PageHeader
        title={project?.name ?? "API Logs"}
        subtitle={
          <span>
            {project && <span className="font-mono text-xs">{project.bundleId}</span>}
            {project && logs.data && " · "}
            {logs.data && `${visible.length} of ${logs.data.length} logs`}
          </span>
        }
        actions={
          <>
            <Button onClick={logs.reload} disabled={logs.loading}>
              <RefreshCw className={logs.loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} /> Refresh
            </Button>
            <Button variant="danger" onClick={() => setDeleteProjectOpen(true)} disabled={!project}>
              <Trash2 className="h-3.5 w-3.5" /> Delete Project
            </Button>
          </>
        }
      />

      {logs.loading ? (
        <LogTableSkeleton />
      ) : logs.error ? (
        <ErrorState error={logs.error} title="Unable to load logs" description="Something went wrong while loading this project's logs." onRetry={logs.reload} />
      ) : logs.data && logs.data.length === 0 ? (
        <EmptyState icon={<ScrollText className="h-5 w-5" />} title="No logs yet" description="Requests captured by the SDK in your app will show up here." />
      ) : (
        <>
          <LogFilters field={field} query={query} order={order} onField={setField} onQuery={setQuery} onOrder={setOrder} />
          {visible.length === 0 ? (
            <EmptyState icon={<SearchX className="h-5 w-5" />} title="No matching logs" description="No loaded logs match your search. Try a different value or search field." />
          ) : (
            <LogTable logs={visible} onOpen={(l) => router.push(`/projects/${projectId}/logs/${encodeURIComponent(l.requestId)}`)} onCurl={setCurlLog} onDelete={setDeleteLog} />
          )}
        </>
      )}

      <CurlPanel log={curlLog} onClose={() => setCurlLog(null)} />

      <DeleteLogDialog
        log={deleteLog}
        onClose={() => setDeleteLog(null)}
        onDeleted={(res) => {
          logs.setData((cur) => (cur ?? []).filter((l) => l.requestId !== res.requestId));
          setDeleteLog(null);
          toast.success(res.message || "Log deleted successfully");
        }}
      />

      <DeleteProjectDialog
        project={deleteProjectOpen ? project : null}
        onClose={() => setDeleteProjectOpen(false)}
        onDeleted={(res) => {
          toast.success(`Project "${res.projectName}" deleted successfully.`);
          router.replace("/dashboard");
        }}
      />
    </>
  );
}
