import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./config";

// No locale in the URL: the choice lives in a cookie (set by the language switcher),
// falling back to the browser's Accept-Language.
async function resolveLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  const accept = (await headers()).get("accept-language") || "";
  return /(^|,)\s*hi\b/i.test(accept) ? "hi" : DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  return {
    locale,
    timeZone: "Asia/Kolkata",
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
