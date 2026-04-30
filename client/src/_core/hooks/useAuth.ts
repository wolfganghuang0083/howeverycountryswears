/**
 * Stub useAuth hook for static deployment.
 * Always returns unauthenticated state.
 * Will be replaced with real auth when backend is added.
 */

export interface AuthUser {
  id: number;
  name: string | null;
  role: "user" | "admin";
  memberTier: "regular" | "bookBuyer";
  displayName: string | null;
  points: number;
}

export function useAuth() {
  return {
    user: null as AuthUser | null,
    loading: false,
    error: null,
    isAuthenticated: false,
    logout: () => {
      // No-op in static mode
    },
  };
}
