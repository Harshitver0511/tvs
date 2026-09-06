"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Sprout,
  Satellite,
  Tractor,
  ArrowRight,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Bot,
  Search,
  Zap,
  Sun,
  Coins,
  Compass,
  Bike,
  Droplet,
  FileText,
} from "lucide-react";

export default function Home() {
  const [activeFilter, setActiveFilter] = useState("ALL (8)");
  const [searchQuery, setSearchQuery] = useState("");

  const filters = [
    { label: "ALL (8)", bg: "#000000", text: "#FFFFFF" },
    { label: "🚜 TRACTOR & MACHINERY", bg: "#FF6B6B", text: "#000000" },
    { label: "🛰️ SATELLITE AI", bg: "#FFD152", text: "#000000" },
    { label: "🌾 HARVEST CREDIT", bg: "#B8A9FF", text: "#000000" },
    { label: "🚨 EARLY WARNINGS", bg: "#FFFFFF", text: "#000000" },
  ];

  const cards = [
    {
      id: "tractors",
      category: "TRACTOR & MACHINERY",
      icon: Tractor,
      badge: "35 HP - 55 HP",
      title: "TRACTOR FINANCE",
      desc: "Instant sanction for new & used tractors. Zero pre-harvest installments with harvest-aligned bullet repayment.",
      bg: "#FF6B6B",
      link: "/apply",
    },
    {
      id: "satellite",
      category: "SATELLITE AI",
      icon: Satellite,
      badge: "10M SENTINEL-2",
      title: "SPECTRAL NDVI SCORING",
      desc: "Multispectral optical crop canopy analysis, soil moisture indices, and zero-paperwork parcel verification.",
      bg: "#FFD152",
      link: "/scoring",
    },
    {
      id: "harvest",
      category: "HARVEST CREDIT",
      icon: Sprout,
      badge: "POST-MANDI CASH",
      title: "HARVEST-ALIGNED EMIS",
      desc: "Non-linear repayment schedule that flexes with crop cutting cycles. Near-zero payments during sowing periods.",
      bg: "#B8A9FF",
      link: "/scoring",
    },
    {
      id: "sahayak",
      category: "SATELLITE AI",
      icon: Bot,
      badge: "VERNACULAR AI",
      title: "TVS SAHAYAK COPILOT",
      desc: "Multilingual GenAI loan assistant. Ask questions in Hindi or English about eligibility, documents, and rates.",
      bg: "#FFFFFF",
      link: "/assistant",
    },
    {
      id: "bike",
      category: "TRACTOR & MACHINERY",
      icon: Bike,
      badge: "24H DISBURSAL",
      title: "TWO-WHEELER KISAN",
      desc: "Reliable rural transport financing for farmers and small agri-entrepreneurs with minimal documentation.",
      bg: "#FF6B6B",
      link: "/apply",
    },
    {
      id: "solar",
      category: "TRACTOR & MACHINERY",
      icon: Sun,
      badge: "PM-KUSUM COMPATIBLE",
      title: "SOLAR PUMP & DRIP",
      desc: "Dedicated clean-energy credit facility for micro-irrigation systems and subsidized solar water pumps.",
      bg: "#FFD152",
      link: "/apply",
    },
    {
      id: "monitoring",
      category: "EARLY WARNINGS",
      icon: AlertTriangle,
      badge: "4 DISTRICTS LIVE",
      title: "EARLY WARNING RADAR",
      desc: "Predictive satellite drought detection, rainfall deficit alerts, and mandi price crash mitigation.",
      bg: "#B8A9FF",
      link: "/monitoring",
    },
    {
      id: "gold",
      category: "HARVEST CREDIT",
      icon: Coins,
      badge: "INSTANT OVERDRAFT",
      title: "GOLD AGRI-ADVANCE",
      desc: "High-value, low-interest liquidity advance against gold collateral for urgent crop input and seed purchase.",
      bg: "#FFFFFF",
      link: "/apply",
    },
  ];

  const filteredCards = cards.filter((c) => {
    const matchesFilter =
      activeFilter === "ALL (8)" ||
      activeFilter.includes(c.category) ||
      (activeFilter.includes("TRACTOR") && c.category.includes("TRACTOR"));
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen w-full bg-grid-pattern" style={{ backgroundColor: "var(--pulse-cream)" }}>
      {/* === TOP NAVBAR (Pulse 2026 Style) === */}
      <header
        className="sticky top-0 z-50 px-4 sm:px-8 py-3.5 flex items-center justify-between"
        style={{ backgroundColor: "#FFFFFF", borderBottom: "3px solid #000000" }}
      >
        {/* LOGO IN BOX */}
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

        {/* NAV LINKS */}
        <nav className="hidden lg:flex items-center gap-2 font-black text-xs uppercase tracking-wider">
          <Link
            href="/"
            className="px-3.5 py-1.5 transition-transform"
            style={{
              backgroundColor: "#FFD152",
              border: "2px solid #000000",
              boxShadow: "3px 3px 0px #000000",
              color: "#000000",
            }}
          >
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
          <Link href="/deck" className="px-3 py-1.5 font-black text-black bg-[#B8A9FF] hover:bg-[#FF6B6B] hover:text-white transition-colors" style={{ border: "2px solid #000000", boxShadow: "2px 2px 0px #000000" }}>
            📊 DECK / PPT
          </Link>
        </nav>

        {/* RIGHT ACTION BUTTONS */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/deck"
            className="pulse-btn px-3 py-2 font-black text-xs tracking-wider hidden sm:inline-flex"
            style={{
              backgroundColor: "#B8A9FF",
              color: "#000000",
              border: "2px solid #000000",
              boxShadow: "3px 3px 0px #000000",
            }}
          >
            📊 PITCH DECK
          </Link>

          <Link
            href="/assistant"
            className="w-9 h-9 flex items-center justify-center font-bold text-sm"
            style={{
              backgroundColor: "#FFD152",
              border: "2px solid #000000",
              boxShadow: "3px 3px 0px #000000",
              color: "#000000",
            }}
            title="GenAI Sahayak"
          >
            🤖
          </Link>

          <Link
            href="/staff"
            className="pulse-btn px-4 py-2 font-black text-xs tracking-wider"
            style={{
              backgroundColor: "#000000",
              color: "#FFFFFF",
              border: "2px solid #000000",
              boxShadow: "3px 3px 0px #000000",
            }}
          >
            STAFF PORTAL
          </Link>
        </div>
      </header>

      {/* === CONTINUOUS MARQUEE TICKER (Pulse Black Strip) === */}
      <div
        className="w-full overflow-hidden py-2 text-white font-black text-xs tracking-widest uppercase select-none"
        style={{ backgroundColor: "#000000", borderBottom: "3px solid #000000" }}
      >
        <div className="animate-ticker whitespace-nowrap flex items-center gap-6">
          {[1, 2].map((i) => (
            <span key={i} className="flex items-center gap-6">
              <span>★ 26M+ RURAL BORROWERS FINANCED</span>
              <span>★ SENTINEL-2 LIVE 10M SATELLITE IMAGERY</span>
              <span>★ ZERO CIBIL UNDERWRITING</span>
              <span>★ CRISIL AA+ STABILITY RATING</span>
              <span>★ HARVEST-ALIGNED BULLET EMIS</span>
              <span>★ AI SMART LENDING DECISION HUB</span>
              <span>★ TIER 3 & 4 FINANCIAL INCLUSION</span>
            </span>
          ))}
        </div>
      </div>

      {/* === MAIN HERO SECTION (Pulse "FEEL THE BEAT" Style) === */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-14 flex flex-col gap-12">
        <div className="flex flex-col gap-5">
          {/* BADGES PILLS ROW */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="pulse-pill" style={{ backgroundColor: "#FF6B6B", color: "#000000" }}>
              ✦ 2026 EDITION
            </span>
            <span className="pulse-pill" style={{ backgroundColor: "#FFD152", color: "#000000" }}>
              RURAL BHARAT INCLUSION
            </span>
            <span className="pulse-pill" style={{ backgroundColor: "#FFFFFF", color: "#000000" }}>
              <span className="w-2 h-2 rounded-full bg-[#2ED573] animate-pulse inline-block" />
              SENTINEL-2 ACTIVE
            </span>
          </div>

          {/* MASSIVE HERO HEADLINE */}
          <div className="flex flex-col font-black tracking-tight leading-[0.95]">
            <span className="text-5xl sm:text-7xl md:text-8xl text-[#000000]">
              FEEL THE CROP.
            </span>
            <div className="flex items-center flex-wrap gap-3 mt-1 sm:mt-2">
              <span className="text-5xl sm:text-7xl md:text-8xl text-[#000000]">
                EMPOWER
              </span>
              <span
                className="text-5xl sm:text-7xl md:text-8xl px-4 py-1 text-white inline-block -rotate-1"
                style={{
                  backgroundColor: "#FF6B6B",
                  border: "4px solid #000000",
                  boxShadow: "6px 6px 0px #000000",
                }}
              >
                FARMERS.
              </span>
            </div>
            <div className="mt-2">
              <span
                className="text-4xl sm:text-6xl md:text-7xl text-[#000000] px-3 py-1 inline-block"
                style={{
                  backgroundColor: "#FFD152",
                  border: "3px solid #000000",
                  boxShadow: "4px 4px 0px #000000",
                }}
              >
                WITH GEOSPATIAL AI.
              </span>
            </div>
          </div>

          <p className="font-medium text-base sm:text-xl text-[#000000]/80 max-w-2xl leading-relaxed mt-2">
            TVS Credit&apos;s Smart Lending Decision Hub fuses Sentinel-2 NDVI satellite telemetry,
            hyper-local weather anomaly scoring, and crop calendar dynamics to underwrite
            smallholder borrowers with zero traditional paperwork.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/apply"
              className="pulse-btn px-7 py-4 text-base gap-2"
              style={{
                backgroundColor: "#FFD152",
                color: "#000000",
                boxShadow: "5px 5px 0px #000000",
              }}
            >
              <Sprout size={20} strokeWidth={2.5} />
              APPLY FOR AGRI-LOAN →
            </Link>

            <Link
              href="/deck"
              className="pulse-btn px-7 py-4 text-base gap-2"
              style={{
                backgroundColor: "#FF6B6B",
                color: "#FFFFFF",
                boxShadow: "5px 5px 0px #000000",
              }}
            >
              <FileText size={20} strokeWidth={2.5} />
              PITCH DECK (PPT) →
            </Link>
          </div>
        </div>

        {/* === YELLOW DOT-MATRIX BANNER (Pulse "ALL EVENTS" Style) === */}
        <section
          className="p-8 sm:p-12 relative overflow-hidden"
          style={{
            backgroundColor: "#FFD152",
            backgroundImage: "radial-gradient(#000000 1.5px, transparent 1.5px)",
            backgroundSize: "18px 18px",
            border: "4px solid #000000",
            boxShadow: "6px 6px 0px #000000",
          }}
        >
          {/* Small badge */}
          <div
            className="inline-block px-3 py-1 font-mono text-xs font-black text-white mb-4"
            style={{ backgroundColor: "#000000", border: "2px solid #000000" }}
          >
            8 SPECIALIZED CREDIT FACILITIES
          </div>

          <h2
            className="font-black text-4xl sm:text-6xl md:text-7xl uppercase text-white tracking-tight inline-block px-4 py-2 mb-4"
            style={{
              backgroundColor: "#000000",
              border: "3px solid #000000",
              boxShadow: "5px 5px 0px rgba(0,0,0,0.3)",
            }}
          >
            LOAN PRODUCTS
          </h2>

          <p className="font-bold text-sm sm:text-base text-[#000000] max-w-xl">
            Harvest-aligned repayment cycles, asset-backed tractor loans, and satellite-scored
            credit limits — tailored for Bharat&apos;s farming communities.
          </p>
        </section>

        {/* === FILTER PILLS & SEARCH BAR (Pulse Style) === */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2.5">
            {filters.map((f) => (
              <button
                key={f.label}
                onClick={() => setActiveFilter(f.label)}
                className="pulse-chip"
                style={{
                  backgroundColor: activeFilter === f.label ? "#000000" : f.bg,
                  color: activeFilter === f.label ? "#FFFFFF" : f.text,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* SEARCH BAR */}
          <div
            className="flex items-center gap-3 px-4 py-3 bg-white"
            style={{
              border: "3px solid #000000",
              boxShadow: "4px 4px 0px #000000",
            }}
          >
            <Search size={20} strokeWidth={3} className="text-[#000000]/60" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search loan products, tractor HP, crop schemes, or satellite underwriting..."
              className="w-full bg-transparent font-bold text-sm text-[#000000] placeholder-[#000000]/40 outline-none"
            />
          </div>
        </div>

        {/* === 8-CARD NEO-BRUTALIST GRID (Pulse Event Categories Style) === */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="pulse-card p-6 flex flex-col justify-between gap-5"
                style={{ backgroundColor: card.bg }}
              >
                {/* CARD TOP ROW: ICON + BADGE */}
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="w-12 h-12 flex items-center justify-center bg-white"
                    style={{
                      border: "3px solid #000000",
                      boxShadow: "3px 3px 0px #000000",
                    }}
                  >
                    <Icon size={22} strokeWidth={2.5} className="text-[#000000]" />
                  </div>

                  <span
                    className="px-2.5 py-1 font-mono text-[10px] font-black uppercase text-white"
                    style={{
                      backgroundColor: "#000000",
                      border: "2px solid #000000",
                    }}
                  >
                    {card.badge}
                  </span>
                </div>

                {/* CARD CONTENT */}
                <div className="flex flex-col gap-2">
                  <h3 className="font-black text-xl leading-tight uppercase tracking-tight text-[#000000]">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-[#000000]/80 leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                {/* BOTTOM LINK */}
                <Link
                  href={card.link}
                  className="font-black text-xs uppercase tracking-wider text-[#000000] flex items-center gap-1.5 hover:underline pt-2 border-t-2 border-[#000000]/20"
                >
                  EXPLORE FEATURE <ArrowRight size={14} strokeWidth={3} />
                </Link>
              </div>
            );
          })}
        </section>

        {/* === SATELLITE EARLY WARNING RADAR STRIP (Pulse Style) === */}
        <section
          className="p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
          style={{
            backgroundColor: "#FF6B6B",
            border: "4px solid #000000",
            boxShadow: "6px 6px 0px #000000",
          }}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-0.5 font-mono text-[10px] font-black uppercase bg-white text-[#000000]"
                style={{ border: "2px solid #000000" }}
              >
                PORTFOLIO RADAR
              </span>
            </div>
            <h3 className="font-black text-2xl sm:text-4xl uppercase tracking-tight text-white leading-tight">
              Satellite Anomaly & Early Warnings
            </h3>
            <p className="font-medium text-sm sm:text-base text-white/95 max-w-xl">
              Inspect live drought indices, rainfall deficits, and mandi price crashes across 4
              priority districts before loans face delinquency.
            </p>
          </div>

          <Link
            href="/monitoring"
            className="pulse-btn px-6 py-4 text-sm font-black whitespace-nowrap gap-2"
            style={{
              backgroundColor: "#FFD152",
              color: "#000000",
              boxShadow: "4px 4px 0px #000000",
            }}
          >
            <AlertTriangle size={18} strokeWidth={2.5} />
            OPEN RISK RADAR →
          </Link>
        </section>
      </main>

      {/* === FOOTER (Pulse Style) === */}
      <footer
        className="mt-16 py-10 px-6 sm:px-8 text-black"
        style={{ backgroundColor: "#FFFFFF", borderTop: "4px solid #000000" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div
              className="px-3 py-1 font-black text-sm tracking-tight bg-[#FFD152]"
              style={{ border: "2px solid #000000", boxShadow: "3px 3px 0px #000000" }}
            >
              TVS CREDIT
            </div>
            <span className="font-mono text-xs font-bold">
              SMART LENDING DECISION HUB // PULSE 2026 EDITION
            </span>
          </div>

          <div className="font-mono text-xs text-[#000000]/70">
            EPIC 8 IT Case Study — AI-Powered Rural Underwriting
          </div>
        </div>
      </footer>
    </div>
  );
}
