"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, User, Languages } from "lucide-react";
import { assistantQA } from "../lib/data";

interface Message {
  role: "bot" | "user";
  text: string;
}

const quickPrompts = {
  en: [
    "What documents do I need?",
    "How do you verify land via satellite?",
    "How are harvest EMIs structured?",
    "What is the maximum tractor loan amount?",
    "How fast is disbursal to TVS wallet?",
  ],
  hi: [
    "क्या कागजात चाहिए?",
    "सैटेलाइट से खेत कैसे देखते हो?",
    "किश्त कैसे तय होती है?",
    "कितना ट्रैक्टर लोन मिलेगा?",
  ],
};

function findAnswer(q: string, lang: "en" | "hi"): string {
  const lower = q.toLowerCase();
  for (const entry of assistantQA[lang]) {
    if (entry.triggers.some((t) => lower.includes(t.toLowerCase()))) {
      return entry.answer;
    }
  }
  return lang === "en"
    ? "TVS Sahayak here! Inquire about collateral-free farmer limits, Sentinel-2 spectral indices, bullet EMIs post-mandi, or 48-hour sanctions. 🙏"
    : "मैं TVS Credit लोन में मदद के लिए हूँ! कागजात, सैटेलाइट, किश्त, राशि के बारे में पूछें। 🙏";
}

