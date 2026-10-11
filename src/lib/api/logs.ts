import type { ApiRequestLog, DeleteLogResponse } from "@/types";
import { apiRequest } from "./client";

const base = (projectId: string) => `/api/v1/monitoring/projects/${encodeURIComponent(projectId)}/logs`;

export function getProjectLogs(projectId: string, signal?: AbortSignal) {
  return apiRequest<ApiRequestLog[]>(base(projectId), { signal });
}

export function getProjectLog(projectId: string, requestId: string, signal?: AbortSignal) {
  return apiRequest<ApiRequestLog>(`${base(projectId)}/${encodeURIComponent(requestId)}`, { signal });
}

export function deleteProjectLog(projectId: string, requestId: string) {
  return apiRequest<DeleteLogResponse>(`${base(projectId)}/${encodeURIComponent(requestId)}`, { method: "DELETE" });
}
