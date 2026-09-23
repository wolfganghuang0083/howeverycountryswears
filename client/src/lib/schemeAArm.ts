import {
  resolveLandingArm,
  type LandingArm,
  DEFAULT_LANDING_ARM,
} from "@shared/schemeAConfig";

/** Client: ?arm= overrides VITE_HECS_LANDING_ARM; default node_traffic. */
export function getClientLandingArm(search?: string): LandingArm {
  const s =
    search ??
    (typeof window !== "undefined" ? window.location.search : "");
  const envArm =
    typeof import.meta !== "undefined"
      ? (import.meta.env?.VITE_HECS_LANDING_ARM as string | undefined)
      : undefined;
  return resolveLandingArm({ search: s, envArm: envArm ?? null }) || DEFAULT_LANDING_ARM;
}
