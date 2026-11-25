import type { ApiRequestLog } from "@/types";
import { safeDecode } from "./url";

export type SearchField = "all" | "url" | "requestId" | "appUserId" | "appUserEmail";

/** Higher = better match. 0 = no match. */
const SCORE = { exact: 100, lastSegment: 80, path: 60, other: 40, host: 30, query: 20 } as const;

interface UrlParts {
  host: string;
  path: string;
  lastSegment: string;
}

function splitParts(url: string): UrlParts {
  let host = "";
  let path = url;
  try {
    const u = new URL(url);
    host = u.host;
    path = u.pathname;
  } catch {
    /* not an absolute URL: treat the whole value as the path */
  }
  const decodedPath = safeDecode(path).toLowerCase();
  const lastSegment = decodedPath.split("/").filter(Boolean).pop() ?? "";
  return { host: host.toLowerCase(), path: decodedPath, lastSegment };
}

/** How well `q` (already lower-cased and trimmed) matches the URL. Checks the raw and the decoded URL. */
export function scoreUrl(url: string, q: string): number {
  const raw = url.toLowerCase();
  const decoded = safeDecode(url).toLowerCase();
  if (!raw.includes(q) && !decoded.includes(q)) return 0;
  if (raw === q || decoded === q) return SCORE.exact;

  const { host, path, lastSegment } = splitParts(url);
  if (lastSegment === q) return SCORE.exact;
  if (lastSegment.includes(q)) return SCORE.lastSegment;
  if (path.includes(q)) return SCORE.path;
  if (host.includes(q)) return SCORE.host;
  return SCORE.query; // query string, or text that spans several parts
}

function scoreText(value: string | null, q: string): number {
  const text = (value ?? "").toLowerCase();
  if (!text.includes(q)) return 0;
  return text === q ? SCORE.exact : SCORE.other;
}

function scoreLog(log: ApiRequestLog, field: SearchField, q: string): number {
  switch (field) {
    case "url":
      return scoreUrl(log.url, q);
    case "all":
      return Math.max(scoreUrl(log.url, q), scoreText(log.requestId, q), scoreText(log.appUserId, q), scoreText(log.appUserEmail, q));
    default:
      // Single ID/email fields keep a flat score, so they stay in date order like before.
      return scoreText(log[field], q) > 0 ? 1 : 0;
  }
}

/**
 * Filters logs by `query` in the chosen field, best matches first, then by date (`dir` -1 = newest first).
 * With an empty query every log is kept and only the date order applies.
 */
export function searchLogs(logs: ApiRequestLog[], field: SearchField, query: string, dir: 1 | -1): ApiRequestLog[] {
  const q = query.trim().toLowerCase();
  const byDate = (a: ApiRequestLog, b: ApiRequestLog) => dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  if (!q) return [...logs].sort(byDate);

  return logs
    .map((log) => ({ log, score: scoreLog(log, field, q) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || byDate(a.log, b.log))
    .map((item) => item.log);
}
