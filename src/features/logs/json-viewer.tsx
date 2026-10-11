"use client";
import { useMemo, type ReactNode } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { formatValue } from "@/lib/utils/json";

const TOKEN = /("(?:\\.|[^"\\])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
const MAX_HIGHLIGHT = 200_000;

function highlight(src: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(src))) {
    if (m.index > last) out.push(src.slice(last, m.index));
    const t = m[0];
    let cls = "text-amber-700";
    if (t.startsWith('"')) cls = m[2] ? "text-sky-700" : "text-emerald-700";
    else if (t === "true" || t === "false") cls = "text-violet-700";
    else if (t === "null") cls = "text-ink-faint";
    out.push(
      <span key={i++} className={cls}>
        {t}
      </span>,
    );
    last = m.index + t.length;
  }
  out.push(src.slice(last));
  return out;
}

/** Monospace, scrollable viewer with copy. Parses JSON strings and pretty-prints; otherwise shows plain text. */
export function JsonViewer({ label, value, emptyText = "No data" }: { label: string; value: unknown; emptyText?: string }) {
  const formatted = useMemo(() => formatValue(value), [value]);
  const content = useMemo(
    () => (formatted && formatted.isJson && formatted.text.length < MAX_HIGHLIGHT ? highlight(formatted.text) : formatted?.text),
    [formatted],
  );

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <h4 className="text-xs font-medium text-ink-soft">{label}</h4>
        {formatted && <CopyButton text={formatted.text} variant="ghost" />}
      </div>
      {formatted ? (
        <pre className="max-h-96 overflow-auto whitespace-pre rounded-md border border-line bg-canvas p-3 font-mono text-xs leading-relaxed" tabIndex={0} aria-label={label}>
          {content}
        </pre>
      ) : (
        <p className="rounded-md border border-dashed border-line px-3 py-2.5 text-xs text-ink-faint">{emptyText}</p>
      )}
    </div>
  );
}
