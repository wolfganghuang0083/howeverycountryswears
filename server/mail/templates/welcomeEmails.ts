/**
 * Welcome / verify email templates (final copy — Wolfgang / Albedo 2026-09-25).
 */

export const POPULAR_COUNTRIES = [
  { slug: "united-kingdom", name: "United Kingdom" },
  { slug: "united-states", name: "United States" },
  { slug: "australia", name: "Australia" },
  { slug: "germany", name: "Germany" },
  { slug: "netherlands", name: "Netherlands" },
  { slug: "spain", name: "Spain" },
] as const;

function countryListHtml(origin: string): string {
  const items = POPULAR_COUNTRIES.map(
    (c) =>
      `<li style="margin:0.35rem 0"><a href="${origin}/country/${c.slug}" style="color:#FF1493;font-weight:600;text-decoration:none">${c.name}</a></li>`,
  ).join("");
  return `<ul style="padding-left:1.2rem;margin:0.75rem 0">${items}</ul>`;
}

function countryListText(origin: string): string {
  return POPULAR_COUNTRIES.map((c) => `• ${c.name}: ${origin}/country/${c.slug}`).join("\n");
}

function wrapHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${title}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;line-height:1.5;color:#1a1a1a;max-width:32rem;margin:0 auto;padding:1.25rem">
  <p style="font-size:1.4rem;font-weight:800;color:#FF1493;margin:0 0 1rem">@#$%!</p>
  ${body}
  <hr style="border:none;border-top:1px solid #ddd;margin:1.5rem 0"/>
  <p style="font-size:0.85rem;color:#555;margin:0">HECS<br/>
  <a href="https://howeverycountryswears.com" style="color:#FF1493;text-decoration:none">howeverycountryswears.com</a></p>
</body></html>`;
}

/** Magic-link signup: verification + welcome combined. */
export function renderMagicLinkWelcomeEmail(opts: {
  origin: string;
  magicUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = "Unlock your pronunciations — one tap";
  const html = wrapHtml(
    subject,
    `
    <p>Hi —</p>
    <p>Thanks for joining How Every Country Swears.</p>
    <p>Tap below to verify your email and unlock pronunciations. No password.</p>
    <p style="margin:1.25rem 0">
      <a href="${opts.magicUrl}" style="display:inline-block;background:#FF1493;color:#fff;font-weight:700;padding:0.65rem 1.1rem;border-radius:8px;text-decoration:none;border:2px solid #1a1a1a">Verify &amp; unlock audio</a>
    </p>
    <p>After that, try a country page:</p>
    ${countryListHtml(opts.origin)}
    <p style="font-size:0.85rem;color:#666">If you didn’t ask for this, ignore this email. The link expires in about 30 minutes.</p>
    <p style="margin-top:1.25rem">— HECS<br/>
    <a href="https://howeverycountryswears.com" style="color:#FF1493;text-decoration:none">howeverycountryswears.com</a></p>
  `,
  );
  const text = [
    "Hi —",
    "",
    "Thanks for joining How Every Country Swears.",
    "",
    "Tap below to verify your email and unlock pronunciations. No password.",
    "",
    `Verify & unlock audio: ${opts.magicUrl}`,
    "",
    "After that, try a country page:",
    countryListText(opts.origin),
    "",
    "If you didn’t ask for this, ignore this email. The link expires in about 30 minutes.",
    "",
    "— HECS",
    "howeverycountryswears.com",
  ].join("\n");
  return { subject, html, text };
}

/** Post–Google signup welcome (email already verified). */
export function renderGoogleWelcomeEmail(opts: {
  origin: string;
  name?: string | null;
}): { subject: string; html: string; text: string } {
  const subject = "You’re in — pronunciations unlocked";
  const name = (opts.name || "").trim();
  const greet = name ? `Hi ${name} —` : "Hi —";
  const html = wrapHtml(
    subject,
    `
    <p>${greet}</p>
    <p>Your Google sign-in worked. Pronunciations are unlocked on How Every Country Swears.</p>
    <p>Start with a country page:</p>
    ${countryListHtml(opts.origin)}
    <p style="margin-top:1.25rem">See you on the map,<br/>HECS<br/>
    <a href="https://howeverycountryswears.com" style="color:#FF1493;text-decoration:none">howeverycountryswears.com</a></p>
  `,
  );
  const text = [
    greet,
    "",
    "Your Google sign-in worked. Pronunciations are unlocked on How Every Country Swears.",
    "",
    "Start with a country page:",
    countryListText(opts.origin),
    "",
    "See you on the map,",
    "HECS",
    "howeverycountryswears.com",
  ].join("\n");
  return { subject, html, text };
}

/** Legacy newsletter / audio-unlock path still referenced by routers. */
export function renderUnlockedEmail(opts: {
  origin: string;
  optInUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = "You’re unlocked";
  const html = wrapHtml(
    subject,
    `<p>You’re unlocked on How Every Country Swears.</p>${countryListHtml(opts.origin)}`,
  );
  return {
    subject,
    html,
    text: ["You’re unlocked on How Every Country Swears.", "", countryListText(opts.origin)].join("\n"),
  };
}

/** Legacy DOI path still referenced by routers. */
export function renderOptInWelcomeEmail(opts: {
  origin: string;
  confirmUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = "Confirm your email";
  const html = wrapHtml(
    subject,
    `<p><a href="${opts.confirmUrl}" style="color:#FF1493;font-weight:700">Confirm your email</a></p>${countryListHtml(opts.origin)}`,
  );
  return { subject, html, text: `Confirm: ${opts.confirmUrl}\n\n${countryListText(opts.origin)}` };
}
