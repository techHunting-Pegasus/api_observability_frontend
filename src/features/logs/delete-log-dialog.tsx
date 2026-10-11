"use client";
import { ConfirmDialog } from "@/components/ui/overlay";
import { deleteProjectLog } from "@/lib/api/logs";
import type { ApiRequestLog, DeleteLogResponse } from "@/types";

export function DeleteLogDialog({ log, onClose, onDeleted }: { log: Pick<ApiRequestLog, "projectId" | "requestId"> | null; onClose: () => void; onDeleted: (res: DeleteLogResponse) => void }) {
  return (
    <ConfirmDialog
      open={!!log}
      title="Delete log?"
      confirmLabel="Delete Log"
      errorTitle="Unable to delete log"
      onClose={onClose}
      onConfirm={async () => {
        if (!log) return;
        onDeleted(await deleteProjectLog(log.projectId, log.requestId));
      }}
    >
      <p>Are you sure you want to permanently delete this API request log?</p>
      <div>
        <p className="mb-1 text-xs font-medium">Request ID</p>
        <code className="block break-all rounded-md border border-line bg-canvas px-2.5 py-2 font-mono text-xs text-ink">{log?.requestId}</code>
      </div>
      <p className="font-medium text-ink">This action cannot be undone.</p>
    </ConfirmDialog>
  );
}
