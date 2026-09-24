/**
 * PLACEHOLDER email templates — Wolfgang copy TBD.
 * Swap copy here only; keep {{links}} construction in callers.
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

/** Unchecked opt-in: service “You’re unlocked” + weekly subscribe footer (no book/ads). */
export function renderUnlockedEmail(opts: {
  origin: string;
  optInUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = "[PLACEHOLDER] You're unlocked — hear every phrase";
  const html = wrapHtml(
    subject,
    `
    <h1 style="font-size:1.35rem;margin:0 0 0.75rem">You're unlocked</h1>
    <p><!-- PLACEHOLDER_GREETING -->Hi — welcome to HECS. Your email unlocked pronunciations on the site. No account needed.</p>
    <p><!-- PLACEHOLDER_EXPLORE -->Explore a few popular country pages:</p>
    ${countryListHtml(opts.origin)}
    <p style="margin-top:1.5rem;font-size:0.9rem;color:#555">
      Want the weekly cultural swear note?
      <a href="${opts.optInUrl}" style="color:#FF1493;font-weight:700">Subscribe to the weekly</a>
    </p>
  `,
  );
  const text = [
    "PLACEHOLDER TEMPLATE — You're unlocked",
    "",
    "Hi — welcome to HECS. Your email unlocked pronunciations on the site.",
    "",
    "Explore popular country pages:",
    countryListText(opts.origin),
    "",
    `Subscribe to the weekly: ${opts.optInUrl}`,
  ].join("\n");
  return { subject, html, text };
}

/** Checked opt-in: welcome + DOI confirm link embedded (one combined email). */
export function renderOptInWelcomeEmail(opts: {
  origin: string;
  confirmUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = "[PLACEHOLDER] Confirm your HECS weekly + you're unlocked";
  const html = wrapHtml(
    subject,
    `
    <h1 style="font-size:1.35rem;margin:0 0 0.75rem">You're in — confirm the weekly</h1>
    <p><!-- PLACEHOLDER_GREETING -->Hi — pronunciations are unlocked on the site right now.</p>
    <p><!-- PLACEHOLDER_CONFIRM -->Please confirm you want <strong>Swear Word of the Week</strong> by email (one country, one phrase, a short cultural note):</p>
    <p style="margin:1.25rem 0">
      <a href="${opts.confirmUrl}" style="display:inline-block;background:#FF1493;color:#fff;font-weight:700;padding:0.65rem 1.1rem;border-radius:8px;text-decoration:none;border:2px solid #1a1a1a">Confirm my email</a>
    </p>
    <p><!-- PLACEHOLDER_EXPLORE -->While you're here, try a country page:</p>
    ${countryListHtml(opts.origin)}
    <p style="font-size:0.8rem;color:#888">If you didn't ask for this, you can ignore this message.</p>
  `,
  );
  const text = [
    "PLACEHOLDER TEMPLATE — Confirm weekly + unlocked",
    "",
    "Pronunciations are unlocked on the site.",
    "",
    `Confirm weekly email: ${opts.confirmUrl}`,
    "",
    "Explore:",
    countryListText(opts.origin),
  ].join("\n");
  return { subject, html, text };
}
