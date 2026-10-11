import { API_BASE_URL } from "@/lib/config";
import { clearSession, readSession, UNAUTHORIZED_EVENT } from "@/lib/session";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  /** Attach the dashboard JWT. Set false for login/signup. */
  auth?: boolean;
  signal?: AbortSignal;
}

function extractMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const p = payload as { message?: unknown; error?: unknown };
    const m = p.message ?? p.error;
    if (typeof m === "string" && m) return m;
    if (Array.isArray(m) && m.length) return m.map(String).join(", ");
  }
  return fallback;
}

const DEFAULT_MESSAGES: Record<number, string> = {
  400: "The request was invalid. Check the details and try again.",
  401: "Your session is not valid.",
  403: "You don't have permission to do this.",
  404: "The requested resource was not found.",
  500: "The server ran into an error. Try again in a moment.",
};

export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, signal } = opts;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const session = readSession();
    if (session) headers.Authorization = `Bearer ${session.accessToken}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(0, "Network error. Check your connection and try again.");
  }

  const text = await res.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && auth) {
      clearSession();
      if (typeof window !== "undefined") window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    const fallback = DEFAULT_MESSAGES[res.status] ?? (res.status >= 500 ? DEFAULT_MESSAGES[500] : "Something went wrong.");
    throw new ApiError(res.status, extractMessage(payload, fallback));
  }

  return payload as T;
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  return new ApiError(0, err instanceof Error ? err.message : "Something went wrong.");
}

export function errorMessage(err: unknown): string {
  return toApiError(err).message;
}
