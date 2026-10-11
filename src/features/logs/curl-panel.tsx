"use client";
import { useMemo } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { Modal } from "@/components/ui/overlay";
import { buildCurl } from "@/lib/utils/curl";
import type { ApiRequestLog } from "@/types";

/** Right-side drawer showing the cURL for the original app request. Reused by the list and the detail page. */
export function CurlPanel({ log, onClose }: { log: ApiRequestLog | null; onClose: () => void }) {
  const curl = useMemo(() => (log ? buildCurl(log) : ""), [log]);
  return (
    <Modal open={!!log} onClose={onClose} title="cURL" placement="right">
      {log && (
        <div className="space-y-3">
          <p className="break-all text-xs text-ink-soft">
            <span className="font-mono font-semibold">{log.method}</span> {log.url}
          </p>
          <pre className="max-h-[60vh] overflow-auto whitespace-pre rounded-md border border-line bg-canvas p-3 font-mono text-xs leading-relaxed" tabIndex={0} aria-label="cURL command">
            {curl}
          </pre>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-ink-faint">Generated from the original app request. Your dashboard token is never included.</p>
            <CopyButton text={curl} label="Copy cURL" size="md" variant="primary" />
          </div>
        </div>
      )}
    </Modal>
  );
}
