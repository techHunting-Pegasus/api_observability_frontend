import { cn } from "@/lib/utils/cn";
import { statusTone, type StatusTone } from "@/lib/utils/format";

const tones: Record<StatusTone, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  neutral: "bg-zinc-100 text-zinc-700 border-zinc-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  error: "bg-red-50 text-red-700 border-red-200",
  critical: "bg-red-600 text-white border-red-700",
};

export function StatusBadge({ status, className }: { status: number | null; className?: string }) {
  const tone = statusTone(status);
  return (
    <span className={cn("inline-flex min-w-[2.75rem] items-center justify-center rounded border px-1.5 py-0.5 font-mono text-xs font-semibold tabular-nums", tones[tone], className)}>
      {status ?? "ERR"}
    </span>
  );
}

const methodColors: Record<string, string> = {
  GET: "text-sky-700",
  POST: "text-emerald-700",
  PUT: "text-amber-700",
  PATCH: "text-violet-700",
  DELETE: "text-red-700",
};

export function MethodLabel({ method }: { method: string }) {
  const m = (method || "").toUpperCase();
  return <span className={cn("font-mono text-xs font-semibold", methodColors[m] ?? "text-ink-soft")}>{m || "—"}</span>;
}
