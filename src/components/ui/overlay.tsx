"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { errorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  placement?: "center" | "right";
  /** When false, Escape / backdrop click do nothing (e.g. while deleting). */
  dismissible?: boolean;
  width?: string;
}

/** Accessible modal: focus trap, Escape to close, scroll lock, focus restore. */
export function Modal({ open, onClose, title, children, placement = "center", dismissible = true, width }: ModalProps) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const dismissRef = useRef(dismissible);
  dismissRef.current = dismissible;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = panel.current?.querySelector<HTMLElement>("[data-autofocus]") ?? panel.current;
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissRef.current) {
        e.stopPropagation();
        closeRef.current();
      }
      if (e.key === "Tab" && panel.current) {
        const nodes = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (nodes.length === 0) {
          e.preventDefault();
          return;
        }
        const firstEl = nodes[0];
        const lastEl = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  const right = placement === "right";
  return (
    <div className={cn("fixed inset-0 z-50 flex", right ? "justify-end" : "items-center justify-center p-4")}>
      <div className="absolute inset-0 bg-ink/40" onClick={() => dismissible && onClose()} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative flex flex-col bg-white shadow-2xl",
          right ? "h-full w-full animate-slideIn border-l border-line sm:max-w-xl" : cn("max-h-full w-full animate-pop rounded-xl border border-line", width ?? "max-w-md"),
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          <button onClick={onClose} disabled={!dismissible} aria-label="Close" className="rounded p-1 text-ink-faint hover:bg-black/5 hover:text-ink disabled:opacity-40">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  errorTitle: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

/** Confirmation dialog that blocks duplicate clicks and surfaces errors with a retry. */
export function ConfirmDialog({ open, title, children, confirmLabel, pendingLabel = "Deleting...", errorTitle, onConfirm, onClose }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (open) {
      setBusy(false);
      setError(null);
      inFlight.current = false;
    }
  }, [open]);

  async function run() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
      inFlight.current = false;
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title} dismissible={!busy}>
      <div className="space-y-3 text-sm text-ink-soft">{children}</div>
      {error && (
        <div role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm">
          <p className="font-medium text-red-700">{errorTitle}</p>
          <p className="text-red-600">{error}</p>
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button data-autofocus onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="danger" loading={busy} onClick={() => void run()}>
          {busy ? pendingLabel : error ? "Try Again" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
