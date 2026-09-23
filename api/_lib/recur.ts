import crypto from "crypto";
import {
  RECUR_PRODUCTS,
  UNLOCK_ID_EN_SPHERE,
  resolveEnSphereProductId,
  isEnSphereProduct,
} from "../../shared/schemeAConfig.js";
import { getUserByOpenId, insertPackUnlock } from "./db.js";

export const RECUR_UNLOCK_EVENTS = new Set([
  "checkout.completed",
  "order.paid",
  "subscription.activated",
  "invoice.paid",
]);

export function parseWebhookSecrets(raw: string | null | undefined): string[] {
  return String(raw || "").split(",").map((s) => s.trim()).filter(Boolean);
}

/** HMAC-SHA256 Base64; multi-secret comma-separated; constant-time; run all secrets (no early return). */
export function verifyRecurSignatureIndex(
  payload: string | Buffer,
  signature: string | null | undefined,
  secret: string,
): number {
  if (!signature) return -1;
  const secrets = parseWebhookSecrets(secret);
  if (!secrets.length) return -1;
  let hit = -1;
  for (let i = 0; i < secrets.length; i++) {
    const expected = crypto.createHmac("sha256", secrets[i]).update(payload).digest("base64");
    try {
      if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) && hit < 0) hit = i;
    } catch {
      /* length mismatch */
    }
  }
  return hit;
}

export function verifyRecurSignature(
  payload: string | Buffer,
  signature: string | null | undefined,
  secret: string,
): boolean {
  return verifyRecurSignatureIndex(payload, signature, secret) >= 0;
}

export function extractExternalId(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, any>;
  const cands = [
    d.customer?.externalCustomerId, d.customer?.externalId, d.customer?.external_id,
    d.externalCustomerId, d.external_customer_id,
    d.externalId, d.external_id,
    d.subscription?.customer?.externalCustomerId, d.subscription?.customer?.externalId,
    d.metadata?.openId, d.metadata?.externalId, d.metadata?.external_customer_id,
    d.customer?.metadata?.externalId,
  ];
  for (const c of cands) if (typeof c === "string" && c.trim()) return c.trim();
  return null;
}

export function extractRecurMeta(eventType: string, data: unknown) {
  const d = (data && typeof data === "object") ? (data as Record<string, any>) : {};
  const str = (v: unknown): string | null =>
    typeof v === "string" && v.trim() ? v.trim() : null;
  const customerId =
    str(d.customer?.id) || str(d.subscription?.customer?.id) || str(d.customerId) || str(d.customer_id) ||
    (typeof d.customer === "string" ? str(d.customer) : null);
  const productId = str(d.productId) || str(d.product_id) || str(d.product?.id) || str(d.plan?.id);
  const productSlug = str(d.product?.slug) || str(d.productSlug) || str(d.product_slug);
  const transactionId =
    str(d.transactionId) || str(d.transaction_id) || str(d.orderId) || str(d.order_id) ||
    str(d.checkoutSessionId) || str(d.checkout_session_id) || str(d.id);
  const amount = typeof d.amount === "number" ? d.amount : (typeof d.total === "number" ? d.total : null);
  const currency = str(d.currency);
  void eventType;
  return { customerId, productId, productSlug, transactionId, amount, currency };
}

export type RecurEventOutcome =
  | "duplicate"
  | "unlocked"
  | "ignored"
  | "unmatched"
  | "wrong_product"
  | "db_unavailable";

export async function handleRecurUnlockEvent(event: {
  id: string;
  type: string;
  data?: unknown;
}): Promise<RecurEventOutcome> {
  const eventId = String(event.id);
  const eventType = String(event.type);

  if (!RECUR_UNLOCK_EVENTS.has(eventType)) {
    return "ignored";
  }

  const meta = extractRecurMeta(eventType, event.data);
  const resolvedId = resolveEnSphereProductId(process.env.RECUR_PRODUCT_ID_EN_SPHERE);
  const unlockFromMeta =
    typeof (event.data as any)?.metadata?.unlock_id === "string"
      ? String((event.data as any).metadata.unlock_id)
      : null;

  const isOurProduct =
    isEnSphereProduct(meta.productId, meta.productSlug, resolvedId) ||
    unlockFromMeta === UNLOCK_ID_EN_SPHERE ||
    unlockFromMeta === RECUR_PRODUCTS.en_sphere.unlockId;

  if (!isOurProduct) {
    // Not HECS en_sphere — acknowledge but do not unlock
    return "wrong_product";
  }

  const externalId = extractExternalId(event.data);
  const user = externalId ? await getUserByOpenId(externalId) : undefined;
  if (!user) {
    console.error(`[recur] unmatched unlock event ${eventType} (${eventId}) externalId=${externalId || "(missing)"}`);
    return "unmatched";
  }

  const result = await insertPackUnlock({
    userId: user.id,
    unlockId: UNLOCK_ID_EN_SPHERE,
    recurEventId: eventId,
    transactionId: meta.transactionId,
    productId: meta.productId ?? resolvedId,
  });

  if (!result.ok) return "db_unavailable";
  if (result.duplicate) return "duplicate";
  return "unlocked";
}

export function recurMode(): "live" | "sandbox" {
  return process.env.RECUR_MODE === "live" ? "live" : "sandbox";
}

export function recurConfigured(): boolean {
  return !!(
    process.env.RECUR_SECRET_KEY &&
    process.env.RECUR_PUBLISHABLE_KEY &&
    process.env.RECUR_WEBHOOK_SECRET
  );
}

export function recurProductReady(): boolean {
  const id = resolveEnSphereProductId(process.env.RECUR_PRODUCT_ID_EN_SPHERE);
  return !!id && id !== "REPLACE_ME_HECS_EN_SPHERE";
}
