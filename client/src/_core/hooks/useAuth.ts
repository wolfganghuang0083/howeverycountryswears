import { useState, useEffect, useCallback } from "react";
import { trackLoginSuccess } from "@/lib/analytics";

export interface AuthUser {
  id: number;
  openId: string;
  name: string | null;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: "user" | "admin";
  memberTier: "regular" | "bookBuyer";
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

function inferLoginMethod(user: AuthUser | null): string {
  if (!user?.openId) return "oauth";
  if (user.openId.startsWith("github_")) return "github";
  return "oauth";
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();
        if (!cancelled) {
          const user = data.user as AuthUser | null;
          setState({
            user,
            loading: false,
            error: null,
            isAuthenticated: !!user,
          });
          // Once per browser session when auth first resolves with a user
          if (user) {
            trackLoginSuccess({ method: inferLoginMethod(user) });
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setState({
            user: null,
            loading: false,
            error: err.message,
            isAuthenticated: false,
          });
        }
      }
    }

    fetchUser();
    return () => { cancelled = true; };
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      setState({ user: null, loading: false, error: null, isAuthenticated: false });
      window.location.href = "/";
    } catch (err: any) {
      console.error("Logout failed:", err);
    }
  }, []);

  return { ...state, logout };
}
