import type { ApiRequestLog } from "@/types";

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} day${d > 1 ? "s" : ""} ago`;
  return formatDate(iso);
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(ms < 10000 ? 2 : 1).replace(/\.?0+$/, "")}s`;
}

export function splitUrl(url: string): { host: string; path: string } {
  try {
    const u = new URL(url);
    return { host: u.host, path: `${u.pathname}${u.search}` || "/" };
  } catch {
    return { host: "", path: url };
  }
}

export interface UserDisplay {
  primary: string;
  secondary: string | null;
  isGuest: boolean;
}

/** Email → "email" + "ID: x"; ID only → "User: x"; neither → "Guest". Never prints null. */
export function getUserDisplay(log: Pick<ApiRequestLog, "appUserEmail" | "appUserId">): UserDisplay {
  const email = log.appUserEmail?.trim();
  const id = log.appUserId?.trim();
  if (email) return { primary: email, secondary: id ? `ID: ${id}` : null, isGuest: false };
  if (id) return { primary: `User: ${id}`, secondary: null, isGuest: false };
  return { primary: "Guest", secondary: null, isGuest: true };
}

export type StatusTone = "success" | "neutral" | "warning" | "error" | "critical";

export function statusTone(status: number | null): StatusTone {
  if (status === null || status === undefined) return "critical";
  if (status >= 500) return "critical";
  if (status >= 400) return "error";
  if (status >= 300) return "warning";
  if (status >= 200) return "success";
  return "neutral";
}

export function formatCount(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US");
}

/** 14:03:22.481 in local time, for the live debug feed. */
export function formatTimeMs(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const time = d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return `${time}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

export function formatDateTimeSeconds(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit" });
}

const PLATFORM_LABELS: Record<string, string> = { ios: "iOS", android: "Android", web: "Web", macos: "macOS" };

export function platformLabel(platform: string): string {
  const key = platform.toLowerCase();
  return PLATFORM_LABELS[key] ?? (platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : "Unknown");
}

/** "IN" → "India". Falls back to the raw value ("unknown", or codes the browser doesn't know). */
export function countryName(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return code === "unknown" ? "Unknown" : code;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}
