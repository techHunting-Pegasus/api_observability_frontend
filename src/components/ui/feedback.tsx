import type { ReactNode } from "react";
import { AlertTriangle, Inbox, WifiOff } from "lucide-react";
import type { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded bg-line", className)} />;
}

export function EmptyState({ title, description, action, icon }: { title: string; description: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line-strong bg-white px-6 py-16 text-center">
      <div className="mb-3 rounded-full bg-canvas p-3 text-ink-faint">{icon ?? <Inbox className="h-5 w-5" />}</div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-soft">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function hint(status: number): string {
  if (status === 0) return "Network error. Check your connection — the server may also be waking up.";
  if (status === 400) return "The request was rejected as invalid (400).";
  if (status === 401) return "Your session expired (401).";
  if (status === 403) return "You don't have access to this resource (403).";
  if (status === 404) return "This resource doesn't exist or was deleted (404).";
  if (status >= 500) return `The server failed to process this request (${status}). This is a backend problem, so retrying may not help.`;
  return `Request failed (${status}).`;
}

export function ErrorState({
  error,
  title,
  description,
  onRetry,
  retryLabel = "Retry",
  compact,
}: {
  error: ApiError;
  title: string;
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** Less padding, for use inside cards. */
  compact?: boolean;
}) {
  const Icon = error.status === 0 ? WifiOff : AlertTriangle;
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50/50 px-6 text-center", compact ? "py-8" : "py-14")}
    >
      <div className="mb-3 rounded-full bg-red-100 p-3 text-red-600">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-ink-soft">{description}</p>
      <p className="mt-2 max-w-md text-xs text-ink-faint">
        {hint(error.status)} {error.message}
      </p>
      {error.endpoint && (
        <p className="mt-2 max-w-full break-all rounded bg-white/70 px-2 py-1 font-mono text-[11px] text-ink-soft" title="Share this with the backend team">
          {error.endpoint}
        </p>
      )}
      {onRetry && (
        <Button className="mt-5" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <div className="mt-1 text-sm text-ink-soft">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
