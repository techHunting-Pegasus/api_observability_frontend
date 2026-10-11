"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as authApi from "@/lib/api/auth";
import { clearSession, readSession, UNAUTHORIZED_EVENT, writeSession } from "@/lib/session";
import { useToast } from "@/components/ui/toast";
import type { AuthResponse, User } from "@/types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const [state, setState] = useState<{ user: User | null; token: string | null; ready: boolean }>({ user: null, token: null, ready: false });

  // Restore persisted session on first load (survives refresh).
  useEffect(() => {
    const s = readSession();
    setState({ user: s?.user ?? null, token: s?.accessToken ?? null, ready: true });
  }, []);

  // Any authenticated 401 → client already cleared storage; reset state and go to /login.
  useEffect(() => {
    const onUnauthorized = () => {
      setState({ user: null, token: null, ready: true });
      toast.error("Your session expired. Please sign in again.");
      router.replace("/login");
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [router, toast]);

  const accept = useCallback((res: AuthResponse) => {
    writeSession({ accessToken: res.accessToken, user: res.user });
    setState({ user: res.user, token: res.accessToken, ready: true });
  }, []);

  const login = useCallback(async (email: string, password: string) => accept(await authApi.login(email, password)), [accept]);
  const signup = useCallback(
    async (email: string, password: string, confirmPassword: string) => accept(await authApi.signup(email, password, confirmPassword)),
    [accept],
  );
  const logout = useCallback(() => {
    clearSession();
    setState({ user: null, token: null, ready: true });
    router.replace("/login");
  }, [router]);

  const value = useMemo(() => ({ ...state, login, signup, logout }), [state, login, signup, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
