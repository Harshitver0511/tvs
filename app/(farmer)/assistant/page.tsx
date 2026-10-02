"use client";
import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Bot,
  User,
  Languages,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import {
  listenOnce,
  isRecognitionSupported,
  isSynthesisSupported,
  canSpeak,
  speak,
  stopSpeaking,
} from "../../lib/voice/speech";

interface Message {
  role: "bot" | "user";
  text: string;
}

const quickPrompts = {
  en: [
    "What documents do I need for a tractor loan?",
    "How does Sentinel-2 satellite verify my field?",
    "How are harvest-aligned bullet EMIs structured?",
    "What is the RBI Key Fact Statement (KFS)?",
    "How fast is loan disbursal to my bank account?",
  ],
  hi: [
    "ट्रैक्टर लोन के लिए क्या कागजात चाहिए?",
    "सैटेलाइट (Sentinel-2) से खेत कैसे देखते हो?",
    "फसल कटाई अनुसार किश्त (Bullet EMI) कैसे तय होती है?",
    "आरबीआई (RBI) नियम और KFS क्या है?",
    "बैंक खाते में पैसे कितनी देर में आते हैं?",
  ],
};

export default function AssistantPage() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "🙏 Namaste! I am TVS Sahayak, your AI lending copilot powered by Google Gemini. Ask me anything about tractor loans, Sentinel-2 satellite crop health, harvest-aligned EMIs, or required documents.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [geminiActive, setGeminiActive] = useState<boolean | null>(null);
  const [geminiModel, setGeminiModel] = useState<string>("gemini-2.5-flash");
  const [isListening, setIsListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const abortListenRef = useRef<AbortController | null>(null);

  // Check Gemini status on mount
  useEffect(() => {
    fetch("/api/assistant")
      .then((res) => res.json())
      .then((data) => {
        setGeminiActive(Boolean(data.configured));
        if (data.model) setGeminiModel(data.model);
      })
      .catch(() => setGeminiActive(false));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Clean up any speech synthesis when unmounting
  useEffect(() => {
    return () => {
      stopSpeaking();
      abortListenRef.current?.abort();
    };
  }, []);

  const send = useCallback(
    async (textToSend?: string) => {
      const q = (textToSend || input).trim();
      if (!q || isLoading) return;

      const newMessages: Message[] = [...messages, { role: "user", text: q }];
      setMessages(newMessages);
      setInput("");
      setIsLoading(true);

      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: q,
            messages: messages, // pass conversation context
            language: lang,
          }),
        });

        const data = await res.json();
        if (res.ok && data?.reply) {
          setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
          if (typeof data.configured === "boolean") {
            setGeminiActive(data.configured);
          }
          if (data.model) {
            setGeminiModel(data.model);
          }
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "bot",
              text:
                data?.reply ||
                (lang === "hi"
                  ? "क्षमा करें, उत्तर प्राप्त करने में समस्या हुई। कृपया पुनः प्रयास करें।"
                  : "Sorry, I encountered an issue. Please try asking again."),
            },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text:
              lang === "hi"
                ? "नेटवर्क समस्या के कारण उत्तर नहीं मिल सका। कृपया अपना कनेक्शन जांचें।"
                : "Could not reach TVS Sahayak due to a network error. Please check your connection.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, lang]
  );

  const switchLang = () => {
    const nl = lang === "en" ? "hi" : "en";
    setLang(nl as "en" | "hi");
    stopSpeaking();
    setSpeakingIndex(null);
    setMessages([
      {
        role: "bot",
        text:
          nl === "en"
            ? "🙏 Namaste! I am TVS Sahayak, your AI lending copilot powered by Google Gemini. How can I assist with your rural credit facility today?"
            : "🙏 नमस्ते! मैं TVS सहायक हूँ, Google Gemini द्वारा संचालित। आपके कृषि ऋण, सैटेलाइट सत्यापन या किश्तों के आवेदन में कैसे सहायता करूँ?",
      },
    ]);
  };

  const handleClearChat = () => {
    stopSpeaking();
    setSpeakingIndex(null);
    setMessages([
      {
        role: "bot",
        text:
          lang === "en"
            ? "🙏 Namaste! Chat reset. How can I assist you with your TVS Credit loan today?"
            : "🙏 नमस्ते! चैट रीसेट हो गई है। आज आपके TVS Credit लोन में कैसे मदद करूँ?",
      },
    ]);
  };

  const handleVoiceListen = async () => {
    if (!isRecognitionSupported()) {
      alert(
        lang === "hi"
          ? "इस ब्राउज़र में वॉयस पहचान उपलब्ध नहीं है। कृपया क्रोम या एज का उपयोग करें।"
          : "Voice recognition is not supported in this browser. Please use Chrome or Edge."
      );
      return;
    }

    if (isListening) {
      abortListenRef.current?.abort();
      setIsListening(false);
      return;
    }

    try {
      setIsListening(true);
      const controller = new AbortController();
      abortListenRef.current = controller;
      const bcpLang = lang === "hi" ? "hi-IN" : "en-IN";
      const alts = await listenOnce(bcpLang, controller.signal);
      setIsListening(false);
      if (alts.length > 0 && alts[0].trim()) {
        send(alts[0].trim());
      }
    } catch {
      setIsListening(false);
    }
  };

  const handleToggleSpeak = (text: string, index: number) => {
    if (!isSynthesisSupported()) return;

    if (speakingIndex === index) {
      stopSpeaking();
      setSpeakingIndex(null);
      return;
    }

    stopSpeaking();
    setSpeakingIndex(index);
    const bcpLang = lang === "hi" ? "hi-IN" : "en-IN";
    speak(text, bcpLang, () => {
      setSpeakingIndex(null);
    });
  };

  return (
    <div
      className="min-h-screen w-full bg-grid-pattern"
      style={{ backgroundColor: "var(--pulse-cream, #FFFDF8)" }}
    >
      {/* === TOP NAVBAR === */}
      <Navbar />

      {/* TICKER */}
      <div
        className="w-full overflow-hidden py-1.5 text-white font-black text-[11px] tracking-widest uppercase select-none"
        style={{ backgroundColor: "#000000", borderBottom: "3px solid #000000" }}
      >
        <div className="animate-ticker whitespace-nowrap flex items-center gap-6">
          <span>★ TVS SAHAYAK GENAI COPILOT</span>
          <span>★ POWERED BY GOOGLE GEMINI</span>
          <span>★ HINDI & ENGLISH MULTILINGUAL VOICE & TEXT</span>
          <span>★ EXPLAINABLE SATELLITE UNDERWRITING</span>
          <span>★ HARVEST-ALIGNED BULLET EMIS</span>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-6">
        <div
          className="pulse-card flex flex-col overflow-hidden"
          style={{
            backgroundColor: "#FFFFFF",
            border: "3px solid #000000",
            boxShadow: "6px 6px 0px #000000",
          }}
        >
          {/* HEADER BAR */}
          <div
            className="p-5 flex flex-wrap items-center justify-between gap-4 border-b-3 border-[#000000]"
            style={{ backgroundColor: "#FFD152" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 bg-white"
                style={{ border: "3px solid #000000", boxShadow: "3px 3px 0px #000000" }}
              >
                <Bot size={28} strokeWidth={2.5} className="text-[#000000]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-black text-xl sm:text-2xl uppercase tracking-tight text-[#000000] leading-none">
                    TVS Sahayak
                  </h1>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase"
                    style={{
                      backgroundColor: "#000000",
                      color: "#FFD152",
                      border: "1.5px solid #000000",
                    }}
                  >
                    <Sparkles size={10} /> Gemini AI
                  </span>
                </div>
                <div className="font-mono text-[11px] uppercase font-bold text-[#000000]/70 mt-1">
                  Multilingual Rural Agri-Credit AI Copilot
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Gemini Status Indicator */}
              <div
                className="px-2.5 py-1 text-[11px] font-black flex items-center gap-1.5 uppercase"
                style={{
                  backgroundColor: geminiActive ? "#E8F8F0" : "#FFF4E5",
                  color: geminiActive ? "#0B6E3F" : "#B25E00",
                  border: "2px solid #000000",
                }}
                title={geminiActive ? `Connected to ${geminiModel}` : "GEMINI_API_KEY needs to be set in .env.local"}
              >
                {geminiActive ? (
                  <>
                    <CheckCircle2 size={13} strokeWidth={3} />
                    <span>Gemini Ready</span>
                  </>
                ) : geminiActive === false ? (
                  <>
                    <AlertCircle size={13} strokeWidth={3} />
                    <span>Gemini Key Needed</span>
                  </>
                ) : (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Checking...</span>
                  </>
                )}
              </div>

              {/* Reset Chat */}
              <button
                onClick={handleClearChat}
                className="pulse-chip text-xs gap-1"
                style={{ backgroundColor: "#FFFFFF", color: "#000000" }}
                title="Reset conversation"
              >
                <RotateCcw size={13} strokeWidth={2.5} />
                <span className="hidden sm:inline">Reset</span>
              </button>

              {/* Language Switcher */}
              <button
                onClick={switchLang}
                className="pulse-chip text-xs gap-1.5"
                style={{ backgroundColor: "#FFFFFF", color: "#000000" }}
              >
                <Languages size={14} strokeWidth={2.5} />
                {lang === "en" ? "हिंदी / Hindi" : "English"}
              </button>
            </div>
          </div>

          {/* CHAT MESSAGES CONTAINER */}
          <div
            className="p-6 overflow-y-auto space-y-4"
            style={{
              backgroundColor: "var(--pulse-cream, #FFFDF8)",
              minHeight: "420px",
              maxHeight: "540px",
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[85%] p-4 flex flex-col gap-1.5 text-[#000000]"
                  style={{
                    backgroundColor: m.role === "user" ? "#FFD152" : "#FFFFFF",
                    border: "3px solid #000000",
                    boxShadow: "4px 4px 0px #000000",
                  }}
                >
                  <div className="font-mono text-[10px] font-black text-[#000000]/60 flex items-center justify-between gap-2 uppercase">
                    <span className="flex items-center gap-1">
                      {m.role === "user" ? (
                        <>
                          <User size={11} strokeWidth={3} /> Applicant
                        </>
                      ) : (
                        <>
                          <Bot size={11} strokeWidth={3} /> TVS Sahayak (Gemini)
                        </>
                      )}
                    </span>

                    {/* Text-to-Speech button on Bot messages */}
                    {m.role === "bot" && canSpeak(lang) && (
                      <button
                        onClick={() => handleToggleSpeak(m.text, i)}
                        className="p-1 hover:bg-black/10 transition-colors flex items-center gap-1 text-[10px] font-bold"
                        title={speakingIndex === i ? "Stop speaking" : "Listen aloud"}
                      >
                        {speakingIndex === i ? (
                          <>
                            <VolumeX size={12} strokeWidth={2.5} className="text-[#FF6B6B]" />
                            <span className="text-[#FF6B6B]">Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 size={12} strokeWidth={2.5} />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="text-sm font-medium leading-relaxed whitespace-pre-line">
                    {m.text}
                  </div>
                </div>
              </div>
            ))}

            {/* THINKING / LOADING INDICATOR */}
            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="max-w-[85%] p-4 flex items-center gap-3 text-[#000000]"
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "3px solid #000000",
                    boxShadow: "4px 4px 0px #000000",
                  }}
                >
                  <Loader2 size={18} className="animate-spin text-[#000000]" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wide">
                    {lang === "hi"
                      ? "TVS सहायक Gemini AI से विचार कर रहा है..."
                      : "TVS Sahayak is thinking with Gemini..."}
                  </span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* QUICK PROMPTS */}
          <div className="p-4 border-t-3 border-[#000000] bg-white flex flex-col gap-2">
            <div className="font-mono text-[11px] font-black uppercase text-[#000000]/70 flex items-center justify-between">
              <span>{lang === "hi" ? "सुझाए गए प्रश्न (क्लिक करें):" : "Suggested Questions (Click to Ask):"}</span>
              <span className="text-[10px] font-bold text-gray-500">
                {lang === "hi" ? "हिंदी & English सक्षम" : "Bilingual AI"}
              </span>
            </div>
            <div
              className="flex flex-wrap gap-2 p-2.5"
              style={{
                backgroundColor: "var(--pulse-cream, #FFFDF8)",
                border: "2px solid #000000",
                boxShadow: "2px 2px 0px #000000",
              }}
            >
              {quickPrompts[lang].map((p, idx) => {
                const colors = ["#FF6B6B", "#FFD152", "#B8A9FF", "#FFFFFF", "#90E0EF"];
                return (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    disabled={isLoading}
                    className="pulse-chip text-xs transition-transform active:translate-y-0.5"
                    style={{
                      backgroundColor: colors[idx % colors.length],
                      color: "#000000",
                      opacity: isLoading ? 0.6 : 1,
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* INPUT BAR */}
          <div
            className="p-4 border-t-3 border-[#000000] flex gap-2 sm:gap-3 items-center"
            style={{ backgroundColor: "var(--pulse-cream, #FFFDF8)" }}
          >
            {/* Voice Input Button */}
            <button
              onClick={handleVoiceListen}
              disabled={isLoading}
              title={
                isListening
                  ? "Listening... Tap to stop"
                  : lang === "hi"
                  ? "बोलकर पूछें (Voice Input)"
                  : "Tap to Speak (Voice Input)"
              }
              className="pulse-btn p-3 text-sm flex items-center justify-center transition-all"
              style={{
                backgroundColor: isListening ? "#FF6B6B" : "#FFFFFF",
                color: isListening ? "#FFFFFF" : "#000000",
                border: "3px solid #000000",
                boxShadow: isListening ? "0 0 10px #FF6B6B" : "3px 3px 0px #000000",
              }}
            >
              {isListening ? (
                <MicOff size={18} strokeWidth={2.5} className="animate-pulse" />
              ) : (
                <Mic size={18} strokeWidth={2.5} />
              )}
            </button>

            {/* Text Input Field */}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              disabled={isLoading}
              placeholder={
                isListening
                  ? lang === "hi"
                    ? "सुन रहा हूँ... बोलिए"
                    : "Listening... Speak now"
                  : lang === "hi"
                  ? "ऋण, उपग्रह स्कोरिंग या किश्तों के बारे में पूछें..."
                  : "Type your question about loans, satellite scoring, or EMIs..."
              }
              className="flex-1 px-4 py-3 bg-white font-bold text-sm text-[#000000] placeholder-[#000000]/40 outline-none"
              style={{ border: "3px solid #000000", boxShadow: "3px 3px 0px #000000" }}
            />

            {/* Send Button */}
            <button
              onClick={() => send()}
              disabled={isLoading || !input.trim()}
              className="pulse-btn px-5 sm:px-6 py-3 text-sm gap-2 flex items-center font-black"
              style={{
                backgroundColor: "#FF6B6B",
                color: "#FFFFFF",
                opacity: isLoading || !input.trim() ? 0.6 : 1,
              }}
            >
              <Send size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">SEND</span>
            </button>
          </div>
        </div>

        {/* BOTTOM HELPFUL INFO CARD */}
        <div
          className="p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono font-bold"
          style={{ border: "3px solid #000000", boxShadow: "4px 4px 0px #000000" }}
        >
          <div className="flex items-center gap-2">
            <span className="p-1 bg-[#FFD152] border-2 border-black">📞</span>
            <span>TVS Credit Kisan Helpline: <strong>1800-425-4500</strong> (Toll-Free)</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/apply" className="underline font-black hover:text-[#FF6B6B]">
              Apply for Loan →
            </Link>
            <Link href="/scoring" className="underline font-black hover:text-[#FF6B6B]">
              Satellite Scoring →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
