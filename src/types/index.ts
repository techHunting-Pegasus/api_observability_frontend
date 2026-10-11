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
  members?: Array<{ role: ProjectRole }>;
}

export type ProjectRole = "OWNER" | "APP_MANAGER";

export interface ProjectMember {
  id: string;
  userId: string;
  role: ProjectRole;
  createdAt: string;
  user: {
    id: string;
    email: string;
  };
}

export interface AddProjectMemberResponse {
  success: boolean;
  message: string;
  member: Omit<ProjectMember, "userId">;
}

export interface UpdateProjectMemberRoleResponse {
  success: boolean;
  message: string;
  newOwnerId?: string;
}

export interface ProjectApiKeyResponse {
  success: boolean;
  message: string;
  project: Pick<Project, "id" | "name" | "bundleId">;
  apiKey: string;
}

export interface GetProjectApiKeyResponse {
  success: boolean;
  project: Pick<Project, "id" | "name" | "bundleId">;
  apiKey: string;
}

export interface ProjectMemberActionResponse {
  success: boolean;
  message: string;
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
