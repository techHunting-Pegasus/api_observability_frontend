"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, RefreshCw, ScrollText, SearchX, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/feedback";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { useAsync } from "@/hooks/use-async";
import { useDebounced } from "@/hooks/use-debounced";
import { deleteProjectLogs, getProjectLogs } from "@/lib/api/logs";
import { errorMessage } from "@/lib/api/client";
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const visible = useMemo(() => filterAndSort(logs.data ?? [], field, debounced, order), [logs.data, field, debounced, order]);
  const selectedLogs = (logs.data ?? []).filter((log) => selectedIds.has(log.requestId));

  function toggleLogSelection(requestId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(requestId)) next.delete(requestId);
      else next.add(requestId);
      return next;
    });
  }

  function toggleVisibleSelection() {
    const allVisibleSelected = visible.length > 0 && visible.every((log) => selectedIds.has(log.requestId));
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const log of visible) {
        if (allVisibleSelected) next.delete(log.requestId);
        else next.add(log.requestId);
      }
      return next;
    });
  }

  async function deleteSelectedLogs() {
    const requestIds = selectedLogs.map((log) => log.requestId);
    if (requestIds.length === 0) return;

    const results = await deleteProjectLogs(projectId, requestIds);
    const deletedIds = new Set<string>();
    const failedIds: string[] = [];
    let firstError: unknown;

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        deletedIds.add(requestIds[index]);
      } else {
        failedIds.push(requestIds[index]);
        firstError ??= result.reason;
      }
    });

    if (deletedIds.size > 0) {
      logs.setData((current) => (current ?? []).filter((log) => !deletedIds.has(log.requestId)));
    }
    setSelectedIds(new Set(failedIds));

    if (failedIds.length > 0) {
      throw new Error(
        `${deletedIds.size} deleted; ${failedIds.length} could not be deleted. ${errorMessage(firstError)}`,
      );
    }

    setBulkDeleteOpen(false);
    toast.success(`${deletedIds.size} ${deletedIds.size === 1 ? "log" : "logs"} deleted successfully.`);
  }

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
            <Button onClick={() => router.push(`/projects/${projectId}/settings`)}>
              <Settings className="h-3.5 w-3.5" /> Settings
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
          {selectedLogs.length > 0 && (
            <div className="my-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 py-2.5">
              <p className="text-sm font-medium text-ink" aria-live="polite">
                {selectedLogs.length} {selectedLogs.length === 1 ? "log" : "logs"} selected
              </p>
              <div className="flex gap-2">
                <Button onClick={() => setSelectedIds(new Set())}>Cancel</Button>
                <Button variant="danger" onClick={() => setBulkDeleteOpen(true)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete selected
                </Button>
              </div>
            </div>
          )}
          {visible.length === 0 ? (
            <EmptyState icon={<SearchX className="h-5 w-5" />} title="No matching logs" description="No loaded logs match your search. Try a different value or search field." />
          ) : (
            <LogTable
              logs={visible}
              selectedIds={selectedIds}
              onOpen={(l) => router.push(`/projects/${projectId}/logs/${encodeURIComponent(l.requestId)}`)}
              onCurl={setCurlLog}
              onDelete={setDeleteLog}
              onToggleSelect={toggleLogSelection}
              onToggleAll={toggleVisibleSelection}
            />
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

      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Delete ${selectedLogs.length} ${selectedLogs.length === 1 ? "log" : "logs"}?`}
        confirmLabel="Delete selected"
        pendingLabel="Deleting logs..."
        errorTitle="Unable to delete all selected logs"
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={deleteSelectedLogs}
      >
        <p>Are you sure you want to permanently delete {selectedLogs.length} selected API request {selectedLogs.length === 1 ? "log" : "logs"}?</p>
        <p className="font-medium text-ink">This action cannot be undone.</p>
      </ConfirmDialog>

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
