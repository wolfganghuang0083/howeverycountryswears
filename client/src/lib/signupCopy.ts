import { getAllCountries, isLockedContent } from "@/lib/data";

/** Total countries in data (en). */
export const TOTAL_COUNTRY_COUNT = getAllCountries("en").length;
/** Free (non-book-exclusive) countries — computed from data, not hard-coded. */
export const FREE_COUNTRY_COUNT = getAllCountries("en").filter(
  (c) => !isLockedContent(c.part_id, c.slug),
).length;
/** Book-exclusive countries = total − free. */
export const BOOK_EXCLUSIVE_COUNTRY_COUNT = TOTAL_COUNTRY_COUNT - FREE_COUNTRY_COUNT;

// DRAFT copy (商業席 review): audio no longer needs an account.
export const BOOK_EXCLUSIVE_SIGNUP_TITLE = `Join free — rate phrases across ${FREE_COUNTRY_COUNT} countries`;
export const BOOK_EXCLUSIVE_SIGNUP_AUDIO_NOTE = `Audio in the ${FREE_COUNTRY_COUNT} free countries already plays without an account.`;
/** Locked-button modal note: "{Country} audio unlocks with the book." + free-audio note. */
export function bookExclusiveAudioNote(countryName: string): string {
  return `${countryName} audio unlocks with the book. ${BOOK_EXCLUSIVE_SIGNUP_AUDIO_NOTE}`;
}
