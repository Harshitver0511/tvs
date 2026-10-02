// Supported UI languages (farmer-facing screens). Staff tools stay English.
export const LOCALES = ["en", "hi"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";

/** BCP-47 tags used for speech recognition / synthesis and number formatting. */
export const SPEECH_LANG: Record<Locale, string> = { en: "en-IN", hi: "hi-IN" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
