"use client";
import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/feedback";
import { getEventRows } from "@/lib/api/analytics";
import { toApiError, type ApiError } from "@/lib/api/client";
import { JsonViewer } from "@/features/logs/json-viewer";
import { countryName, formatDateTimeSeconds, platformLabel } from "@/lib/utils/format";
import type { EventRow } from "@/types";
import { displayValue } from "./event-properties";
import { useAnalyticsFilters } from "./filters-context";

const PAGE = 50;

function preview(properties: EventRow["properties"]): string {
  const entries = Object.entries(properties ?? {});
  if (entries.length === 0) return "No properties";
  return entries.slice(0, 3).map(([k, v]) => `${k}: ${displayValue(v)}`).join(" · ") + (entries.length > 3 ? ` · +${entries.length - 3}` : "");
}

/** Newest-first list of the individual events, loaded page by page with the backend cursor. */
export function EventRows({ projectId, name }: { projectId: string; name: string }) {
  const { filters, refreshKey } = useAnalyticsFilters();
  const [rows, setRows] = useState<EventRow[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [initial, setInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [retry, setRetry] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setInitial(true);
    setError(null);
    setOpenId(null);
    getEventRows(projectId, name, filters, { limit: PAGE }, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setRows(res.rows);
        setCursor(res.nextCursor);
        setInitial(false);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(toApiError(e));
        setInitial(false);
      });
    return () => controller.abort();
  }, [projectId, name, filters, refreshKey, retry]);

  async function loadMore() {
    if (cursor === null) return;
    setLoadingMore(true);
    setError(null);
    try {
      const res = await getEventRows(projectId, name, filters, { limit: PAGE, cursor });
      setRows((current) => [...current, ...res.rows]);
      setCursor(res.nextCursor);
    } catch (e) {
      setError(toApiError(e));
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <Card title="Recent events" subtitle="Newest first. Click a row to see all properties." bodyClassName="p-0">
      {initial ? (
        <div className="space-y-2 p-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : error && rows.length === 0 ? (
        <div className="p-4">
          <ErrorState compact error={error} title="Unable to load events" description="The event rows could not be loaded." onRetry={() => setRetry((n) => n + 1)} />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-4">
          <EmptyState title="No events in this period" description="Try a longer date range or another platform." />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-line bg-canvas/60 text-xs text-ink-soft">
                <tr>
                  <th className="w-8 px-2 py-2.5" aria-label="Expand" />
                  <th className="px-3 py-2.5 font-medium">Time</th>
                  <th className="px-3 py-2.5 font-medium">Platform</th>
                  <th className="px-3 py-2.5 font-medium">Country</th>
                  <th className="px-3 py-2.5 font-medium">Device</th>
                  <th className="px-3 py-2.5 font-medium">Properties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row) => {
                  const open = openId === row.eventId;
                  return (
                    <Fragment key={row.eventId}>
                      <tr className="cursor-pointer hover:bg-canvas/50" onClick={() => setOpenId(open ? null : row.eventId)}>
                        <td className="px-2 py-2.5 text-ink-faint">
                          <button
                            type="button"
                            aria-expanded={open}
                            aria-label={open ? "Hide properties" : "Show properties"}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenId(open ? null : row.eventId);
                            }}
                            className="rounded p-0.5 hover:text-ink"
                          >
                            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-ink-soft">{formatDateTimeSeconds(row.eventTime)}</td>
                        <td className="px-3 py-2.5">{row.platform ? platformLabel(row.platform) : "—"}</td>
                        <td className="px-3 py-2.5">{row.country ? countryName(row.country) : "—"}</td>
                        <td className="px-3 py-2.5 font-mono text-xs">{row.deviceModel ?? "—"}</td>
                        <td className="max-w-[320px] truncate px-3 py-2.5 font-mono text-xs text-ink-soft" title={preview(row.properties)}>
                          {preview(row.properties)}
                        </td>
                      </tr>
                      {open && (
                        <tr className="bg-canvas/40">
                          <td />
                          <td colSpan={5} className="px-3 py-3">
                            <JsonViewer label="Properties" value={row.properties} emptyText="No properties" />
                            <p className="mt-2 font-mono text-[11px] text-ink-faint">Event ID: {row.eventId}</p>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {error && (
            <p role="alert" className="border-t border-line px-4 py-2 text-xs text-red-600">
              {error.message}
            </p>
          )}
          {cursor !== null && (
            <div className="border-t border-line p-3 text-center">
              <Button onClick={() => void loadMore()} loading={loadingMore}>
                {loadingMore ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
