/**
 * PLACEHOLDER email templates — Wolfgang copy TBD.
 * Swap copy here only.
 */

export const POPULAR_COUNTRIES = [
  { slug: "tunisia", name: "Tunisia", flag: "🇹🇳" },
  { slug: "fiji", name: "Fiji", flag: "🇫🇯" },
  { slug: "uzbekistan", name: "Uzbekistan", flag: "🇺🇿" },
  { slug: "new-zealand", name: "New Zealand", flag: "🇳🇿" },
  { slug: "samoa", name: "Samoa", flag: "🇼🇸" },
  { slug: "afghanistan", name: "Afghanistan", flag: "🇦🇫" },
] as const;

function countryListHtml(origin: string): string {
  const items = POPULAR_COUNTRIES.map(
    (c) =>
      `<li style="margin:0.35rem 0"><a href="${origin}/country/${c.slug}" style="color:#FF1493;font-weight:600;text-decoration:none">${c.flag} ${c.name}</a></li>`,
  ).join("");
  return `<ul style="padding-left:1.2rem;margin:0.75rem 0">${items}</ul>`;
}

function countryListText(origin: string): string {
  return POPULAR_COUNTRIES.map((c) => `- ${c.name}: ${origin}/country/${c.slug}`).join("\n");
}

function wrapHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${title}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;line-height:1.5;color:#1a1a1a;max-width:32rem;margin:0 auto;padding:1.25rem">
  <p style="font-size:1.4rem;font-weight:800;color:#FF1493;margin:0 0 0.5rem">@#$%!</p>
  <p style="font-size:0.7rem;letter-spacing:0.06em;text-transform:uppercase;color:#999;margin:0 0 1rem">PLACEHOLDER TEMPLATE — swap copy later</p>
  ${body}
  <hr style="border:none;border-top:1px solid #ddd;margin:1.5rem 0"/>
  <p style="font-size:0.75rem;color:#888">How Every Country Swears · recognition ≠ permission</p>
</body></html>`;
}

/** Magic-link signup: verification + welcome combined. */
export function renderMagicLinkWelcomeEmail(opts: {
  origin: string;
  magicUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = "[PLACEHOLDER] Verify your email — unlock pronunciations";
  const html = wrapHtml(
    subject,
    `
    <h1 style="font-size:1.35rem;margin:0 0 0.75rem">Verify &amp; unlock audio</h1>
    <p><!-- PLACEHOLDER -->Hi — click below to verify your email and unlock pronunciations on HECS. No password.</p>
    <p style="margin:1.25rem 0">
      <a href="${opts.magicUrl}" style="display:inline-block;background:#FF1493;color:#fff;font-weight:700;padding:0.65rem 1.1rem;border-radius:8px;text-decoration:none;border:2px solid #1a1a1a">Verify my email</a>
    </p>
    <p><!-- PLACEHOLDER -->After verifying, try a country page:</p>
    ${countryListHtml(opts.origin)}
    <p style="font-size:0.8rem;color:#888">Link expires in 30 minutes. If you didn't ask for this, ignore this message.</p>
  `,
  );
  const text = [
    "PLACEHOLDER — Verify & unlock audio",
    "",
    `Verify: ${opts.magicUrl}`,
    "",
    "Explore:",
    countryListText(opts.origin),
  ].join("\n");
  return { subject, html, text };
}

/** Post–Google signup welcome (email already verified). */
export function renderGoogleWelcomeEmail(opts: {
  origin: string;
  name?: string | null;
}): { subject: string; html: string; text: string } {
  const subject = "[PLACEHOLDER] Welcome — pronunciations unlocked";
  const greet = opts.name ? `Hi ${opts.name}` : "Hi";
  const html = wrapHtml(
    subject,
    `
    <h1 style="font-size:1.35rem;margin:0 0 0.75rem">You're in</h1>
    <p><!-- PLACEHOLDER -->${greet} — your Google account is verified. Pronunciations are unlocked on HECS.</p>
    <p><!-- PLACEHOLDER -->Explore a few popular country pages:</p>
    ${countryListHtml(opts.origin)}
  `,
  );
  const text = [
    "PLACEHOLDER — Welcome (Google)",
    "",
    `${greet} — pronunciations unlocked.`,
    "",
    countryListText(opts.origin),
  ].join("\n");
  return { subject, html, text };
}

/** @deprecated audio-unlock era — kept for reference until templates fully swapped */
export function renderUnlockedEmail(opts: {
  origin: string;
  optInUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = "[PLACEHOLDER][deprecated] You're unlocked";
  const html = wrapHtml(subject, `<p>Deprecated unlocked template. Opt-in: <a href="${opts.optInUrl}">subscribe</a></p>${countryListHtml(opts.origin)}`);
  return { subject, html, text: `Deprecated. ${opts.optInUrl}` };
}

/** @deprecated combined DOI — magic-link welcome replaces for email signup */
export function renderOptInWelcomeEmail(opts: {
  origin: string;
  confirmUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = "[PLACEHOLDER][deprecated] Confirm weekly";
  const html = wrapHtml(subject, `<p><a href="${opts.confirmUrl}">Confirm</a></p>${countryListHtml(opts.origin)}`);
  return { subject, html, text: opts.confirmUrl };
}
