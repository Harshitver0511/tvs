"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Tractor, ShieldCheck, Mail, Lock, ArrowRight, AlertTriangle } from "lucide-react";
import Navbar from "../components/Navbar";
import { createClient } from "../lib/supabase";
import { postLoginDestination } from "../lib/roles";

type Tab = "farmer" | "staff";

function LoginInner() {
  const t = useTranslations("login");
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";
  const initialTab: Tab = searchParams.get("role") === "staff" ? "staff" : "farmer";
  const denied = searchParams.get("denied") === "1";
  const [supabase] = useState(() => createClient());

  const [tab, setTab] = useState<Tab>(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Already signed in → go to the right place, unless we were sent here because
  // the current role can't open the requested page.
  useEffect(() => {
    if (denied) return;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) window.location.href = postLoginDestination(data.user.role, redirectPath);
      })
      .catch(() => {});
  }, [redirectPath, denied]);

  const friendlyError = (message: string): string => {
    const m = message.toLowerCase();
    if (m.includes("invalid login")) return t("errors.invalid");
    if (m.includes("not confirmed")) return t("errors.unconfirmed");
    if (m.includes("already registered") || m.includes("already exists")) return t("errors.exists");
    if (m.includes("password") && (m.includes("6") || m.includes("short") || m.includes("weak"))) return t("errors.weakPassword");
    if (m.includes("rate limit") || m.includes("too many")) return t("errors.rateLimit");
    if (m.includes("fetch") || m.includes("network")) return t("errors.network");
    return t("errors.generic");
  };

  // Exchange the fresh Supabase session for the server-verified role and destination
  const finishSignIn = async () => {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ redirect: redirectPath }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      window.location.href = data.destination;
      return;
    }
    setError(t("errors.generic"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    const normEmail = email.trim().toLowerCase();
    try {
      if (tab === "farmer" && isSignUp) {
        const { data, error: err } = await supabase.auth.signUp({
          email: normEmail,
          password,
          // Role is NOT taken from sign-up data: the server assigns "farmer"; only the admin can change it
          options: { data: { name: normEmail.split("@")[0] }, emailRedirectTo: `${window.location.origin}/login?role=farmer` },
        });
        if (err) throw err;
        if (data.session) await finishSignIn();
        else setNotice(t("checkEmail"));
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email: normEmail, password });
        if (err) throw err;
        if (data.session) await finishSignIn();
      }
    } catch (err) {
      setError(friendlyError((err as Error).message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setNotice("");
    const target = email.trim().toLowerCase();
    if (!target) {
      setError(t("errors.emailFirst"));
      return;
    }
    const { error: err } = await supabase.auth.resetPasswordForEmail(target, { redirectTo: `${window.location.origin}/auth/set-password` });
    if (err) setError(friendlyError(err.message));
    else setNotice(t("resetSent", { email: target }));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    await fetch("/api/auth/me", { method: "POST" }).catch(() => {});
    window.location.href = `/login?role=${initialTab}&redirect=${encodeURIComponent(redirectPath)}`;
  };

  const inputCls = "w-full p-3 border-2 border-black bg-[#FAF8F5] font-bold";

  return (
    <div className="min-h-screen w-full bg-grid-pattern pb-16 farmer-ui" style={{ backgroundColor: "var(--pulse-cream)" }}>
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 pt-6 sm:pt-10">
        {denied && (
          <div role="alert" className="p-4 bg-[#FFEBEE] mb-6 flex items-start gap-3" style={{ border: "3px solid #000", boxShadow: "4px 4px 0 #000" }}>
            <AlertTriangle className="w-5 h-5 text-[#B71C1C] shrink-0 mt-0.5" aria-hidden />
            <div className="flex-1">
              <div className="font-display font-black text-sm uppercase text-[#B71C1C]">{t("denied.title")}</div>
              <p className="text-sm mt-0.5">{t("denied.body")}</p>
              <button type="button" onClick={handleSignOut} className="mt-2 px-3 border-2 border-black bg-white text-xs font-bold uppercase cursor-pointer">
                {t("signOut")}
              </button>
            </div>
          </div>
        )}

        {!denied && redirectPath !== "/" && (
          <div className="p-4 bg-[#FFF8E1] mb-6 flex items-start gap-3 text-sm" style={{ border: "3px solid #000", boxShadow: "4px 4px 0 #000" }}>
            {initialTab === "staff" ? <ShieldCheck className="w-5 h-5 shrink-0" aria-hidden /> : <Tractor className="w-5 h-5 shrink-0" aria-hidden />}
            <p>{initialTab === "staff" ? t("needStaff") : t("needFarmer")}</p>
          </div>
        )}

        <div className="bg-white p-6 sm:p-8 space-y-6" style={{ border: "4px solid #000", boxShadow: "8px 8px 0 #000" }}>
          <div className="text-center space-y-1 border-b-3 border-black pb-5">
            <h1 className="text-2xl sm:text-3xl font-display font-black uppercase tracking-tight">{t("title")}</h1>
            <p className="text-sm text-neutral-700">{t("subtitle")}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#FAF8F5] border-3 border-black" role="tablist">
            {(["farmer", "staff"] as const).map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => {
                  setTab(id);
                  setError("");
                  setNotice("");
                }}
                className={`text-sm font-display font-black uppercase flex items-center justify-center gap-2 cursor-pointer border-2 ${
                  tab === id ? (id === "farmer" ? "bg-[#2ED573]" : "bg-[#FFD152]") + " border-black shadow-[2px_2px_0_#000]" : "bg-transparent border-transparent"
                }`}
              >
                {id === "farmer" ? <Tractor className="w-4 h-4" aria-hidden /> : <ShieldCheck className="w-4 h-4" aria-hidden />}
                {t(`tabs.${id}`)}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block font-bold uppercase mb-1 text-xs">
                <Mail className="w-3.5 h-3.5 inline mr-1" aria-hidden />
                {tab === "staff" ? t("workEmail") : t("email")}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tab === "staff" ? "name@tvscredit.com" : "kisan@example.com"}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="password" className="block font-bold uppercase mb-1 text-xs">
                <Lock className="w-3.5 h-3.5 inline mr-1" aria-hidden />
                {t("password")}
              </label>
              <input
                id="password"
                type="password"
                autoComplete={isSignUp && tab === "farmer" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                className={inputCls}
              />
            </div>

            {tab === "farmer" && (
              <label className="flex items-center gap-3 text-sm font-bold cursor-pointer" style={{ minHeight: 48 }}>
                <input type="checkbox" checked={isSignUp} onChange={(e) => setIsSignUp(e.target.checked)} className="w-6 h-6 border-2 border-black cursor-pointer" />
                {t("newAccount")}
              </label>
            )}
            {tab === "staff" && <p className="text-xs text-neutral-700">{t("staffNote")}</p>}

            <button type="button" onClick={handleForgotPassword} className="text-sm font-bold underline cursor-pointer bg-transparent">
              {t("forgot")}
            </button>

            {notice && (
              <div role="status" className="p-3 bg-green-100 border-2 border-green-700 text-green-900 font-bold text-sm">
                {notice}
              </div>
            )}
            {error && (
              <div role="alert" className="p-3 bg-red-100 border-2 border-red-700 text-red-900 font-bold text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`pulse-btn w-full py-3.5 text-base text-black font-display font-black ${tab === "farmer" ? "bg-[#2ED573] hover:bg-[#52E08A]" : "bg-[#FFD152] hover:bg-[#FFE082]"}`}
            >
              <span>{loading ? t("working") : tab === "farmer" && isSignUp ? t("createAccount") : t("signIn")}</span>
              <ArrowRight className="w-5 h-5 ml-1.5" aria-hidden />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5]" />}>
      <LoginInner />
    </Suspense>
  );
}
