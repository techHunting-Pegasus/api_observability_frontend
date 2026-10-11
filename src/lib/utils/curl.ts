import type { ApiRequestLog } from "@/types";
import { formatValue } from "./json";

const q = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;

/**
 * Builds a cURL command for the ORIGINAL application request.
 * Only method, url, requestHeaders and requestBody are used — never the dashboard JWT.
 */
export function buildCurl(log: Pick<ApiRequestLog, "method" | "url" | "requestHeaders" | "requestBody">): string {
  const method = (log.method || "GET").toUpperCase();
  const parts: string[] = [`curl --location${method !== "GET" ? ` --request ${method}` : ""} ${q(log.url)}`];

  for (const [key, value] of Object.entries(log.requestHeaders ?? {})) {
    const v = typeof value === "string" ? value : JSON.stringify(value);
    parts.push(`--header ${q(`${key}: ${v}`)}`);
  }

  if (log.requestBody) {
    const body = formatValue(log.requestBody);
    parts.push(`--data-raw ${q(body?.isJson ? body.text : log.requestBody)}`);
  }

  return parts.join(" \\\n");
}
