import type {
  AnalyticsFilters,
  AnalyticsInterval,
  AnalyticsOrder,
  AnalyticsOverview,
  AnalyticsSort,
  CountryStat,
  DebugDevice,
  DebugEvent,
  DeviceStat,
  EventPropertiesResponse,
  EventRowsResponse,
  EventSummary,
  PlatformStat,
  TimelinePoint,
} from "@/types";
import { apiRequest } from "./client";
import { buildQuery } from "./query";

export interface SortParams {
  sort?: AnalyticsSort;
  order?: AnalyticsOrder;
}

const base = (projectId: string) => `/api/v1/analytics/projects/${encodeURIComponent(projectId)}`;
const filterQuery = (f: AnalyticsFilters) => ({ from: f.from, to: f.to, platform: f.platform });

export function getOverview(projectId: string, filters: AnalyticsFilters, signal?: AbortSignal) {
  return apiRequest<AnalyticsOverview>(`${base(projectId)}/overview${buildQuery(filterQuery(filters))}`, { signal });
}

export function getTimeline(projectId: string, filters: AnalyticsFilters, interval: AnalyticsInterval, signal?: AbortSignal) {
  return apiRequest<TimelinePoint[]>(`${base(projectId)}/timeline${buildQuery({ ...filterQuery(filters), interval })}`, { signal });
}

export function getPlatforms(projectId: string, filters: AnalyticsFilters, signal?: AbortSignal) {
  return apiRequest<PlatformStat[]>(`${base(projectId)}/platforms${buildQuery(filterQuery(filters))}`, { signal });
}

export function getCountries(projectId: string, filters: AnalyticsFilters, sort: SortParams, signal?: AbortSignal) {
  return apiRequest<CountryStat[]>(`${base(projectId)}/countries${buildQuery({ ...filterQuery(filters), ...sort })}`, { signal });
}

export function getDevices(projectId: string, filters: AnalyticsFilters, sort: SortParams, signal?: AbortSignal) {
  return apiRequest<DeviceStat[]>(`${base(projectId)}/devices${buildQuery({ ...filterQuery(filters), ...sort })}`, { signal });
}

export function getEvents(projectId: string, filters: AnalyticsFilters, sort: SortParams, signal?: AbortSignal) {
  return apiRequest<EventSummary[]>(`${base(projectId)}/events${buildQuery({ ...filterQuery(filters), ...sort })}`, { signal });
}

const eventPath = (projectId: string, name: string) => `${base(projectId)}/events/${encodeURIComponent(name)}`;

export function getEventProperties(projectId: string, name: string, filters: AnalyticsFilters, signal?: AbortSignal) {
  return apiRequest<EventPropertiesResponse>(`${eventPath(projectId, name)}${buildQuery(filterQuery(filters))}`, { signal });
}

export function getEventRows(
  projectId: string,
  name: string,
  filters: AnalyticsFilters,
  page: { limit?: number; cursor?: number | null },
  signal?: AbortSignal,
) {
  const query = buildQuery({ ...filterQuery(filters), limit: page.limit, cursor: page.cursor });
  return apiRequest<EventRowsResponse>(`${eventPath(projectId, name)}/rows${query}`, { signal });
}

/* ───────────── Debug view ─────────────
 * The debug endpoints are not fully specified yet, so responses are read defensively:
 * either a plain array or an object holding the array, with a few common field names. */

type Raw = Record<string, unknown>;

const isRecord = (v: unknown): v is Raw => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === "string" && v ? v : typeof v === "number" ? String(v) : null);

function toList(payload: unknown, keys: string[]): Raw[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (isRecord(payload)) {
    for (const key of keys) {
      const value = payload[key];
      if (Array.isArray(value)) return value.filter(isRecord);
    }
  }
  return [];
}

function toProperties(value: unknown): Record<string, unknown> {
  if (isRecord(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      if (isRecord(parsed)) return parsed;
    } catch {
      /* not JSON */
    }
  }
  return {};
}

function toDevice(raw: Raw): DebugDevice | null {
  const id = str(raw.debugDeviceId) ?? str(raw.deviceId) ?? str(raw.id);
  if (!id) return null;
  return {
    id,
    name: str(raw.name) ?? str(raw.deviceName) ?? str(raw.deviceModel) ?? id,
    lastSeenAt: str(raw.lastSeenAt) ?? str(raw.lastEventAt) ?? str(raw.lastSeen),
  };
}

function toDebugEvent(raw: Raw): DebugEvent | null {
  const seq = Number(raw.seq);
  if (!Number.isFinite(seq)) return null;
  return {
    seq,
    eventId: str(raw.eventId) ?? String(seq),
    name: str(raw.name) ?? "(unnamed)",
    properties: toProperties(raw.properties),
    time: str(raw.eventTime) ?? str(raw.timestamp) ?? str(raw.createdAt) ?? new Date().toISOString(),
    platform: str(raw.platform),
    country: str(raw.country),
    deviceModel: str(raw.deviceModel),
    appVersion: str(raw.appVersion),
  };
}

export async function getDebugDevices(projectId: string, signal?: AbortSignal): Promise<DebugDevice[]> {
  const payload = await apiRequest<unknown>(`${base(projectId)}/debug/devices`, { signal });
  return toList(payload, ["devices", "data"]).map(toDevice).filter((d): d is DebugDevice => d !== null);
}

/** Newest first. Pass `after` (the last seq you have) to get only newer events. */
export async function getDebugEvents(projectId: string, device: string, after?: number | null, signal?: AbortSignal): Promise<DebugEvent[]> {
  const payload = await apiRequest<unknown>(`${base(projectId)}/debug/events${buildQuery({ device, after })}`, { signal });
  return toList(payload, ["events", "rows", "data"])
    .map(toDebugEvent)
    .filter((e): e is DebugEvent => e !== null)
    .sort((a, b) => b.seq - a.seq);
}

export function clearDebugEvents(projectId: string, device: string) {
  return apiRequest<unknown>(`${base(projectId)}/debug/events${buildQuery({ device })}`, { method: "DELETE" });
}
