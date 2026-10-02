"use client";

import { useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Mic, Loader2, Volume2, Square } from "lucide-react";
import { SPEECH_LANG, type Locale } from "@/i18n/config";
import { canSpeak, isRecognitionSupported, listenOnce, speak, stopSpeaking, type ListenError } from "@/app/lib/voice/speech";

const noopSubscribe = () => () => {};

/**
 * Mic button for a form field. `onHeard` receives the recognised alternatives and
 * returns true if it could use them (else the farmer is asked to repeat).
 * Renders nothing on browsers without speech recognition — typing still works.
 */
export function VoiceInputButton({ field, onHeard }: { field: string; onHeard: (alternatives: string[]) => boolean }) {
  const t = useTranslations("voice");
  const locale = useLocale() as Locale;
  const supported = useSyncExternalStore(noopSubscribe, isRecognitionSupported, () => false);
  const [listening, setListening] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  if (!supported) return null;

  const start = async () => {
    setFeedback(null);
    setListening(true);
    try {
      const alts = await listenOnce(SPEECH_LANG[locale]);
      const used = alts.length > 0 && onHeard(alts);
      setFeedback(
        used ? { ok: true, text: t("heard", { heard: alts[0] }) } : { ok: false, text: t("notUnderstood", { heard: alts[0] ?? "" }) }
      );
    } catch (err) {
      const e = err as ListenError;
      setFeedback({ ok: false, text: e === "not-allowed" ? t("notAllowed") : e === "network" ? t("network") : t("noSpeech") });
    } finally {
      setListening(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={start}
        disabled={listening}
        aria-label={t("speakField", { field })}
        className={`shrink-0 w-12 h-12 flex items-center justify-center border-2 border-black cursor-pointer ${
          listening ? "bg-[#C62828] text-white animate-pulse" : "bg-[#FFD152] text-black hover:bg-[#FFE082]"
        }`}
        style={{ boxShadow: "2px 2px 0 #000" }}
      >
        {listening ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : <Mic className="w-5 h-5" aria-hidden />}
      </button>
      {feedback && (
        <span role="status" className={`text-[11px] font-bold mt-1 max-w-[220px] text-right ${feedback.ok ? "text-[#1B5E20]" : "text-[#B71C1C]"}`}>
          {feedback.text}
        </span>
      )}
    </span>
  );
}

/** Reads `text` aloud in the current UI language using the device's voices. */
export function ListenButton({ text, className = "" }: { text: string; className?: string }) {
  const t = useTranslations("voice");
  const locale = useLocale() as Locale;
  const lang = SPEECH_LANG[locale];
  const supported = useSyncExternalStore(noopSubscribe, () => canSpeak(lang), () => false);
  const [speaking, setSpeaking] = useState(false);

  if (!supported) return null;

  const toggle = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speak(text, lang, () => setSpeaking(false));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={speaking}
      className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-black font-black text-sm cursor-pointer ${
        speaking ? "bg-black text-white" : "bg-white text-black hover:bg-[#FFD152]"
      } ${className}`}
      style={{ boxShadow: "2px 2px 0 #000", minHeight: 48 }}
    >
      {speaking ? <Square className="w-4 h-4" aria-hidden /> : <Volume2 className="w-5 h-5" aria-hidden />}
      <span>{speaking ? t("stop") : t("listen")}</span>
    </button>
  );
}
