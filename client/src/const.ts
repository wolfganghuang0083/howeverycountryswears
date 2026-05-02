export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Returns the login URL that redirects to GitHub OAuth via our API.
 * Encodes the current page path as returnTo so user returns after login.
 */
export const getLoginUrl = (returnTo?: string) => {
  const path = returnTo || window.location.pathname + window.location.search;
  return `/api/auth/login?returnTo=${encodeURIComponent(path)}`;
};
