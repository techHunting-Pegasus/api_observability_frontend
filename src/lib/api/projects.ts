import type { CreateProjectInput, CreateProjectResponse, DeleteProjectResponse, Project } from "@/types";
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
