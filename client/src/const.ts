export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Public pages: open signup modal instead of GitHub.
 * Admin GitHub OAuth only via getAdminLoginUrl.
 */
export const getLoginUrl = (returnTo?: string) => {
  const path = returnTo || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/");
  // Soft redirect: homepage with signin flag; country pages use SignupModal directly.
  return `/?signin=1&returnTo=${encodeURIComponent(path)}`;
};

/** Admin-only GitHub OAuth (newsletter CRM, etc.). */
export const getAdminLoginUrl = (returnTo?: string) => {
  const path = returnTo || "/admin/newsletter";
  return `/api/auth/github?returnTo=${encodeURIComponent(path)}`;
};
