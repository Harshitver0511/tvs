"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { createClient } from "@/app/lib/supabase";

const LABEL: Record<Locale, string> = { en: "English", hi: "हिंदी" };

/** Toggles English ⇄ Hindi. Stored in a cookie (read on the server) and on the user's profile. */
export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("nav");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next: Locale = locale === "en" ? "hi" : "en";

  const switchTo = () => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    // Best effort: remember on the account for notifications / other devices
    createClient()
      .auth.updateUser({ data: { preferred_lang: next } })
      .catch(() => {});
    startTransition(() => router.refresh());
  };

  return (
    <button
      type="button"
      onClick={switchTo}
      disabled={pending}
      lang={next}
      aria-label={t("switchLanguage", { language: LABEL[next] })}
      className={`px-2.5 py-1.5 text-xs font-black border-2 border-black bg-white hover:bg-[#FFD152] flex items-center gap-1.5 cursor-pointer disabled:opacity-60 ${className}`}
      style={{ boxShadow: "2px 2px 0 #000" }}
    >
      <Languages className="w-4 h-4" aria-hidden />
      <span>{LABEL[next]}</span>
    </button>
  );
}
