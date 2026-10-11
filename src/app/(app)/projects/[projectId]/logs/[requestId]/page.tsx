"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Terminal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState, Skeleton } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { useAsync } from "@/hooks/use-async";
import { getProjectLog } from "@/lib/api/logs";
import { CurlPanel } from "@/features/logs/curl-panel";
import { DeleteLogDialog } from "@/features/logs/delete-log-dialog";
import { JsonViewer } from "@/features/logs/json-viewer";
import { MethodLabel, StatusBadge } from "@/features/logs/status-badge";
import { formatDateTime, formatDuration } from "@/lib/utils/format";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white">
      <h2 className="border-b border-line px-4 py-2.5 text-sm font-semibold">{title}</h2>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}

function Row({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 text-sm">
      <dt className="text-ink-soft">{label}</dt>
      <dd className={`min-w-0 break-words ${mono ? "font-mono text-xs" : ""} ${empty ? "text-ink-faint" : ""}`}>{empty ? "—" : value}</dd>
    </div>
  );
}

export default function LogDetailPage() {
  const { projectId, requestId: rawId } = useParams<{ projectId: string; requestId: string }>();
  const requestId = decodeURIComponent(rawId);
  const router = useRouter();
  const toast = useToast();
  const { data: log, error, loading, reload } = useAsync((s) => getProjectLog(projectId, requestId, s), [projectId, requestId]);
  const [curlOpen, setCurlOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const back = (
    <Link href={`/projects/${projectId}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
      <ArrowLeft className="h-4 w-4" /> Back to Logs
    </Link>
  );

  if (loading) {
    return (
      <>
        {back}
        <div aria-busy="true" aria-label="Loading log">
          <Skeleton className="mb-3 h-7 w-2/3" />
          <Skeleton className="mb-6 h-5 w-40" />
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-56" />
            ))}
          </div>
        </div>
      </>
    );
  }

  if (error || !log) {
    return (
      <>
        {back}
        <ErrorState
          error={error ?? { name: "ApiError", message: "Log not found", status: 404 }}
          title={error?.status === 404 ? "Log not found" : "Unable to load log"}
          description={error?.status === 404 ? "This log doesn't exist or was already deleted." : "Something went wrong while loading this log."}
          onRetry={reload}
        />
      </>
    );
  }

  const userId = log.appUserId?.trim() || null;
  const email = log.appUserEmail?.trim() || null;

  return (
    <>
      {back}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 break-all text-lg font-semibold tracking-tight">
            <MethodLabel method={log.method} /> <span className="font-mono text-base">{log.url}</span>
          </h1>
          <div className="mt-2 flex items-center gap-2.5 text-sm text-ink-soft">
            <StatusBadge status={log.responseStatus} />
            <span className="tabular-nums">{formatDuration(log.durationMs)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCurlOpen(true)}>
            <Terminal className="h-3.5 w-3.5" /> Copy cURL
          </Button>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Delete Log
          </Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Request">
          <dl className="space-y-2.5">
            <Row label="URL" value={log.url} mono />
            <Row label="Method" value={log.method} />
            <Row label="Request ID" value={log.requestId} mono />
            <Row label="Started At" value={formatDateTime(log.startedAt)} />
          </dl>
          <JsonViewer label="Request Headers" value={log.requestHeaders} emptyText="No request headers" />
          <JsonViewer label="Request Body" value={log.requestBody} emptyText="No request body" />
        </Section>

        <Section title="Response">
          <dl className="space-y-2.5">
            <Row label="Status Code" value={log.responseStatus !== null ? <StatusBadge status={log.responseStatus} /> : null} />
            <Row label="Duration" value={formatDuration(log.durationMs)} />
            <Row label="Completed At" value={formatDateTime(log.completedAt)} />
          </dl>
          <JsonViewer label="Response Headers" value={log.responseHeaders} emptyText="No response headers" />
          <JsonViewer label="Response Body" value={log.responseBody} emptyText="No response body" />
        </Section>

        <Section title="User">
          <dl className="space-y-2.5">
            <Row label="User ID" value={userId} mono />
            <Row label="Email" value={email} />
            <Row label="Login Type" value={log.logintype} />
            <Row label="Device ID" value={log.deviceId} mono />
          </dl>
          {!userId && !email && <p className="text-xs text-ink-faint">This request was made by a guest.</p>}
        </Section>

        <Section title="Device / App">
          <dl className="space-y-2.5">
            <Row label="App Version" value={log.appVersion} />
            <Row label="iOS Version" value={log.iosVersion} />
            <Row label="Device Model" value={log.deviceModel} />
            <Row label="Network Type" value={log.networkType} />
            <Row label="Country" value={log.country} />
            <Row label="Timezone" value={log.timezone} />
            <Row label="Client IP" value={log.clientIp} mono />
          </dl>
        </Section>

        {log.error !== null && log.error !== "" && (
          <div className="lg:col-span-2">
            <section className="rounded-lg border border-red-200 bg-red-50/40">
              <h2 className="border-b border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700">Error</h2>
              <div className="p-4">
                <JsonViewer label="Error details" value={log.error} />
              </div>
            </section>
          </div>
        )}
      </div>

      <CurlPanel log={curlOpen ? log : null} onClose={() => setCurlOpen(false)} />
      <DeleteLogDialog
        log={deleteOpen ? log : null}
        onClose={() => setDeleteOpen(false)}
        onDeleted={(res) => {
          toast.success(res.message || "Log deleted successfully");
          router.replace(`/projects/${projectId}`);
        }}
      />
    </>
  );
}
