"use client";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  Sprout,
  Satellite,
  Tractor,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ArrowRight,
  Home,
  FileText,
} from "lucide-react";

export default function DeckPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const totalSlides = 10;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : prev));
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Space") {
        e.preventDefault();
        nextSlide();
      } else if (e.key === "ArrowLeft" || e.key === "Backspace") {
        e.preventDefault();
        prevSlide();
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const slides = [
    // SLIDE 1: COVER
    {
      badge: "✦ 2026 EDITION // EPIC 8 IT CASE STUDY",
      title: "TVS CREDIT",
      subtitle: "SMART LENDING DECISION HUB",
      lead: "Revolutionising Rural Bharat Lending with Geospatial AI, Satellite Telemetry & Harvest-Aligned EMIs",
      type: "cover",
    },
    // SLIDE 2: THE PROBLEM
    {
      badge: "01 // THE RURAL CREDIT CHASM",
      title: "THE CORE PROBLEM & EXCLUSION GAP",
      type: "problem",
    },
    // SLIDE 3: THE SOLUTION ARCHITECTURE
    {
      badge: "02 // FULL-STACK TECHNICAL ARCHITECTURE",
      title: "THE 5-PILLAR DECISION PLATFORM",
      type: "architecture",
    },
    // SLIDE 4: SATELLITE TELEMETRY
    {
      badge: "03 // GEOSPATIAL INTELLIGENCE",
      title: "SENTINEL-2 NDVI SPECTRAL CADASTRE",
      type: "satellite",
    },
    // SLIDE 5: EXPLAINABLE AI SCORING
    {
      badge: "04 // ALTERNATIVE CREDIT SCORING",
      title: "EXPLAINABLE AI & SHAP DECISION DRIVERS",
      type: "shap",
    },
    // SLIDE 6: HARVEST EMIs
    {
      badge: "05 // CASH-FLOW INNOVATION",
      title: "HARVEST-ALIGNED DYNAMIC EMIs",
      type: "harvest",
    },
    // SLIDE 7: EARLY WARNING RADAR
    {
      badge: "06 // REAL-TIME RISK MITIGATION",
      title: "PORTFOLIO EARLY WARNING RADAR",
      type: "radar",
    },
    // SLIDE 8: GENAI SAHAYAK
    {
      badge: "07 // VERNACULAR CONVERSATIONAL AI",
      title: "TVS SAHAYAK — MULTILINGUAL COPILOT",
      type: "sahayak",
    },
    // SLIDE 9: BUSINESS IMPACT
    {
      badge: "08 // PERFORMANCE & ROI METRICS",
      title: "BUSINESS IMPACT & QUANTIFIED ROI",
      type: "impact",
    },
    // SLIDE 10: FUTURE ROADMAP
    {
      badge: "09 // STRATEGIC HORIZON",
      title: "NATIONWIDE SCALING & GREEN FINANCING",
      type: "roadmap",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-grid-pattern flex flex-col justify-between" style={{ backgroundColor: "var(--pulse-cream)" }}>
      {/* === TOP CONTROL BAR === */}
      <header
        className="px-4 sm:px-8 py-3 flex items-center justify-between bg-white select-none"
        style={{ borderBottom: "3px solid #000000" }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-3 py-1 font-black text-sm tracking-tight bg-white flex items-center gap-1.5 no-underline text-black"
            style={{ border: "2px solid #000000", boxShadow: "3px 3px 0px #000000" }}
          >
            <Home size={14} strokeWidth={2.5} />
            <span style={{ color: "#FF6B6B" }}>TVS</span> DECK
          </Link>

          <span className="font-mono text-xs font-black uppercase text-black/70 hidden sm:inline-block">
            Slide {currentSlide + 1} of {totalSlides}
          </span>
        </div>

        {/* SLIDE PROGRESS BAR */}
        <div className="hidden md:flex items-center gap-1 flex-1 max-w-xs mx-4">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className="h-2 flex-1 transition-all"
              style={{
                backgroundColor: currentSlide === idx ? "#FFD152" : idx < currentSlide ? "#000000" : "#E5E5E5",
                border: "1px solid #000000",
              }}
              title={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* RIGHT CONTROLS */}
        <div className="flex items-center gap-2">
          {/* Direct PPTX Download */}
          <a
            href="/TVS_Credit_Smart_Lending_Deck.pptx"
            download="TVS_Credit_Smart_Lending_Deck.pptx"
            className="pulse-chip text-xs gap-1.5"
            style={{ backgroundColor: "#FFD152", color: "#000000" }}
          >
            <Download size={14} strokeWidth={2.5} />
            DOWNLOAD .PPTX
          </a>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="w-9 h-9 flex items-center justify-center font-bold bg-white"
            style={{ border: "2px solid #000000", boxShadow: "2px 2px 0px #000000" }}
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 size={16} strokeWidth={2.5} /> : <Maximize2 size={16} strokeWidth={2.5} />}
          </button>
        </div>
      </header>

      {/* === ACTIVE SLIDE CANVAS === */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 flex flex-col justify-center">
        {/* SLIDE 1: COVER */}
        {currentSlide === 0 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="pulse-pill" style={{ backgroundColor: "#FF6B6B", color: "#000000" }}>
                ✦ 2026 EDITION
              </span>
              <span className="pulse-pill" style={{ backgroundColor: "#FFD152", color: "#000000" }}>
                EPIC 8 IT CASE STUDY
              </span>
              <span className="pulse-pill" style={{ backgroundColor: "#FFFFFF", color: "#000000" }}>
                <span className="w-2 h-2 rounded-full bg-[#2ED573] animate-pulse inline-block" />
                AI ENGINE READY
              </span>
            </div>

            <div
              className="p-8 sm:p-14 flex flex-col gap-6 bg-white"
              style={{ border: "4px solid #000000", boxShadow: "8px 8px 0px #000000" }}
            >
              <div className="font-black text-5xl sm:text-7xl md:text-8xl tracking-tight uppercase leading-[0.95] text-black">
                <span style={{ color: "#FF6B6B" }}>TVS CREDIT</span>
                <br />
                SMART LENDING
                <br />
                <span
                  className="px-4 py-1 text-black inline-block mt-2"
                  style={{
                    backgroundColor: "#FFD152",
                    border: "3px solid #000000",
                    boxShadow: "5px 5px 0px #000000",
                  }}
                >
                  DECISION HUB.
                </span>
              </div>

              <p className="text-base sm:text-xl font-bold text-black/80 max-w-2xl leading-relaxed">
                Revolutionising Rural Bharat Lending with Geospatial AI, Sentinel-2 Satellite Telemetry,
                Explainable SHAP Scoring & Harvest-Aligned Dynamic EMIs.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t-2 border-black/15">
                {[
                  { val: "26M+", label: "RURAL CUSTOMERS" },
                  { val: "AA+", label: "CRISIL STABILITY" },
                  { val: "< 3 MIN", label: "AI SANCTION TIME" },
                  { val: "90%", label: "TRACTOR LTV" },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="p-3.5 bg-[#FAF8F5]"
                    style={{ border: "2px solid #000000", boxShadow: "3px 3px 0px #000000" }}
                  >
                    <div className="font-black text-2xl sm:text-3xl text-black">{m.val}</div>
                    <div className="font-mono text-[10px] uppercase font-bold text-black/70 mt-0.5">
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 2: THE PROBLEM */}
        {currentSlide === 1 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="pulse-pill" style={{ backgroundColor: "#FF6B6B", color: "#000000" }}>
                01 // THE RURAL CREDIT CHASM
              </span>
            </div>

            <h2 className="font-black text-3xl sm:text-5xl uppercase tracking-tight text-black">
              Why Traditional Banks Fail Rural Bharat
            </h2>

            <div className="grid sm:grid-cols-2 gap-6">
              {[
                {
                  step: "01",
                  title: "NO FORMAL CIBIL TRACK RECORD",
                  desc: "Over 80% of smallholder farmers operate in an unorganized cash economy with zero banking history. Traditional bureau algorithms systematically reject viable borrowers.",
                  bg: "#FF6B6B",
                },
                {
                  step: "02",
                  title: "EXPENSIVE MANUAL LAND AUDITS",
                  desc: "Physical field verification takes 14-21 days, costs ~₹3,500 per visit, relies on subjective human judgment, and is highly prone to boundary disputes and fraudulent claims.",
                  bg: "#FFD152",
                },
                {
                  step: "03",
                  title: "RIGID FIXED MONTHLY EMIs",
                  desc: "Banks demand identical payments every 30 days. During sowing seasons (July/Aug), farmer liquidity is zero, triggering unnecessary technical defaults despite bumper harvest potential.",
                  bg: "#B8A9FF",
                },
                {
                  step: "04",
                  title: "CLIMATE & MANDI PRICE CRASHES",
                  desc: "Unseasonal droughts, pest outbreaks, and sudden APMC price drops trigger localized default cascades. Lenders have zero early warning visibility until loans go delinquent.",
                  bg: "#FFFFFF",
                },
              ].map((p) => (
                <div
                  key={p.title}
                  className="pulse-card p-6 sm:p-7 flex flex-col justify-between gap-4"
                  style={{ backgroundColor: p.bg }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-3xl text-black">{p.step}</span>
                    <span className="font-mono text-xs font-black uppercase text-black/70">
                      CRITICAL BOTTLENECK
                    </span>
                  </div>
                  <div>
                    <h3 className="font-black text-lg sm:text-xl uppercase tracking-tight text-black mb-2">
                      {p.title}
                    </h3>
                    <p className="text-sm font-medium text-black/85 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SLIDE 3: THE SOLUTION ARCHITECTURE */}
        {currentSlide === 2 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="pulse-pill" style={{ backgroundColor: "#FFD152", color: "#000000" }}>
                02 // FULL-STACK ARCHITECTURE
              </span>
            </div>

            <h2 className="font-black text-3xl sm:text-5xl uppercase tracking-tight text-black">
              The 5-Pillar Decision Platform
            </h2>

            <div className="flex flex-col gap-3">
              {[
                {
                  num: "01",
                  title: "SATELLITE CADASTRE VERIFICATION",
                  desc: "ESA Sentinel-2 10m bands (NIR & Red) automate farm parcel boundary lookup and multi-year crop health verification.",
                  bg: "#FFFFFF",
                },
                {
                  num: "02",
                  title: "HYPER-LOCAL AGROMET TELEMETRY",
                  desc: "30-year IMD rainfall deviations, drought stress indices, and canal/borewell irrigation access modeling.",
                  bg: "#FFD152",
                },
                {
                  num: "03",
                  title: "EXPLAINABLE AI CREDIT SCORING (SHAP)",
                  desc: "Gradient-boosted alternative scoring replaces traditional CIBIL scores in under 3 minutes with full regulatory explainability.",
                  bg: "#FF6B6B",
                },
                {
                  num: "04",
                  title: "DYNAMIC HARVEST-ALIGNED EMIs",
                  desc: "Flexible cash flow matching: token ₹800 EMIs during sowing season; bullet principal recovery post-harvest mandi sale.",
                  bg: "#B8A9FF",
                },
                {
                  num: "05",
                  title: "EARLY WARNING RADAR & GENAI SAHAYAK",
                  desc: "Real-time district anomaly detection and multilingual conversational assistant in Hindi and regional vernaculars.",
                  bg: "#FFFFFF",
                },
              ].map((item) => (
                <div
                  key={item.num}
                  className="pulse-card p-4 sm:p-5 flex items-center gap-4"
                  style={{ backgroundColor: item.bg }}
                >
                  <div
                    className="w-10 h-10 flex items-center justify-center font-black text-base bg-black text-white shrink-0"
                    style={{ border: "2px solid #000000" }}
                  >
                    {item.num}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-base uppercase tracking-tight text-black">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-black/80">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SLIDE 4: SATELLITE TELEMETRY */}
        {currentSlide === 3 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="pulse-pill" style={{ backgroundColor: "#FFD152", color: "#000000" }}>
                03 // GEOSPATIAL INTELLIGENCE
              </span>
            </div>

            <h2 className="font-black text-3xl sm:text-5xl uppercase tracking-tight text-black">
              Sentinel-2 NDVI Spectral Cadastre
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left: Technology */}
              <div className="pulse-card p-6 sm:p-8 flex flex-col gap-4 bg-white">
                <div className="flex items-center gap-2 border-b-2 border-black pb-3">
                  <Satellite size={22} strokeWidth={2.5} />
                  <h3 className="font-black text-xl uppercase tracking-tight">
                    10-Meter Optical Resolution
                  </h3>
                </div>

                <div className="flex flex-col gap-3 text-sm font-medium text-black/80">
                  <p>
                    <strong>Multispectral Band Combination:</strong> Measures Near-Infrared (Band 8) and Red (Band 4) wavelengths every 5 days via European Space Agency orbiters.
                  </p>
                  <p>
                    <strong>Normalized Difference Vegetation Index:</strong> NDVI = (NIR - RED) / (NIR + RED). Values range from 0.0 to 1.0, directly correlating to photosynthetic chlorophyll mass.
                  </p>
                  <p>
                    <strong>Boundary Fraud Prevention:</strong> GPS cadastral polygons cross-reference RoR (Record of Rights) land records with actual tilled boundaries.
                  </p>
                </div>
              </div>

              {/* Right: Underwriting Matrix */}
              <div
                className="pulse-card p-6 sm:p-8 flex flex-col gap-4"
                style={{ backgroundColor: "#FFD152" }}
              >
                <h3 className="font-black text-xl uppercase tracking-tight border-b-2 border-black pb-3">
                  NDVI Underwriting Thresholds
                </h3>

                <div className="flex flex-col gap-3">
                  {[
                    { range: "NDVI > 0.65", status: "Optimal Dense Biomass", action: "Instant Sanction (90% LTV, 11.5% Rate)" },
                    { range: "NDVI 0.40 - 0.65", status: "Healthy Moderate Crop", action: "Standard Sanction (80% LTV, 12.2% Rate)" },
                    { range: "NDVI 0.20 - 0.40", status: "Vegetative Stress Detected", action: "Conditional: Requires Irrigation Audit" },
                    { range: "NDVI < 0.20", status: "Barren / Fallow / Crop Failure", action: "Refer to Emergency Restructuring" },
                  ].map((t) => (
                    <div
                      key={t.range}
                      className="p-3 bg-white"
                      style={{ border: "2px solid #000000", boxShadow: "2px 2px 0px #000000" }}
                    >
                      <div className="font-mono text-xs font-black text-black">{t.range}</div>
                      <div className="text-xs font-bold text-black/80">{t.status}</div>
                      <div className="text-xs font-mono font-bold text-[#FF6B6B] mt-0.5">{t.action}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 5: EXPLAINABLE AI SCORING */}
        {currentSlide === 4 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="pulse-pill" style={{ backgroundColor: "#FF6B6B", color: "#000000" }}>
                04 // ALTERNATIVE CREDIT SCORING
              </span>
            </div>

            <h2 className="font-black text-3xl sm:text-5xl uppercase tracking-tight text-black">
              Explainable AI & SHAP Decision Drivers
            </h2>

            <div className="grid sm:grid-cols-2 gap-6">
              {[
                {
                  factor: "CROP CANOPY VIGOR (NDVI)",
                  weight: "+35% CONTRIBUTION",
                  detail: "Live chlorophyll spectral density confirming active cultivation, soil moisture, and high biomass harvest yield.",
                  bg: "#FFD152",
                },
                {
                  factor: "PRECIPITATION ANOMALY",
                  weight: "+20% CONTRIBUTION",
                  detail: "Deviation against 10-year monsoon average and availability of perennial irrigation (canals, borewells).",
                  bg: "#FF6B6B",
                },
                {
                  factor: "MANDI MARKET ACCESS",
                  weight: "+15% CONTRIBUTION",
                  detail: "Proximity to regulated wholesale APMC mandis, historical price realizations, and multi-crop rotation track.",
                  bg: "#B8A9FF",
                },
                {
                  factor: "SOIL COMPLIANCE & HISTORICAL ROTATION",
                  weight: "+15% CONTRIBUTION",
                  detail: "Soil texture profile (black cotton, alluvial) and Kharif-Rabi-Zaid multi-cropping resilience.",
                  bg: "#FFFFFF",
                },
              ].map((f) => (
                <div
                  key={f.factor}
                  className="pulse-card p-6 sm:p-7 flex flex-col justify-between gap-3"
                  style={{ backgroundColor: f.bg }}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 font-mono text-[10px] font-black uppercase text-white bg-black">
                      {f.weight}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-lg sm:text-xl uppercase tracking-tight text-black mb-1.5">
                      {f.factor}
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-black/80 leading-relaxed">
                      {f.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="p-4 bg-white flex items-center justify-between gap-4"
              style={{ border: "3px solid #000000", boxShadow: "4px 4px 0px #000000" }}
            >
              <span className="font-mono text-xs font-black uppercase">
                SHAP EXPLAINABILITY SCORE: 100% REGULATORY COMPLIANT & TRANSPARENT
              </span>
              <span className="font-black text-sm text-[#FF6B6B]">
                AI SANCTION SPEED: &lt; 3 MINUTES
              </span>
            </div>
          </div>
        )}

        {/* SLIDE 6: HARVEST-ALIGNED EMIs */}
        {currentSlide === 5 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="pulse-pill" style={{ backgroundColor: "#FFD152", color: "#000000" }}>
                05 // CASH-FLOW INNOVATION
              </span>
            </div>

            <h2 className="font-black text-3xl sm:text-5xl uppercase tracking-tight text-black">
              Harvest-Aligned Dynamic Repayments
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Flawed Flat Model */}
              <div
                className="pulse-card p-6 sm:p-8 flex flex-col justify-between gap-4"
                style={{ backgroundColor: "#FF6B6B" }}
              >
                <div>
                  <div className="inline-block px-3 py-1 font-mono text-xs font-black text-white bg-black mb-3">
                    CONVENTIONAL BANKING (BROKEN)
                  </div>
                  <h3 className="font-black text-2xl uppercase tracking-tight text-white mb-4">
                    Flat ₹12,500/Mo EMI
                  </h3>
                  <div className="flex flex-col gap-2.5 text-sm font-bold text-white/90">
                    <p>❌ Zero liquidity during sowing causes default in July</p>
                    <p>❌ Forces farmers into local moneylender debt traps</p>
                    <p>❌ High repossession conflict & NPA provisions</p>
                    <p>❌ Ignores agricultural biology and season cash flow</p>
                  </div>
                </div>

                <div className="p-3 bg-black text-white font-mono text-xs font-black text-center">
                  RESULT: 18.4% DELINQUENCY RATE
                </div>
              </div>

              {/* TVS Model */}
              <div
                className="pulse-card p-6 sm:p-8 flex flex-col justify-between gap-4"
                style={{ backgroundColor: "#FFD152" }}
              >
                <div>
                  <div className="inline-block px-3 py-1 font-mono text-xs font-black text-white bg-black mb-3">
                    TVS CREDIT INNOVATION (AI-POWERED)
                  </div>
                  <h3 className="font-black text-2xl uppercase tracking-tight text-black mb-4">
                    Crop-Synchronized Cash Flow
                  </h3>
                  <div className="flex flex-col gap-2.5 text-sm font-bold text-black">
                    <p>✅ Sowing Season (Jun-Aug): ₹800/mo token interest only</p>
                    <p>✅ Growing Season (Sep): ₹1,200/mo low-load payment</p>
                    <p>✅ Post-Harvest (Oct/Nov): ₹68,000 bullet payment at Mandi sale</p>
                    <p>✅ Rabi Sowing (Dec-Feb): ₹1,000/mo liquidity cushion</p>
                  </div>
                </div>

                <div className="p-3 bg-black text-[#FFD152] font-mono text-xs font-black text-center">
                  RESULT: 42% DROP IN 90-DAY DEFAULTS
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 7: EARLY WARNING RADAR */}
        {currentSlide === 6 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="pulse-pill" style={{ backgroundColor: "#FF6B6B", color: "#000000" }}>
                06 // REAL-TIME RISK MITIGATION
              </span>
            </div>

            <h2 className="font-black text-3xl sm:text-5xl uppercase tracking-tight text-black">
              Portfolio Early Warning Radar
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  district: "YAVATMAL, MAHARASHTRA",
                  sev: "HIGH SEVERITY",
                  loans: "1,420 Active Loans (₹180L)",
                  alert: "Rainfall 34% below 10-year average. Soybean moisture stress detected by Sentinel-2.",
                  action: "Automated 60-day EMI extension & farmer SMS dispatch.",
                  bg: "#FF6B6B",
                },
                {
                  district: "BATHINDA, PUNJAB",
                  sev: "HIGH SEVERITY",
                  loans: "890 Active Loans (₹145L)",
                  alert: "Pink bollworm pest infestation and cotton mandi price crash (-22%).",
                  action: "Dynamic restructure to Rabi wheat bullet harvest cycle.",
                  bg: "#FFD152",
                },
                {
                  district: "THANJAVUR, TAMIL NADU",
                  sev: "MEDIUM SEVERITY",
                  loans: "1,150 Active Loans (₹190L)",
                  alert: "Kuruvai paddy harvest delay due to unseasonal coastal rains.",
                  action: "30-day grace period triggered with zero penalty fees.",
                  bg: "#B8A9FF",
                },
                {
                  district: "SEHORE, MADHYA PRADESH",
                  sev: "LOW SEVERITY",
                  loans: "650 Active Loans (₹95L)",
                  alert: "Optimal soybean canopy vigor (NDVI 0.72) and surplus monsoon rains.",
                  action: "Pre-approved tractor implement & solar pump credit extension.",
                  bg: "#FFFFFF",
                },
              ].map((d) => (
                <div
                  key={d.district}
                  className="pulse-card p-5 flex flex-col justify-between gap-3"
                  style={{ backgroundColor: d.bg }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm uppercase text-black">{d.district}</span>
                    <span className="px-2 py-0.5 font-mono text-[10px] font-black uppercase text-white bg-black">
                      {d.sev}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-black/85">
                    <p className="font-mono text-[11px] text-black/70 mb-1">{d.loans}</p>
                    <p className="mb-2">{d.alert}</p>
                    <div className="p-2 bg-white/70 border border-black font-mono text-[10px] text-black">
                      <strong>PROTOCOL:</strong> {d.action}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SLIDE 8: GENAI SAHAYAK */}
        {currentSlide === 7 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="pulse-pill" style={{ backgroundColor: "#B8A9FF", color: "#000000" }}>
                07 // CONVERSATIONAL AI
              </span>
            </div>

            <h2 className="font-black text-3xl sm:text-5xl uppercase tracking-tight text-black">
              TVS Sahayak — Vernacular Loan Copilot
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="pulse-card p-6 sm:p-8 flex flex-col justify-between gap-4 bg-white">
                <div>
                  <div className="flex items-center gap-2 border-b-2 border-black pb-3 mb-4">
                    <Bot size={24} strokeWidth={2.5} />
                    <h3 className="font-black text-xl uppercase tracking-tight">
                      Multilingual Voice & Chat
                    </h3>
                  </div>

                  <div className="flex flex-col gap-3 text-sm font-medium text-black/85">
                    <p>
                      <strong>Vernacular Speech-to-Text:</strong> Supports Hindi, Marathi, Tamil, Punjabi, Telugu & English for low-literacy farmers.
                    </p>
                    <p>
                      <strong>Explainable Transparency:</strong> Breaks down complex satellite NDVI scores and interest terms into relatable crop analogies.
                    </p>
                    <p>
                      <strong>Zero Exploitation:</strong> Protects borrowers against local middlemen markups and explains exact government subsidy tie-ups.
                    </p>
                  </div>
                </div>

                <Link
                  href="/assistant"
                  className="pulse-btn px-4 py-3 text-xs gap-1.5 self-start"
                  style={{ backgroundColor: "#FFD152", color: "#000000" }}
                >
                  TRY LIVE SAHAYAK COPILOT →
                </Link>
              </div>

              {/* Sample Dialog */}
              <div
                className="pulse-card p-6 sm:p-8 flex flex-col gap-4"
                style={{ backgroundColor: "#FFD152" }}
              >
                <h3 className="font-black text-lg uppercase tracking-tight border-b-2 border-black pb-2">
                  Sample Farmer Interaction
                </h3>

                <div className="flex flex-col gap-3">
                  <div className="p-3 bg-white border-2 border-black text-xs font-bold">
                    <div className="font-mono text-[10px] text-black/60 uppercase mb-1">
                      👤 Ramesh Patil (Farmer // Hindi Audio)
                    </div>
                    &quot;भैया, 45 HP का ट्रैक्टर लेना है, मेरी 6 एकड़ कपास है। बिना जमीन के कागज के लोन मिलेगा?&quot;
                  </div>

                  <div className="p-3 bg-black text-white border-2 border-black text-xs font-bold">
                    <div className="font-mono text-[10px] text-[#FFD152] uppercase mb-1">
                      🤖 TVS Sahayak (Vernacular AI)
                    </div>
                    &quot;नमस्ते रमेश जी! सैटेलाइट से आपका खेत देखा — फसल हरी और स्वस्थ है (NDVI 0.68)। आपको ₹4.5 लाख का ट्रैक्टर लोन मंजूर है! बुआई के दौरान किश्त सिर्फ ₹800 लगेगी, बाकी फसल बिकने पर!&quot;
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 9: BUSINESS IMPACT */}
        {currentSlide === 8 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="pulse-pill" style={{ backgroundColor: "#FFD152", color: "#000000" }}>
                08 // QUANTIFIED PERFORMANCE
              </span>
            </div>

            <h2 className="font-black text-3xl sm:text-5xl uppercase tracking-tight text-black">
              Business Impact & Quantified ROI
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {[
                { val: "< 3 MIN", label: "SANCTION TURNAROUND", sub: "Reduced from 14-21 days of manual physical inspections.", bg: "#FFD152" },
                { val: "38% DROP", label: "UNDERWRITING CAC", sub: "Eliminated manual survey travel with satellite cadastral scans.", bg: "#FF6B6B" },
                { val: "42% LESS", label: "90-DAY DELINQUENCY", sub: "Harvest-aligned EMIs prevent artificial defaults during sowing.", bg: "#B8A9FF" },
                { val: "90% LTV", label: "MAX FINANCING RATIO", sub: "Up from 70% industry average due to satellite yield certainty.", bg: "#FFFFFF" },
                { val: "26M+", label: "RURAL CUSTOMERS", sub: "Empowered across Tier 3/4 towns and agricultural heartlands.", bg: "#FFD152" },
                { val: "AA+", label: "CRISIL STABILITY", sub: "Highest industry stability driven by diversified crop portfolio risk.", bg: "#FFFFFF" },
              ].map((m) => (
                <div
                  key={m.label}
                  className="pulse-card p-6 flex flex-col justify-between gap-2 text-black"
                  style={{ backgroundColor: m.bg }}
                >
                  <div className="font-black text-3xl sm:text-4xl leading-none">{m.val}</div>
                  <div>
                    <div className="font-mono text-xs font-black uppercase mt-1">{m.label}</div>
                    <div className="text-xs font-medium text-black/75 mt-0.5">{m.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SLIDE 10: FUTURE ROADMAP */}
        {currentSlide === 9 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="pulse-pill" style={{ backgroundColor: "#FF6B6B", color: "#000000" }}>
                09 // STRATEGIC HORIZON
              </span>
            </div>

            <h2 className="font-black text-3xl sm:text-5xl uppercase tracking-tight text-black">
              The Future Roadmap: Empowering Rural India
            </h2>

            <div className="flex flex-col gap-3">
              {[
                {
                  phase: "PHASE 1: NATIONWIDE SATELLITE EXPANSION",
                  desc: "Extend Sentinel-2 & SAR radar coverage to 150+ agro-climatic zones across Maharashtra, Punjab, Tamil Nadu, MP, UP & Rajasthan.",
                  bg: "#FFFFFF",
                },
                {
                  phase: "PHASE 2: IOT & SOIL SENSOR SYNDICATION",
                  desc: "Direct integration with private farm IoT soil-moisture probes and automated e-NAM digital mandis for real-time price hedging.",
                  bg: "#FFD152",
                },
                {
                  phase: "PHASE 3: SUSTAINABLE GREEN AGRI-FINANCE",
                  desc: "0% interest subsidized credit tiers for solar pumps, micro-drip irrigation, and residue management machinery.",
                  bg: "#FF6B6B",
                },
                {
                  phase: "PHASE 4: ONDC & VALUE CHAIN INTEGRATION",
                  desc: "Direct disbursals to fertilizer dealers, seed distributors, and cold storages via TVS Agri-Wallet.",
                  bg: "#B8A9FF",
                },
              ].map((r) => (
                <div
                  key={r.phase}
                  className="pulse-card p-5 flex items-center gap-4"
                  style={{ backgroundColor: r.bg }}
                >
                  <div className="font-black text-xl text-black shrink-0">★</div>
                  <div>
                    <h3 className="font-black text-base uppercase tracking-tight text-black">
                      {r.phase}
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-black/80">
                      {r.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="p-6 bg-black text-white flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{ border: "3px solid #000000", boxShadow: "5px 5px 0px #FFD152" }}
            >
              <div>
                <div className="font-mono text-xs text-[#FFD152] font-black uppercase">
                  TVS CREDIT — EMPOWERING INDIA. ONE INDIAN AT A TIME.
                </div>
                <div className="font-black text-xl sm:text-2xl uppercase tracking-tight mt-1">
                  Ready to demo the live working hub?
                </div>
              </div>

              <Link
                href="/apply"
                className="pulse-btn px-6 py-3.5 text-sm gap-2 whitespace-nowrap"
                style={{ backgroundColor: "#FFD152", color: "#000000" }}
              >
                TEST LIVE LOAN FLOW →
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* === BOTTOM SLIDE NAVIGATION CONTROLS === */}
      <footer
        className="px-4 sm:px-8 py-4 bg-white flex items-center justify-between select-none"
        style={{ borderTop: "3px solid #000000" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={`pulse-btn px-4 py-2 text-xs gap-1 ${
              currentSlide === 0 ? "opacity-30 cursor-not-allowed" : ""
            }`}
            style={{ backgroundColor: "#FFFFFF", color: "#000000" }}
          >
            <ChevronLeft size={16} strokeWidth={3} /> PREVIOUS
          </button>

          <button
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1}
            className={`pulse-btn px-4 py-2 text-xs gap-1 ${
              currentSlide === totalSlides - 1 ? "opacity-30 cursor-not-allowed" : ""
            }`}
            style={{ backgroundColor: "#FFD152", color: "#000000" }}
          >
            NEXT <ChevronRight size={16} strokeWidth={3} />
          </button>
        </div>

        <div className="font-mono text-xs font-black text-black">
          SLIDE <span className="text-[#FF6B6B] font-black">{currentSlide + 1}</span> / {totalSlides}
        </div>

        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-black/60">
          <span>Keyboard: Use <strong>←</strong> / <strong>→</strong> or <strong>Space</strong></span>
        </div>
      </footer>
    </div>
  );
}
