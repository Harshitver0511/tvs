"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ShieldCheck, Trash2, AlertTriangle, CheckCircle2, User, Scale } from "lucide-react";
import Navbar from "../../components/Navbar";

interface ConsentRecord {
  id: string;
  purpose: string;
  grantedAt: string;
  revokedAt?: string;
}

const PURPOSES = ["ekyc", "satellite_analysis", "mandi_financial"] as const;

export default function ConsentClient() {
  const t = useTranslations("consentPortal");
  const locale = useLocale();
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(true);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmPurpose, setConfirmPurpose] = useState<string | null>(null);
  const [erasureOpen, setErasureOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const fmt = (iso: string) => new Date(iso).toLocaleString(locale === "hi" ? "hi-IN" : "en-IN");

  const fetchConsents = useCallback(() => {
    return fetch("/api/consents", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error();
        setConsents(data.consents || []);
      })
      .catch(() => setMessage({ ok: false, text: t("errors.load") }))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => data.authenticated && setAccount(data.user.email || data.user.name))
      .catch(() => {});
    fetchConsents();
  }, [fetchConsents]);

  const revoke = async (purpose: string) => {
    setConfirmPurpose(null);
    setMessage(null);
    const res = await fetch("/api/consents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose, reason: "Revoked by user via consent portal" }),
    }).catch(() => null);
    if (res?.ok) {
      setMessage({ ok: true, text: t("revoked", { purpose: t(`purposes.${purpose}.title`) }) });
      fetchConsents();
    } else {
      setMessage({ ok: false, text: t("errors.revoke") });
    }
  };

  const erase = async () => {
    setBusy(true);
    const res = await fetch("/api/erasure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmationText: "DELETE_MY_DATA", reason: reason || undefined }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      const data = await res.json();
      setErasureOpen(false);
      setConfirmText("");
      setMessage({ ok: true, text: t("erase.done", { count: data.erasedCount }) });
      fetchConsents();
    } else {
      setMessage({ ok: false, text: t("errors.erase") });
    }
  };

  const confirmWord = t("erase.confirmWord");

  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] pb-16 farmer-ui">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        <div className="p-6 bg-white flex flex-wrap items-center justify-between gap-4" style={{ border: "3px solid #000", boxShadow: "5px 5px 0 #000" }}>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-black uppercase tracking-tight">{t("title")}</h1>
            <p className="text-sm text-neutral-700 mt-1">{t("subtitle")}</p>
          </div>
          <div className="w-14 h-14 bg-[#FFD152] border-2 border-black flex items-center justify-center shrink-0">
            <Scale className="w-8 h-8" aria-hidden />
          </div>
        </div>

        <div className="p-5 bg-white space-y-3" style={{ border: "3px solid #000", boxShadow: "4px 4px 0 #000" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" aria-hidden />
              <div>
                <div className="text-[11px] font-bold uppercase text-neutral-700">{t("account")}</div>
                <div className="font-bold">{account || "…"}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErasureOpen(true)}
              className="pulse-btn px-4 text-sm font-bold bg-[#C62828] text-white hover:bg-[#B71C1C] flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" aria-hidden />
              {t("erase.button")}
            </button>
          </div>
          {message && (
            <div
              role={message.ok ? "status" : "alert"}
              className={`p-3 border-2 border-black text-sm font-bold flex items-center gap-2 ${message.ok ? "bg-[#E8F8F0] text-[#1B5E20]" : "bg-[#FFEBEE] text-[#B71C1C]"}`}
            >
              {message.ok ? <CheckCircle2 className="w-5 h-5" aria-hidden /> : <AlertTriangle className="w-5 h-5" aria-hidden />}
              {message.text}
            </div>
          )}
        </div>

        <section aria-busy={loading} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PURPOSES.map((purpose) => {
            const active = consents.find((c) => c.purpose === purpose && !c.revokedAt);
            const revoked = consents.find((c) => c.purpose === purpose && c.revokedAt);
            return (
              <article key={purpose} className="p-4 bg-white flex flex-col justify-between gap-4" style={{ border: "3px solid #000", boxShadow: "4px 4px 0 #000" }}>
                <div className="space-y-2">
                  <span className={`pulse-pill text-[11px] ${active ? "bg-[#2ED573] text-black" : "bg-neutral-200 text-black"}`}>
                    {active ? t("status.active") : revoked ? t("status.withdrawn") : t("status.none")}
                  </span>
                  <h2 className="font-display font-black text-base uppercase">{t(`purposes.${purpose}.title`)}</h2>
                  <p className="text-sm text-neutral-800 leading-relaxed">{t(`purposes.${purpose}.body`)}</p>
                  <dl className="p-2 bg-[#FAF8F5] border border-black/40 text-xs space-y-1">
                    <div>
                      <dt className="inline font-bold">{t("retention")}: </dt>
                      <dd className="inline">{t(`purposes.${purpose}.retention`)}</dd>
                    </div>
                    {active && (
                      <div>
                        <dt className="inline font-bold">{t("grantedAt")}: </dt>
                        <dd className="inline">{fmt(active.grantedAt)}</dd>
                      </div>
                    )}
                    {revoked?.revokedAt && (
                      <div className="text-[#B71C1C]">
                        <dt className="inline font-bold">{t("revokedAt")}: </dt>
                        <dd className="inline">{fmt(revoked.revokedAt)}</dd>
                      </div>
                    )}
                  </dl>
                </div>
                {active &&
                  (confirmPurpose === purpose ? (
                    <div className="space-y-2">
                      <p className="text-xs font-bold">{t("revokeConfirm")}</p>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => revoke(purpose)} className="flex-1 border-2 border-black bg-[#C62828] text-white font-bold text-sm cursor-pointer">
                          {t("yesWithdraw")}
                        </button>
                        <button type="button" onClick={() => setConfirmPurpose(null)} className="flex-1 border-2 border-black bg-white font-bold text-sm cursor-pointer">
                          {t("cancel")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmPurpose(purpose)}
                      className="w-full border-2 border-black bg-white hover:bg-red-50 text-[#B71C1C] font-bold text-sm cursor-pointer"
                    >
                      {t("withdraw")}
                    </button>
                  ))}
              </article>
            );
          })}
        </section>

        <section className="p-6 bg-white space-y-4" style={{ border: "3px solid #000", boxShadow: "4px 4px 0 #000" }}>
          <h2 className="font-display font-black text-lg uppercase flex items-center gap-2 border-b-2 border-black pb-2">
            <ShieldCheck className="w-5 h-5 text-[#1B7F45]" aria-hidden />
            {t("rights.title")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            {(["access", "erasure", "grievance", "nominate"] as const).map((k) => (
              <div key={k} className="p-3 bg-[#FAF8F5] border border-black space-y-1">
                <div className="font-black">{t(`rights.${k}.title`)}</div>
                <p className="text-xs text-neutral-800">{t(`rights.${k}.body`)}</p>
              </div>
            ))}
          </div>
          <p className="text-sm">{t("rights.grievanceContact")}</p>
        </section>
      </main>

      {erasureOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" role="dialog" aria-modal="true" aria-labelledby="erase-title">
          <div className="bg-white max-w-lg w-full p-6 space-y-4" style={{ border: "4px solid #000", boxShadow: "8px 8px 0 #000" }}>
            <h3 id="erase-title" className="font-display font-black text-lg uppercase flex items-center gap-2 border-b-2 border-black pb-2">
              <AlertTriangle className="w-6 h-6 text-[#B71C1C]" aria-hidden />
              {t("erase.title")}
            </h3>
            <p className="text-sm leading-relaxed">{t("erase.body")}</p>
            <div>
              <label htmlFor="erase-confirm" className="block font-bold text-sm mb-1">
                {t("erase.typeToConfirm", { word: confirmWord })}
              </label>
              <input
                id="erase-confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoComplete="off"
                className="w-full p-2.5 border-2 border-black bg-[#FAF8F5] font-bold"
              />
            </div>
            <div>
              <label htmlFor="erase-reason" className="block font-bold text-sm mb-1">
                {t("erase.reason")}
              </label>
              <input id="erase-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-2.5 border-2 border-black bg-[#FAF8F5]" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black">
              <button type="button" onClick={() => setErasureOpen(false)} className="px-4 border-2 border-black text-sm font-bold bg-white cursor-pointer">
                {t("cancel")}
              </button>
              <button
                type="button"
                disabled={confirmText.trim().toLowerCase() !== confirmWord.toLowerCase() || busy}
                onClick={erase}
                className="pulse-btn px-4 text-sm font-bold text-white bg-[#C62828] hover:bg-[#B71C1C] disabled:opacity-40"
              >
                {busy ? t("erase.working") : t("erase.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