export default function AssistantPage() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "🙏 Namaste! I am TVS Sahayak, your AI lending copilot. Ask about satellite underwriting, land records, and harvest-aligned EMIs.",
    },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (text?: string) => {
    const q = text || input;
    if (!q.trim()) return;
    setMessages((p) => [...p, { role: "user", text: q }]);
    setInput("");
    setTimeout(() => {
      setMessages((p) => [...p, { role: "bot", text: findAnswer(q, lang) }]);
    }, 400);
  };

  const switchLang = () => {
    const nl = lang === "en" ? "hi" : "en";
    setLang(nl as "en" | "hi");
    setMessages([
      {
        role: "bot",
        text:
          nl === "en"
            ? "🙏 Namaste! How can I assist with your rural credit facility?"
            : "🙏 नमस्ते! आपके लोन आवेदन में कैसे सहायता करूं?",
      },
    ]);
  };

  return (
    <div className="min-h-screen w-full bg-grid-pattern" style={{ backgroundColor: "var(--pulse-cream)" }}>
      {/* === TOP NAVBAR === */}
      <header
        className="sticky top-0 z-50 px-4 sm:px-8 py-3.5 flex items-center justify-between"
        style={{ backgroundColor: "#FFFFFF", borderBottom: "3px solid #000000" }}
      >
        <Link href="/" className="flex items-center gap-3 no-underline">
          <div
            className="px-3.5 py-1.5 font-black text-base sm:text-lg tracking-tight"
            style={{
              backgroundColor: "#FFFFFF",
              border: "3px solid #000000",
              boxShadow: "4px 4px 0px #000000",
              color: "#000000",
            }}
          >
            <span style={{ color: "#FF6B6B" }}>TVS</span> CREDIT<span className="text-xs ml-0.5">&apos;26</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-2 font-black text-xs uppercase tracking-wider">
          <Link href="/" className="px-3 py-1.5 text-black hover:text-[#FF6B6B] transition-colors">
            HOME
          </Link>
          <Link href="/apply" className="px-3 py-1.5 text-black hover:text-[#FF6B6B] transition-colors">
            APPLY
          </Link>
          <Link href="/scoring" className="px-3 py-1.5 text-black hover:text-[#FF6B6B] transition-colors">
            AI SCORE
          </Link>
          <Link href="/staff" className="px-3 py-1.5 text-black hover:text-[#FF6B6B] transition-colors">
            STAFF DESK
          </Link>
          <Link href="/monitoring" className="px-3 py-1.5 text-black hover:text-[#FF6B6B] transition-colors">
            RISK RADAR
          </Link>
          <Link
            href="/assistant"
            className="px-3.5 py-1.5"
            style={{
              backgroundColor: "#FFD152",
              border: "2px solid #000000",
              boxShadow: "3px 3px 0px #000000",
              color: "#000000",
            }}
          >
            SAHAYAK
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <span className="pulse-pill" style={{ backgroundColor: "#2ED573", color: "#000000" }}>
            ● ONLINE
          </span>
        </div>
      </header>

      {/* TICKER */}
      <div
        className="w-full overflow-hidden py-1.5 text-white font-black text-[11px] tracking-widest uppercase select-none"
        style={{ backgroundColor: "#000000", borderBottom: "3px solid #000000" }}
      >
        <div className="animate-ticker whitespace-nowrap flex items-center gap-6">
          <span>★ TVS SAHAYAK GENAI COPILOT</span>
          <span>★ HINDI & ENGLISH MULTILINGUAL SUPPORT</span>
          <span>★ VOICE & TEXT CAPABLE</span>
          <span>★ EXPLAINABLE RURAL CREDIT ASSISTANCE</span>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-10 flex flex-col gap-6">
        <div
          className="pulse-card flex flex-col overflow-hidden"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          {/* HEADER BAR */}
          <div
            className="p-5 flex items-center justify-between border-b-3 border-[#000000]"
            style={{ backgroundColor: "#FFD152" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 bg-white"
                style={{ border: "3px solid #000000", boxShadow: "3px 3px 0px #000000" }}
              >
                <Bot size={24} strokeWidth={2.5} className="text-[#000000]" />
              </div>
              <div>
                <h1 className="font-black text-xl sm:text-2xl uppercase tracking-tight text-[#000000] leading-none">
                  TVS Sahayak
                </h1>
                <div className="font-mono text-[11px] uppercase font-bold text-[#000000]/70 mt-1">
                  Multilingual AI Agri Lending Assistant
                </div>
              </div>
            </div>

            <button
              onClick={switchLang}
              className="pulse-chip text-xs gap-1.5"
              style={{ backgroundColor: "#FFFFFF", color: "#000000" }}
            >
              <Languages size={14} strokeWidth={2.5} />
              {lang === "en" ? "हिंदी / Hindi" : "English"}
            </button>
          </div>

          {/* CHAT MESSAGES */}
          <div
            className="p-6 overflow-y-auto space-y-4"
            style={{
              backgroundColor: "var(--pulse-cream)",
              minHeight: "420px",
              maxHeight: "520px",
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[85%] p-4 flex flex-col gap-1 text-[#000000]"
                  style={{
                    backgroundColor: m.role === "user" ? "#FFD152" : "#FFFFFF",
                    border: "3px solid #000000",
                    boxShadow: "4px 4px 0px #000000",
                  }}
                >
                  <div className="font-mono text-[10px] font-black text-[#000000]/60 flex items-center gap-1 uppercase">
                    {m.role === "user" ? (
                      <>
                        <User size={10} strokeWidth={3} /> Applicant
                      </>
                    ) : (
                      <>
                        <Bot size={10} strokeWidth={3} /> TVS Sahayak
                      </>
                    )}
                  </div>
                  <div className="text-sm font-medium leading-relaxed whitespace-pre-line">
                    {m.text}
                  </div>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* QUICK PROMPTS */}
          <div className="p-4 border-t-3 border-[#000000] bg-white flex flex-col gap-2">
            <div className="font-mono text-[11px] font-black uppercase text-[#000000]/70">
              Suggested Questions (Click to Ask):
            </div>
            <div
              className="flex flex-wrap gap-2 p-2.5"
              style={{
                backgroundColor: "var(--pulse-cream)",
                border: "2px solid #000000",
                boxShadow: "2px 2px 0px #000000",
              }}
            >
              {quickPrompts[lang].map((p, idx) => {
                const colors = ["#FF6B6B", "#FFD152", "#B8A9FF", "#FFFFFF"];
                return (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="pulse-chip text-xs"
                    style={{ backgroundColor: colors[idx % colors.length] }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* INPUT BAR */}
          <div
            className="p-4 border-t-3 border-[#000000] flex gap-3"
            style={{ backgroundColor: "var(--pulse-cream)" }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={
                lang === "en"
                  ? "Type your question about loans, satellite scoring, or EMIs..."
                  : "ऋण, उपग्रह स्कोरिंग या किश्तों के बारे में पूछें..."
              }
              className="flex-1 px-4 py-3 bg-white font-bold text-sm text-[#000000] placeholder-[#000000]/40 outline-none"
              style={{ border: "3px solid #000000", boxShadow: "3px 3px 0px #000000" }}
            />
            <button
              onClick={() => send()}
              className="pulse-btn px-6 py-3 text-sm gap-2"
              style={{ backgroundColor: "#FF6B6B", color: "#FFFFFF" }}
            >
              <Send size={16} strokeWidth={2.5} />
              SEND
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
