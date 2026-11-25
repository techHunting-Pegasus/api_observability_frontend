"use client";
import { useEffect, useRef } from "react";

/**
 * Runs `task` every `intervalMs` while `enabled`. The next run starts only after the previous one
 * finishes (no overlap), is skipped while the tab is hidden, and stops on unmount.
 * `task` should handle its own errors.
 */
export function usePolling(task: () => Promise<void>, intervalMs: number, enabled: boolean) {
  const latest = useRef(task);
  latest.current = task;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      if (cancelled) return;
      if (!document.hidden) {
        try {
          await latest.current();
        } catch {
          /* the task reports its own errors */
        }
      }
      if (!cancelled) timer = setTimeout(tick, intervalMs);
    };

    timer = setTimeout(tick, intervalMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, intervalMs]);
}
