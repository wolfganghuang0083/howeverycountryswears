import { useState, useEffect, useCallback } from "react";

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
          setState({
            user: data.user,
            loading: false,
            error: null,
            isAuthenticated: !!data.user,
          });
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
