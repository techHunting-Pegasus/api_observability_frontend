export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  accessToken: string;
}

export interface Project {
  id: string;
  name: string;
  bundleId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  bundleId: string;
}

export interface CreateProjectResponse {
  success: boolean;
  project: {
    id: string;
    name: string;
    bundleId: string;
    createdAt: string;
  };
  apiKey: string;
}

export interface DeleteProjectResponse {
  success: boolean;
  message: string;
  projectId: string;
  projectName: string;
}

export interface DeleteLogResponse {
  success: boolean;
  message: string;
  requestId: string;
}

export interface ApiRequestLog {
  id: string;
  appUserId: string | null;
  appUserEmail: string | null;
  logintype: string | null;
  deviceId: string | null;
  projectId: string;
  requestId: string;
  url: string;
  method: string;
  requestHeaders: Record<string, unknown> | null;
  requestBody: string | null;
  responseStatus: number | null;
  responseHeaders: Record<string, unknown> | null;
  responseBody: string | null;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
  durationMs: number;
  appVersion: string;
  iosVersion: string;
  deviceModel: string;
  networkType: string | null;
  timezone: string;
  country: string | null;
  clientIp: string | null;
  createdAt: string;
  bundleId: string;
}
