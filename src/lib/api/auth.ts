import type { AuthResponse } from "@/types";
import { apiRequest } from "./client";

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>("/api/v1/auth/login", { method: "POST", body: { email, password }, auth: false });
}

export function signup(email: string, password: string, confirmPassword: string) {
  return apiRequest<AuthResponse>("/api/v1/auth/signup", {
    method: "POST",
    body: { email, password, confirmPassword },
    auth: false,
  });
}
