"use client";
import type { KeyboardEvent, MouseEvent } from "react";
import { Terminal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/feedback";
import { cn } from "@/lib/utils/cn";
import { formatDateTime, formatDuration, getUserDisplay, relativeTime, splitUrl } from "@/lib/utils/format";
import type { ApiRequestLog } from "@/types";
import { MethodLabel, StatusBadge } from "./status-badge";

interface Props {
  logs: ApiRequestLog[];
  onOpen: (log: ApiRequestLog) => void;
  onCurl: (log: ApiRequestLog) => void;
  onDelete: (log: ApiRequestLog) => void;
}

const stop = (e: MouseEvent | KeyboardEvent) => e.stopPropagation();

export function LogTable({ logs, onOpen, onCurl, onDelete }: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-white">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="border-b border-line bg-canvas/60 text-xs text-ink-soft">
          <tr>
            {["Status", "Method", "URL", "User", "Response Time", "Date / Time", "Request ID", "Actions"].map((h) => (
              <th key={h} className={cn("px-3 py-2.5 font-medium", h === "Actions" && "text-right")}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {logs.map((log) => {
            const user = getUserDisplay(log);
            const { host, path } = splitUrl(log.url);
            return (
              <tr
                key={log.requestId}
                tabIndex={0}
                onClick={() => onOpen(log)}
                onKeyDown={(e) => {
                  if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onOpen(log);
                  }
                }}
                aria-label={`${log.method} ${path}, status ${log.responseStatus ?? "error"}. Open details`}
                className="cursor-pointer hover:bg-canvas/70 focus-visible:bg-canvas/70"
              >
                <td className="px-3 py-2.5">
                  <StatusBadge status={log.responseStatus} />
                </td>
                <td className="px-3 py-2.5">
                  <MethodLabel method={log.method} />
                </td>
                <td className="max-w-[300px] px-3 py-2.5">
                  <p className="truncate font-mono text-xs" title={log.url}>
                    {path}
                  </p>
                  {host && <p className="truncate text-xs text-ink-faint">{host}</p>}
                </td>
                <td className="max-w-[200px] px-3 py-2.5">
                  <p className={cn("truncate", user.isGuest && "text-ink-faint")} title={user.primary}>
                    {user.primary}
                  </p>
                  {user.secondary && <p className="truncate text-xs text-ink-faint">{user.secondary}</p>}
                </td>
                <td className={cn("whitespace-nowrap px-3 py-2.5 tabular-nums", log.durationMs >= 1000 ? "text-amber-700" : "text-ink-soft")}>{formatDuration(log.durationMs)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-ink-soft" title={formatDateTime(log.createdAt)}>
                  {relativeTime(log.createdAt)}
                </td>
                <td className="px-3 py-2.5">
                  <span className="block max-w-[120px] truncate font-mono text-xs text-ink-faint" title={log.requestId}>
                    {log.requestId}
                  </span>
                </td>
                <td className="px-3 py-2.5" onClick={stop} onKeyDown={stop}>
                  <div className="flex justify-end gap-1.5">
                    <Button size="sm" onClick={(e) => { stop(e); onCurl(log); }} aria-label={`Show cURL for ${log.requestId}`}>
                      <Terminal className="h-3.5 w-3.5" /> cURL
                    </Button>
                    <Button size="sm" onClick={(e) => { stop(e); onDelete(log); }} aria-label={`Delete log ${log.requestId}`} className="text-red-600 hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function LogTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white" aria-busy="true" aria-label="Loading logs">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-5 border-b border-line px-3 py-3.5 last:border-0">
          <Skeleton className="h-5 w-11" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-52" />
          <Skeleton className="hidden h-4 w-32 md:block" />
          <Skeleton className="hidden h-4 w-12 md:block" />
          <Skeleton className="ml-auto h-7 w-28" />
        </div>
      ))}
    </div>
  );
}
