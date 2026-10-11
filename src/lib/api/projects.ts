import type {
  AddProjectMemberResponse,
  CreateProjectInput,
  CreateProjectResponse,
  DeleteProjectResponse,
  GetProjectApiKeyResponse,
  Project,
  ProjectApiKeyResponse,
  ProjectMember,
  ProjectMemberActionResponse,
  ProjectRole,
  UpdateProjectMemberRoleResponse,
} from "@/types";
import { apiRequest } from "./client";

export function getProjects(signal?: AbortSignal) {
  return apiRequest<Project[]>("/api/v1/projects", { signal });
}

export function createProject(input: CreateProjectInput) {
  return apiRequest<CreateProjectResponse>("/api/v1/projects", { method: "POST", body: input });
}

export function deleteProject(projectId: string) {
  return apiRequest<DeleteProjectResponse>(`/api/v1/projects/${encodeURIComponent(projectId)}`, { method: "DELETE" });
}

const membersPath = (projectId: string) => `/api/v1/projects/${encodeURIComponent(projectId)}/members`;

export function getProjectMembers(projectId: string, signal?: AbortSignal) {
  return apiRequest<ProjectMember[]>(membersPath(projectId), { signal });
}

export function addProjectMember(projectId: string, email: string) {
  return apiRequest<AddProjectMemberResponse>(membersPath(projectId), { method: "POST", body: { email } });
}

export function removeProjectMember(projectId: string, memberId: string) {
  return apiRequest<ProjectMemberActionResponse>(`${membersPath(projectId)}/${encodeURIComponent(memberId)}`, { method: "DELETE" });
}

export function updateProjectMemberRole(projectId: string, userId: string, role: ProjectRole) {
  return apiRequest<UpdateProjectMemberRoleResponse>(`${membersPath(projectId)}/${encodeURIComponent(userId)}/role`, {
    method: "PATCH",
    body: { role },
  });
}

export function regenerateProjectApiKey(projectId: string) {
  return apiRequest<ProjectApiKeyResponse>(`/api/v1/projects/${encodeURIComponent(projectId)}/api-key/regenerate`, { method: "POST" });
}

export function getProjectApiKey(projectId: string) {
  return apiRequest<GetProjectApiKeyResponse>(`/api/v1/projects/${encodeURIComponent(projectId)}/api-key`);
}
