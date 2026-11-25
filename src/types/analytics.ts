export type AnalyticsInterval = "day" | "hour";
export type AnalyticsSort = "count" | "name";
export type AnalyticsOrder = "asc" | "desc";

/** Filters accepted by every analytics report. */
export interface AnalyticsFilters {
  from?: string;
  to?: string;
  platform?: string;
}

export interface AnalyticsOverview {
  totalEvents: number;
  users: number;
  sessions: number;
}

export interface TimelinePoint {
  time: string;
  count: number;
}

export interface PlatformStat {
  platform: string;
  count: number;
}

export interface CountryStat {
  country: string;
  count: number;
}

export interface DeviceStat {
  deviceModel: string;
  count: number;
}

export type EventType = "default" | "screen" | "custom";

export interface EventSummary {
  name: string;
  type: EventType;
  count: number;
  lastSeenAt: string;
}

export interface PropertyValueCount {
  value: unknown;
  count: number;
}

export interface EventProperty {
  key: string;
  count: number;
  topValues: PropertyValueCount[];
}

export interface EventPropertiesResponse {
  name: string;
  sampledEvents: number;
  properties: EventProperty[];
}

export interface EventRow {
  seq: number;
  eventId: string;
  name: string;
  properties: Record<string, unknown> | null;
  eventTime: string;
  country: string | null;
  deviceModel: string | null;
  platform: string | null;
}

export interface EventRowsResponse {
  rows: EventRow[];
  nextCursor: number | null;
}

export interface DebugDevice {
  id: string;
  name: string;
  lastSeenAt: string | null;
}

export interface DebugEvent {
  seq: number;
  eventId: string;
  name: string;
  properties: Record<string, unknown>;
  time: string;
  platform: string | null;
  country: string | null;
  deviceModel: string | null;
  appVersion: string | null;
}
