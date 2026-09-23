/**
 * Recur webhook — HECS-only path `/api/recur/webhook`.
 * Raw body required for HMAC-SHA256 Base64 signature (x-recur-signature).
 * Return 200 for handled/ignored; 500 only when DB unavailable (Recur should retry).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  parseWebhookSecrets,
  verifyRecurSignatureIndex,
  handleRecurUnlockEvent,
} from "../_lib/recur.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body, "utf8");
  // Stream when bodyParser is disabled
  const chunks: Buffer[] = [];
  for await (const chunk of req as AsyncIterable<Buffer | string>) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  if (chunks.length) return Buffer.concat(chunks);
  // Fallback if Vercel already parsed (should not happen with bodyParser:false)
  if (req.body && typeof req.body === "object") {
    return Buffer.from(JSON.stringify(req.body), "utf8");
  }
  return Buffer.alloc(0);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  const secret = process.env.RECUR_WEBHOOK_SECRET;
  if (!secret) {
    res.status(503).json({ error: "recur webhook not configured" });
    return;
  }

  let raw: Buffer;
  try {
    raw = await readRawBody(req);
  } catch (e) {
    console.error("[recur] failed to read raw body:", e);
    res.status(400).json({ error: "invalid body" });
    return;
  }

  const payload = raw.toString("utf8");
  const sigHeader = req.headers["x-recur-signature"];
  const signature = typeof sigHeader === "string" ? sigHeader : null;
  const hit = verifyRecurSignatureIndex(payload, signature, secret);
  if (hit < 0) {
    console.error(
      `[recur] signature failed: ${parseWebhookSecrets(secret).length} secret(s) configured; sig length ${String(signature || "").length}`,
    );
    res.status(401).json({ error: "invalid signature" });
    return;
  }
  if (hit > 0) {
    console.warn(`[recur] signature matched secret #${hit + 1} (not primary) — finish key rotation`);
  }

  let event: { id?: string; type?: string; data?: unknown } | null = null;
  try {
    event = JSON.parse(payload);
  } catch {
    event = null;
  }
  if (!event?.id || !event?.type) {
    res.status(400).json({ error: "invalid event payload" });
    return;
  }

  try {
    const outcome = await handleRecurUnlockEvent({
      id: String(event.id),
      type: String(event.type),
      data: event.data,
    });
    if (outcome === "db_unavailable") {
      res.status(500).json({ error: "temporary storage unavailable, please retry" });
      return;
    }
    res.status(200).json({ ok: true, outcome });
  } catch (e) {
    console.error("[recur] webhook handle failed:", e);
    // Non-retryable app errors: 200 to avoid infinite Recur retries
    res.status(200).json({ ok: false, error: "handled_with_error" });
  }
}
