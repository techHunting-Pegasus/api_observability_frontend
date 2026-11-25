"use client";
import { useEffect, useRef, useState } from "react";
import { Bug, Eraser, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/feedback";
import { Select } from "@/components/ui/form";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { useAsync } from "@/hooks/use-async";
import { usePolling } from "@/hooks/use-polling";
import { clearDebugEvents, getDebugDevices, getDebugEvents } from "@/lib/api/analytics";
import { toApiError, type ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import { formatCount, relativeTime } from "@/lib/utils/format";
import type { DebugEvent } from "@/types";
import { DebugEventRow } from "./debug-event-row";

const POLL_MS = 1500;
const DEVICE_POLL_MS = 10_000;
/** Keep the feed light: older events fall off the bottom. */
const MAX_EVENTS = 500;

type Load = "idle" | "loading" | "ready" | "error";

function LiveBadge({ state }: { state: "live" | "paused" | "retrying" }) {
  const styles = { live: "bg-emerald-500", paused: "bg-zinc-400", retrying: "bg-amber-500" }[state];
  const text = { live: "Live", paused: "Paused", retrying: "Reconnecting..." }[state];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft" aria-live="polite">
      <span className={cn("h-2 w-2 rounded-full", styles, state !== "paused" && "animate-pulse")} /> {text}
    </span>
  );
}

export function DebugView({ projectId }: { projectId: string }) {
  const toast = useToast();
  const devices = useAsync((signal) => getDebugDevices(projectId, signal), [projectId]);
  const [deviceId, setDeviceId] = useState("");
  const [paused, setPaused] = useState(false);
  const [events, setEvents] = useState<DebugEvent[]>([]);
  const [fresh, setFresh] = useState<Set<number>>(() => new Set());
  const [load, setLoad] = useState<Load>("idle");
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [clearOpen, setClearOpen] = useState(false);

  const lastSeq = useRef<number | null>(null);
  const activeDevice = useRef("");
  activeDevice.current = deviceId;

  // Pick the first device automatically; keep the choice if it later drops off the list.
  useEffect(() => {
    if (!deviceId && devices.data && devices.data.length > 0) setDeviceId(devices.data[0].id);
  }, [devices.data, deviceId]);

  // The device list changes as new phones start debugging.
  usePolling(async () => devices.reload(), DEVICE_POLL_MS, true);

  // First load: the latest events of the chosen device.
  useEffect(() => {
    setEvents([]);
    setFresh(new Set());
    setReconnecting(false);
    setLoadError(null);
    lastSeq.current = null;
    if (!deviceId) {
      setLoad("idle");
      return;
    }
    const controller = new AbortController();
    setLoad("loading");
    getDebugEvents(projectId, deviceId, undefined, controller.signal)
      .then((list) => {
        if (controller.signal.aborted) return;
        lastSeq.current = list.length ? list[0].seq : null;
        setEvents(list);
        setLoad("ready");
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(toApiError(e));
        setLoad("error");
      });
    return () => controller.abort();
  }, [projectId, deviceId, reloadKey]);

  // After that: ask only for events newer than the last one we have.
  usePolling(
    async () => {
      const device = deviceId;
      try {
        const list = await getDebugEvents(projectId, device, lastSeq.current);
        if (activeDevice.current !== device) return;
        setReconnecting(false);
        const newer = list.filter((e) => lastSeq.current === null || e.seq > lastSeq.current);
        if (newer.length === 0) return;
        lastSeq.current = newer[0].seq;
        setEvents((current) => [...newer, ...current].slice(0, MAX_EVENTS));
        const ids = new Set(newer.map((e) => e.seq));
        setFresh(ids);
        setTimeout(() => setFresh((current) => (current === ids ? new Set() : current)), 1600);
      } catch {
        if (activeDevice.current === device) setReconnecting(true);
      }
    },
    POLL_MS,
    load === "ready" && !paused && !!deviceId,
  );

  async function handleClear() {
    await clearDebugEvents(projectId, deviceId);
    setEvents([]);
    setFresh(new Set());
    setClearOpen(false);
    toast.success("Debug events cleared.");
  }

  const deviceList = devices.data ?? [];
  const known = deviceList.some((d) => d.id === deviceId);

  if (devices.error && !devices.data) {
    return <ErrorState error={devices.error} title="Unable to load debug devices" description="The list of debug devices could not be loaded." onRetry={devices.reload} />;
  }

  if (!devices.data) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (deviceList.length === 0 && !deviceId) {
    return (
      <EmptyState
        icon={<Bug className="h-5 w-5" />}
        title="No debug devices yet"
        description="Send events from your app with debug: true and a debugDevice. Devices that sent debug events in the last 30 minutes appear here automatically."
      />
    );
  }

  return (
    <>
      <Card bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <Select aria-label="Debug device" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} className="w-auto min-w-[220px]">
            {!known && deviceId && <option value={deviceId}>{deviceId}</option>}
            {deviceList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
                {d.lastSeenAt ? ` · ${relativeTime(d.lastSeenAt)}` : ""}
              </option>
            ))}
          </Select>
          {load === "ready" && <LiveBadge state={paused ? "paused" : reconnecting ? "retrying" : "live"} />}
          <span className="text-xs text-ink-faint">{formatCount(events.length)} events</span>
          <div className="ml-auto flex gap-2">
            <Button onClick={() => setPaused((v) => !v)} disabled={load !== "ready"}>
              {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />} {paused ? "Resume" : "Pause"}
            </Button>
            <Button onClick={() => setClearOpen(true)} disabled={load !== "ready" || events.length === 0} className="text-red-600 hover:bg-red-50">
              <Eraser className="h-3.5 w-3.5" /> Clear
            </Button>
          </div>
        </div>

        {load === "loading" ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : load === "error" && loadError ? (
          <div className="p-4">
            <ErrorState compact error={loadError} title="Unable to load debug events" description="Events for this device could not be loaded." onRetry={() => setReloadKey((n) => n + 1)} />
          </div>
        ) : events.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto mb-3 block h-3 w-3 animate-pulse rounded-full bg-brand" />
            <p className="text-sm font-medium">Waiting for events...</p>
            <p className="mt-1 text-xs text-ink-soft">Use the app on this device. New events show up here within a couple of seconds.</p>
          </div>
        ) : (
          <ul className="max-h-[70vh] divide-y divide-line overflow-y-auto">
            {events.map((event) => (
              <DebugEventRow key={event.seq} event={event} fresh={fresh.has(event.seq)} />
            ))}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        open={clearOpen}
        title="Clear debug events?"
        confirmLabel="Clear events"
        pendingLabel="Clearing..."
        errorTitle="Unable to clear events"
        onClose={() => setClearOpen(false)}
        onConfirm={handleClear}
      >
        <p>This removes the debug events of this device from the server. They are not counted in analytics, so reports are not affected.</p>
      </ConfirmDialog>
    </>
  );
}
