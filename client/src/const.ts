export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Stub login URL - will show "coming soon" toast instead of redirecting.
 * Replace with real auth provider URL when backend is added.
 */
export const getLoginUrl = () => {
  return "#login-coming-soon";
};
