"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SerwistProvider } from "@serwist/turbopack/react";
import { useTranslations } from "next-intl";
import { WifiOff, CheckCircle2, X } from "lucide-react";
import { useOnline } from "./connectivity";

// Registers the service worker (production only — a dev SW caches stale code)
// and shows connectivity / background-sync status to the farmer.
const SW_ENABLED = process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SW_DEV === "1";

interface SyncMessage {
  title: string;
  body: string;
  url: string;
}

function StatusBanner() {
  const t = useTranslations("pwa");
  const online = useOnline();
  const [sync, setSync] = useState<SyncMessage | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "TVS_APPLY_SYNC") setSync({ title: e.data.title, body: e.data.body, url: e.data.url });
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  return (
    <div aria-live="polite" className="fixed bottom-3 inset-x-3 z-[60] flex flex-col items-center gap-2 pointer-events-none">
      {!online && (
        <div
          role="status"
          className="pointer-events-auto max-w-lg w-full bg-black text-white px-4 py-3 flex items-center gap-3 font-bold text-sm"
          style={{ border: "3px solid #000", boxShadow: "4px 4px 0 #FFD152" }}
        >
          <WifiOff className="w-5 h-5 shrink-0" aria-hidden />
          <span>{t("offlineBanner")}</span>
        </div>
      )}
      {sync && (
        <div
          role="status"
          className="pointer-events-auto max-w-lg w-full bg-[#E8F8F0] text-black px-4 py-3 flex items-start gap-3 text-sm"
          style={{ border: "3px solid #000", boxShadow: "4px 4px 0 #000" }}
        >
          <CheckCircle2 className="w-5 h-5 shrink-0 text-[#1B7F45]" aria-hidden />
          <a href={sync.url} className="flex-1 text-black no-underline">
            <div className="font-black">{sync.title}</div>
            <div>{sync.body}</div>
          </a>
          <button type="button" onClick={() => setSync(null)} aria-label={t("dismiss")} className="p-2 -m-2 cursor-pointer">
            <X className="w-5 h-5" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

export default function PwaProvider({ children }: { children: ReactNode }) {
  return (
    <SerwistProvider swUrl="/serwist/sw.js" disable={!SW_ENABLED} reloadOnOnline={false}>
      {children}
      <StatusBanner />
    </SerwistProvider>
  );
}
