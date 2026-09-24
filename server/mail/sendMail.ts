/**
 * Mail abstraction — Resend provider.
 * Hard gates: MAIL_SEND_ENABLED===true AND VERCEL_ENV===production AND RESEND_API_KEY set.
 * Otherwise: log (masked) + return rendered preview; NEVER send.
 */

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  tag?: string;
  from?: string;
};

export type SendMailResult = {
  sent: boolean;
  skippedReason?: string;
  providerId?: string;
  /** Rendered HTML for Preview UI (non-prod / dry-run). */
  previewHtml?: string;
  previewText?: string;
  previewSubject?: string;
};

function maskEmail(email: string): string {
  const [u, d] = email.split("@");
  if (!d) return "***";
  const user = u.length <= 2 ? "*" : u[0] + "***" + u[u.length - 1];
  return `${user}@${d}`;
}

export function canSendMail(): { ok: boolean; reason?: string } {
  if (process.env.MAIL_SEND_ENABLED !== "true") {
    return { ok: false, reason: "MAIL_SEND_ENABLED!=true" };
  }
  if (process.env.VERCEL_ENV !== "production") {
    return { ok: false, reason: `VERCEL_ENV=${process.env.VERCEL_ENV || "unset"}` };
  }
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, reason: "RESEND_API_KEY missing" };
  }
  return { ok: true };
}

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const gate = canSendMail();
  const from =
    input.from ||
    process.env.MAIL_FROM ||
    "HECS <noreply@howeverycountryswears.com>";

  if (!gate.ok) {
    console.log(
      `[mail] SKIP send tag=${input.tag || "-"} to=${maskEmail(input.to)} reason=${gate.reason} subject=${JSON.stringify(input.subject)}`,
    );
    return {
      sent: false,
      skippedReason: gate.reason,
      previewHtml: input.html,
      previewText: input.text,
      previewSubject: input.subject,
    };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      tags: input.tag ? [{ name: "campaign", value: input.tag }] : undefined,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[mail] Resend error status=${res.status} body=${body.slice(0, 200)}`);
    return {
      sent: false,
      skippedReason: `resend_http_${res.status}`,
      previewHtml: input.html,
      previewText: input.text,
      previewSubject: input.subject,
    };
  }

  const data = (await res.json()) as { id?: string };
  console.log(`[mail] SENT tag=${input.tag || "-"} to=${maskEmail(input.to)} id=${data.id || "?"}`);
  return { sent: true, providerId: data.id };
}
