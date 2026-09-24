import { useState, useEffect, useCallback } from "react";
import { trackLoginSuccess, trackSignUp, trackAudioUnlock } from "@/lib/analytics";

export interface AuthUser {
  id: number;
  openId: string;
  name: string | null;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: "user" | "admin";
  memberTier: "regular" | "bookBuyer";
  emailVerified?: boolean;
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
  if (user.openId.startsWith("google_")) return "google";
  if (user.openId.startsWith("email_")) return "email";
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
            const method = inferLoginMethod(user);
            trackLoginSuccess({ method });
            // sign_up: fire when returning from signup=* query (first verify)
            try {
              const q = new URLSearchParams(window.location.search);
              const s = q.get("signup");
              if (s === "google" || s === "email") {
                trackSignUp(s);
                trackAudioUnlock({
                  opt_in: false,
                  surface: "auth_callback",
                  cta_id: `signup_${s}`,
                });
                q.delete("signup");
                const clean = `${window.location.pathname}${q.toString() ? `?${q}` : ""}${window.location.hash}`;
                window.history.replaceState({}, "", clean);
              }
            } catch { /* ignore */ }
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
