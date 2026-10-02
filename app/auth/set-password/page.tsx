"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, ArrowRight, AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Navbar from "../../components/Navbar";
import { createClient } from "../../lib/supabase";

// Landing page for staff invite emails and password-reset emails.
// Supabase sends either a PKCE `?code=` or implicit `#access_token=…` link.

type Stage = "verifying" | "ready" | "saving" | "error";

export default function SetPasswordPage() {
  const t = useTranslations("setPassword");
  const [supabase] = useState(() => createClient());
  const [stage, setStage] = useState<Stage>("verifying");
  const [email, setEmail] = useState("");
  const [isInvite, setIsInvite] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const establish = async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const linkError = hash.get("error_description") || url.searchParams.get("error_description");
      if (linkError) throw new Error(linkError);

      const type = hash.get("type") || url.searchParams.get("type");
      setIsInvite(type === "invite");

      // The client may already have consumed the link during initialisation
      let { data } = await supabase.auth.getSession();

      if (!data.session && url.searchParams.get("code")) {
        const res = await supabase.auth.exchangeCodeForSession(url.searchParams.get("code")!);
        if (res.error) throw res.error;
        data = { session: res.data.session };
      }
      if (!data.session && hash.get("access_token") && hash.get("refresh_token")) {
        const res = await supabase.auth.setSession({
          access_token: hash.get("access_token")!,
          refresh_token: hash.get("refresh_token")!,
        });
        if (res.error) throw res.error;
        data = { session: res.data.session };
      }
      const tokenHash = url.searchParams.get("token_hash");
      if (!data.session && tokenHash && (type === "invite" || type === "recovery")) {
        const res = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        if (res.error) throw res.error;
        data = { session: res.data.session };
      }
      if (!data.session) throw new Error("bad-link");

      // Strip tokens from the address bar
      window.history.replaceState(null, "", "/auth/set-password");
      setEmail(data.session.user.email || "");
      setStage("ready");
    };

    establish().catch((e: Error) => {
      setError(e.message === "bad-link" || !e.message ? t("badLink") : e.message);
      setStage("error");
    });
  }, [supabase, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError(t("tooShort"));
    if (password !== confirm) return setError(t("mismatch"));

    setStage("saving");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setStage("ready");
      return;
    }

    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({}));
    window.location.href = res.ok && data.destination ? data.destination : "/login";
  };

  return (
    <div className="min-h-screen w-full bg-grid-pattern pb-16 farmer-ui" style={{ backgroundColor: "var(--pulse-cream)" }}>
      <Navbar />
      <main className="max-w-md mx-auto px-4 pt-10">
        <div className="bg-white p-6 sm:p-8 space-y-5" style={{ border: "4px solid #000", boxShadow: "8px 8px 0px #000" }}>
          <div className="text-center space-y-1 border-b-3 border-black pb-4">
            <span className="pulse-pill bg-[#FFD152] text-black">
              <KeyRound className="w-3.5 h-3.5 mr-1 inline" />
              {isInvite ? t("invite") : t("reset")}
            </span>
            <h1 className="text-2xl font-display font-black uppercase tracking-tight mt-2">
              {isInvite ? t("activate") : t("setNew")}
            </h1>
            {email && <p className="text-xs font-mono text-neutral-600">{email}</p>}
          </div>

          {stage === "verifying" && (
            <div className="flex items-center justify-center gap-2 py-6 font-mono text-xs">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> {t("verifying")}
            </div>
          )}

          {stage === "error" && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 font-bold flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <Link href="/login?role=staff" className="pulse-btn w-full py-3 text-sm bg-[#FFD152] text-black no-underline">
                {t("back")}
              </Link>
            </div>
          )}

          {(stage === "ready" || stage === "saving") && (
            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label htmlFor="new-password" className="block font-bold uppercase mb-1">{t("newPassword")}</label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                  className="w-full p-2.5 border-2 border-black bg-[#FAF8F5] font-bold text-sm"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block font-bold uppercase mb-1">{t("confirm")}</label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  minLength={8}
                  required
                  className="w-full p-2.5 border-2 border-black bg-[#FAF8F5] font-bold text-sm"
                />
              </div>
              {error && <div className="p-2.5 bg-red-100 border-2 border-red-500 text-red-700 font-bold">{error}</div>}
              <button
                type="submit"
                disabled={stage === "saving"}
                className="pulse-btn w-full py-3.5 text-sm text-black bg-[#2ED573] hover:bg-[#52E08A] font-display font-black"
              >
                <span>{stage === "saving" ? t("saving") : t("save")}</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
