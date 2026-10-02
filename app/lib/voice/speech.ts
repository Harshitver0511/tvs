"use client";
// Thin wrapper over the browser's free Web Speech API (no Bhashini key needed).
// Speech-to-text: Chrome/Edge (Android + desktop, needs network), partial Safari, no Firefox.
// Text-to-speech: depends on voices installed on the device.
// To switch to Bhashini later, replace these two functions — callers don't change.

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => SpeechRecognitionLike;

function recognitionCtor(): RecognitionCtor | undefined {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}

export function isRecognitionSupported(): boolean {
  return typeof window !== "undefined" && !!recognitionCtor();
}

export function isSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export type ListenError = "not-allowed" | "no-speech" | "network" | "unsupported" | "other";

/** Listen once; resolves with the recognised alternatives (best first). */
export function listenOnce(lang: string, signal?: AbortSignal): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const Ctor = recognitionCtor();
    if (!Ctor) return reject("unsupported" satisfies ListenError);
    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    rec.continuous = false;
    let settled = false;
    rec.onresult = (e) => {
      settled = true;
      const first = e.results[0];
      const alts: string[] = [];
      for (let i = 0; i < first.length; i++) alts.push(first[i].transcript.trim());
      resolve(alts.filter(Boolean));
    };
    rec.onerror = (e) => {
      settled = true;
      const map: Record<string, ListenError> = {
        "not-allowed": "not-allowed",
        "service-not-allowed": "not-allowed",
        "no-speech": "no-speech",
        network: "network",
      };
      reject(map[e.error] || "other");
    };
    rec.onend = () => {
      if (!settled) reject("no-speech" satisfies ListenError);
    };
    signal?.addEventListener("abort", () => rec.abort());
    rec.start();
  });
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const base = lang.split("-")[0];
  return voices.find((v) => v.lang === lang) || voices.find((v) => v.lang.replace("_", "-").startsWith(base));
}

/** True if the device has a voice for this language (or voices haven't loaded yet). */
export function canSpeak(lang: string): boolean {
  if (!isSynthesisSupported()) return false;
  const voices = window.speechSynthesis.getVoices();
  return voices.length === 0 || !!pickVoice(lang);
}

export function speak(text: string, lang: string, onEnd?: () => void): void {
  if (!isSynthesisSupported()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  const voice = pickVoice(lang);
  if (voice) u.voice = voice;
  u.rate = 0.95; // slightly slower for clarity
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking(): void {
  if (isSynthesisSupported()) window.speechSynthesis.cancel();
}
