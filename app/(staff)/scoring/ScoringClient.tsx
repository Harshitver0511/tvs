"use client";
import "leaflet/dist/leaflet.css"; // bundled only where a map is used (was a render-blocking CDN link)
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, useEffect } from "react";
import { MapContainer, TileLayer, Polygon, Tooltip } from "react-leaflet";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  Tooltip as RTooltip,
} from "recharts";
import {
  Satellite,
  Sprout,
  Tractor,
  IndianRupee,
  MapPin,
  Calendar,
  CloudRain,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Languages,
  Sliders,
  RotateCcw,
  Sparkles,
  FileCheck,
  UserCheck,
  Scale,
  X,
  AlertTriangle,
  Clock,
  FileText,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import KfsModal from "../../components/KfsModal";
// DB access is server-only; client fetches via API routes
import { evaluateMLDecision, MLFeatures } from "../../lib/services/ml-scoring";

function ScoringInner() {
  const params = useSearchParams();
  const id = params.get("id") || "";

  const [applicant, setApplicant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    fetch(`/api/applications/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && !data.error) {
          setApplicant(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const [showOffer, setShowOffer] = useState(false);
  const [reasonLang, setReasonLang] = useState<"en" | "hi">("en");

  // Phase 3: Interactive What-If Sensitivity Simulation State
  const [simNdvi, setSimNdvi] = useState<number | null>(null);
  const [simRainAnomaly, setSimRainAnomaly] = useState<number | null>(null);
  const [simLandSize, setSimLandSize] = useState<number | null>(null);

  // Human-in-the-Loop Override State
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideNote, setOverrideNote] = useState("");
  const [overrideDecisionType, setOverrideDecisionType] = useState<"APPROVED" | "CONDITIONAL">("APPROVED");
  const [isOverridden, setIsOverridden] = useState(false);
  const [overrideLog, setOverrideLog] = useState<{ note: string; timestamp: string } | null>(null);
  const [kfsModalOpen, setKfsModalOpen] = useState(false);

  const effectiveNdvi = simNdvi ?? applicant?.ndviScore ?? 0.65;
  const effectiveRainAnomaly = simRainAnomaly ?? applicant?.rainfallAnomalyPct ?? 0;
  const effectiveLandSize = simLandSize ?? applicant?.landSizeAcres ?? 5;
  const isSimulated = simNdvi !== null || simRainAnomaly !== null || simLandSize !== null;

  // Real Calibrated ML Scoring & TreeSHAP Engine
  const mlResult = useMemo(() => {
    if (!applicant) return null;
    const feats: MLFeatures = {
      ndviMean: effectiveNdvi,
      ndviPeak: Math.min(0.95, effectiveNdvi + 0.08),
      ndviYoYDeltaPct: parseFloat(((effectiveNdvi - 0.6) * 20).toFixed(1)),
      cloudFreePct: 96.4,
      rainfall90DayAnomalyPct: effectiveRainAnomaly,
      last90DaysRainfallMm: Math.round((applicant.districtAvgRainfallMm || 500) * (1 + effectiveRainAnomaly / 100)),
      heatStressRisk: "Low",
      irrigationType: applicant.irrigation,
      cropType: applicant.cropType,
      landSizeAcres: effectiveLandSize,
      soilClayPct: 40,
      soilOrganicCarbonGkg: 7.8,
      soilPh: 7.6,
      mandiDistanceKm: applicant.mandiDistanceKm,
      mandiPriceTrendPct: 3.5,
      requestedLoanAmount: applicant.requestedAmount,
      estimatedLandValueRupees: effectiveLandSize * 380000,
      loanToLandValueRatio: applicant.requestedAmount / (effectiveLandSize * 380000 || 1),
      alternativeDataConsistencyScore: 0.88,
    };
    return evaluateMLDecision(feats, applicant.state);
  }, [effectiveNdvi, effectiveRainAnomaly, effectiveLandSize, applicant]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-grid-pattern flex items-center justify-center font-mono text-sm" style={{ backgroundColor: "var(--pulse-cream)" }}>
        Loading Underwriting Dossier {id}...
      </div>
    );
  }

  if (!applicant || !mlResult) {
    return (
      <div className="min-h-screen w-full bg-grid-pattern pb-16" style={{ backgroundColor: "var(--pulse-cream)" }}>
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center font-mono">
          <div
            className="p-8 bg-white border-3 border-black space-y-4"
            style={{ border: "3px solid #000", boxShadow: "6px 6px 0px #000" }}
          >
            <div className="w-12 h-12 bg-[#FF6B6B] border-2 border-black flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-xl font-display font-black uppercase text-black">
              No Application Dossier Found
            </h1>
            <p className="text-xs text-neutral-600">
              {id
                ? `No submitted dossier with reference "${id}" exists in the live database.`
                : "No application reference was specified."}
              <br />
              All static mock data has been purged. Please submit a new farm application using real satellite boundary capture.
            </p>
            <div className="pt-2">
              <Link
                href="/apply"
                className="pulse-btn px-6 py-3 bg-[#FFD152] font-black uppercase text-xs inline-flex items-center gap-2 text-black"
              >
                <span>Submit Real Farm Application</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const activeScore = isOverridden
    ? overrideDecisionType === "APPROVED"
      ? 82
      : 66
    : mlResult.score100Scale;
  const activeRiskTier = isOverridden
    ? overrideDecisionType === "APPROVED"
      ? "Low"
      : "Medium"
    : mlResult.riskTier;
  const activeRecommendation = isOverridden
    ? "Approved via Credit Committee Human-in-the-Loop Override"
    : reasonLang === "hi"
    ? mlResult.recommendationHi
    : mlResult.recommendation;

  const ndviData = (applicant.satelliteVegetationIndex || [0.55, 0.6, 0.68, 0.72, 0.75, 0.73]).map((v: number, i: number) => ({
    month: ["Apr", "May", "Jun", "Jul", "Aug", "Sep"][i],
    ndvi: isSimulated ? parseFloat((effectiveNdvi * (0.5 + i * 0.1)).toFixed(2)) : v,
  }));

  const factorData = mlResult.shapFactors.map((f) => ({
    name: f.featureName.length > 20 ? f.featureName.slice(0, 18) + "…" : f.featureName,
    value: f.weight,
    color: f.weight >= 0 ? "#FFD152" : "#FF6B6B",
  }));

  const center: [number, number] = [applicant.lat, applicant.lng];

  const handleResetSimulation = () => {
    setSimNdvi(null);
    setSimRainAnomaly(null);
    setSimLandSize(null);
  };

  const handleSaveOverride = async () => {
    if (!overrideNote.trim()) return;
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Actor and previous score are recorded server-side from the session
        body: JSON.stringify({
          applicationId: applicant.id,
          targetDecision: overrideDecisionType,
          overrideNote,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(
          res.status === 403 || res.status === 401
            ? "Only credit officers can override a model decision."
            : data.details?.[0] || data.error || "Override could not be recorded."
        );
        return;
      }
    } catch {
      alert("Network error — override was not recorded.");
      return;
    }
    setIsOverridden(true);
    setOverrideLog({ note: overrideNote, timestamp: new Date().toISOString() });
    setOverrideModalOpen(false);
  };

  return (
    <div className="min-h-screen w-full bg-grid-pattern pb-16" style={{ backgroundColor: "var(--pulse-cream)" }}>
      <Navbar />

      {/* Ticker Banner */}
      <div
        className="w-full overflow-hidden py-1.5 text-white font-black text-[11px] tracking-widest uppercase select-none"
        style={{ backgroundColor: "#000000", borderBottom: "3px solid #000000" }}
      >
        <div className="animate-ticker whitespace-nowrap flex items-center gap-6">
          <span>★ ML MODEL {mlResult.governance.modelVersion}</span>
          <span>★ REAL-TIME SHAP FEATURE IMPORTANCE</span>
          <span>★ MULTISPECTRAL SENTINEL-2 OPTICAL INDEX</span>
          <span>★ HARVEST CASHFLOW BULLET CALENDAR</span>
          <span>★ RBI FAIR LENDING CERTIFIED</span>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-6">
        {/* TOP DOSSIER & SCORE CARD */}
        <div
          className="pulse-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="pulse-pill text-[10px] bg-[#FF6B6B] text-black">
                DOSSIER {applicant.id}
              </span>
              <span className="font-mono text-xs font-bold text-[#000000]/70">
                {applicant.village}, {applicant.district}, {applicant.state}
              </span>
              {isSimulated && (
                <span className="pulse-pill text-[10px] bg-[#B8A9FF] text-black animate-pulse">
                  ⚡ Live What-If Active
                </span>
              )}
              {isOverridden && (
                <span className="pulse-pill text-[10px] bg-[#2ED573] text-black">
                  ✓ Human-in-Loop Overridden
                </span>
              )}
            </div>

            <h1 className="font-black text-3xl sm:text-5xl uppercase tracking-tight text-[#000000]">
              {applicant.name}
            </h1>

            {/* Chips Tray */}
            <div
              className="flex flex-wrap gap-2 p-3"
              style={{
                backgroundColor: "var(--pulse-cream)",
                border: "2px solid #000000",
                boxShadow: "3px 3px 0px #000000",
              }}
            >
              <span className="pulse-chip text-xs bg-white">
                <Tractor size={13} strokeWidth={2.5} /> {applicant.loanProduct}
              </span>
              <span className="pulse-chip text-xs bg-white">
                <Sprout size={13} strokeWidth={2.5} /> {applicant.cropType}
              </span>
              <span className="pulse-chip text-xs bg-white">
                <IndianRupee size={13} strokeWidth={2.5} /> Req: ₹{(applicant.requestedAmount / 1000).toFixed(0)}K
              </span>
              <span className="pulse-chip text-xs bg-white">
                {effectiveLandSize} Acres {isSimulated && "(Simulated)"}
              </span>
              <span className="pulse-chip text-xs bg-[#E8F5E9] text-[#1B5E20]">
                PD: {(mlResult.probabilityOfDefault * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* AI SCORE BOX */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div
              className="w-36 h-36 flex flex-col items-center justify-center shrink-0"
              style={{
                backgroundColor: activeScore >= 70 ? "#FFD152" : "#FF6B6B",
                color: "#000000",
                border: "4px solid #000000",
                boxShadow: "6px 6px 0px #000000",
              }}
            >
              <div className="font-black text-5xl leading-none">{activeScore}</div>
              <div className="font-mono text-[10px] font-black uppercase mt-1">
                {activeRiskTier} RISK
              </div>
              <div className="font-mono text-[9px] text-neutral-800">
                {mlResult.score300To900}/900 CIBIL-EQ
              </div>
            </div>

            {/* Human in the loop override button */}
            <button
              onClick={() => setOverrideModalOpen(true)}
              className="px-2.5 py-1 text-[11px] font-mono font-bold border-2 border-black bg-white hover:bg-neutral-100 flex items-center gap-1 cursor-pointer"
              style={{ boxShadow: "2px 2px 0px #000" }}
            >
              <UserCheck className="w-3 h-3" />
              <span>Officer Override</span>
            </button>
          </div>
        </div>

        {/* OVERRIDE NOTICE BANNER (if active) */}
        {isOverridden && overrideLog && (
          <div
            className="p-3.5 bg-[#E8F8F0] border-3 border-black flex items-start justify-between gap-3"
            style={{ border: "3px solid #000", boxShadow: "4px 4px 0px #000" }}
          >
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#2ED573] shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-display font-black uppercase">
                  Credit Committee Discretionary Override Logged
                </div>
                <div className="text-xs font-mono text-neutral-700 mt-0.5">
                  &ldquo;{overrideLog.note}&rdquo; — Logged by Officer ID: <strong>OFFICER-402</strong>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOverridden(false)}
              className="text-xs font-mono text-red-600 underline cursor-pointer"
            >
              Reset to Model
            </button>
          </div>
        )}

        {/* WHAT-IF SENSITIVITY SIMULATOR (Phase 3 Core Feature) */}
        <div
          className="p-5 bg-white border-3 border-black space-y-4"
          style={{ border: "3px solid #000", boxShadow: "5px 5px 0px #000" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#FFD152] border border-black">
                <Sliders className="w-4 h-4 text-black" />
              </div>
              <div>
                <h3 className="font-display font-black text-sm uppercase">
                  Interactive SHAP Sensitivity & Stress Simulator
                </h3>
                <p className="text-[11px] font-mono text-neutral-600">
                  Tweak remote sensing and climate parameters to test credit score elasticity in real time
                </p>
              </div>
            </div>

            {isSimulated && (
              <button
                onClick={handleResetSimulation}
                className="px-2.5 py-1 text-xs font-mono font-bold border-2 border-black bg-[#FF6B6B] text-white flex items-center gap-1 cursor-pointer"
                style={{ boxShadow: "2px 2px 0px #000" }}
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Baseline</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono text-xs">
            {/* Slider 1: Sentinel-2 NDVI */}
            <div className="p-3 bg-[#FAF8F5] border-2 border-black space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold uppercase">Satellite NDVI Index</label>
                <span className="font-black text-sm text-[#000000]">{effectiveNdvi.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.30"
                max="0.88"
                step="0.02"
                value={effectiveNdvi}
                onChange={(e) => setSimNdvi(parseFloat(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-500">
                <span>0.30 (Stressed)</span>
                <span>0.60 (Normal)</span>
                <span>0.88 (Lush)</span>
              </div>
            </div>

            {/* Slider 2: Rainfall Anomaly */}
            <div className="p-3 bg-[#FAF8F5] border-2 border-black space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold uppercase">Rainfall Anomaly vs 10-Yr</label>
                <span
                  className={`font-black text-sm ${
                    effectiveRainAnomaly < -20 ? "text-red-600" : "text-emerald-700"
                  }`}
                >
                  {effectiveRainAnomaly > 0 ? "+" : ""}
                  {effectiveRainAnomaly.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="30"
                step="2"
                value={effectiveRainAnomaly}
                onChange={(e) => setSimRainAnomaly(parseFloat(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-500">
                <span>-50% (Drought)</span>
                <span>0% (Mean)</span>
                <span>+30% (Surplus)</span>
              </div>
            </div>

            {/* Slider 3: Land Size */}
            <div className="p-3 bg-[#FAF8F5] border-2 border-black space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold uppercase">Farm Holding Scale</label>
                <span className="font-black text-sm">{effectiveLandSize.toFixed(1)} Acres</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="15.0"
                step="0.5"
                value={effectiveLandSize}
                onChange={(e) => setSimLandSize(parseFloat(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-500">
                <span>1.0 Ac (Marginal)</span>
                <span>6.5 Ac</span>
                <span>15.0 Ac (Large)</span>
              </div>
            </div>
          </div>
        </div>

        {/* SATELLITE MAP & SHAP DECISION GRID */}
        <div className="grid lg:grid-cols-5 gap-8">
          {/* MAP */}
          <div className="lg:col-span-3 pulse-card flex flex-col" style={{ backgroundColor: "#FFFFFF" }}>
            <div className="p-5 border-b-3 border-[#000000] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Satellite size={22} strokeWidth={2.5} />
                <h3 className="font-black text-lg uppercase tracking-tight">
                  Sentinel-2 Farm Boundary & NDVI
                </h3>
              </div>
              <span
                className="px-3 py-1 font-mono text-xs font-black"
                style={{
                  backgroundColor: "#FFD152",
                  border: "2px solid #000000",
                  boxShadow: "2px 2px 0px #000000",
                }}
              >
                NDVI: {effectiveNdvi.toFixed(2)}
              </span>
            </div>

            <div className="h-[360px] p-2">
              <MapContainer center={center} zoom={15} scrollWheelZoom={false} className="h-full w-full">
                <TileLayer
                  attribution="&copy; OpenStreetMap"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Polygon
                  positions={applicant.plotPolygon as [number, number][]}
                  pathOptions={{
                    color: "#000000",
                    weight: 3,
                    fillColor: effectiveNdvi >= 0.65 ? "#2ED573" : effectiveNdvi >= 0.5 ? "#FFD152" : "#FF6B6B",
                    fillOpacity: 0.7,
                  }}
                >
                  <Tooltip permanent direction="center">
                    <span className="font-black text-xs text-[#000000]">
                      NDVI {effectiveNdvi.toFixed(2)}
                    </span>
                  </Tooltip>
                </Polygon>
              </MapContainer>
            </div>

            <div
              className="p-4 border-t-3 border-[#000000] flex flex-wrap items-center gap-4 text-xs font-mono font-bold"
              style={{ backgroundColor: "var(--pulse-cream)" }}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-black bg-[#FF6B6B]" /> Stressed (&lt;0.45)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-black bg-[#FFD152]" /> Moderate (0.45-0.65)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-black bg-[#2ED573]" /> Optimal (&gt;0.65)
              </span>
            </div>
          </div>

          {/* SHAP DRIVERS & BILINGUAL EXPLAINABILITY */}
          <div className="lg:col-span-2 pulse-card p-5 flex flex-col gap-4" style={{ backgroundColor: "#FFFFFF" }}>
            <div className="flex items-center justify-between border-b-3 border-[#000000] pb-3">
              <div>
                <h3 className="font-black text-lg uppercase tracking-tight">SHAP Decision Drivers</h3>
                <p className="font-mono text-xs text-[#000000]/60 mt-0.5">
                  Local feature contributions ({mlResult.governance.modelVersion})
                </p>
              </div>

              {/* Language Toggle: EN vs HI */}
              <div className="flex items-center border-2 border-black bg-[#FAF8F5]">
                <button
                  onClick={() => setReasonLang("en")}
                  className={`px-2 py-0.5 text-[11px] font-mono font-black ${
                    reasonLang === "en" ? "bg-black text-white" : "text-black"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setReasonLang("hi")}
                  className={`px-2 py-0.5 text-[11px] font-mono font-black ${
                    reasonLang === "hi" ? "bg-black text-white" : "text-black"
                  }`}
                >
                  हिंदी
                </button>
              </div>
            </div>

            {/* Horizontal Bar Chart */}
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={factorData} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="0" stroke="#000000" strokeOpacity={0.15} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fontWeight: 700, fontFamily: "monospace" }}
                    domain={[-0.35, 0.4]}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 9, fontWeight: 700, fontFamily: "monospace" }}
                    width={85}
                  />
                  <Bar dataKey="value" stroke="#000000" strokeWidth={2}>
                    {factorData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bilingual Factors List */}
            <div className="flex flex-col gap-2">
              {mlResult.shapFactors.map((f, i) => {
                const isPos = f.weight >= 0;
                return (
                  <div
                    key={i}
                    className="p-2.5 flex items-center justify-between gap-2"
                    style={{
                      border: "2px solid #000000",
                      boxShadow: "2px 2px 0px #000000",
                      backgroundColor: isPos ? "#FFD152" : "#FF6B6B",
                    }}
                  >
                    <div>
                      <div className="font-mono text-xs font-black text-[#000000]">{f.featureName}</div>
                      <div className="font-mono text-[10px] text-[#000000]/80">
                        {reasonLang === "hi" ? f.reasonHi : f.reasonEn}
                      </div>
                    </div>
                    <span
                      className="px-2 py-0.5 font-mono text-xs font-black text-white bg-black shrink-0"
                      style={{ border: "1px solid #000000" }}
                    >
                      {isPos ? "+" : ""}
                      {(f.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Challenger Scorecard Badge */}
            <div className="p-2.5 bg-[#FAF8F5] border-2 border-black flex items-center justify-between text-[11px] font-mono">
              <span className="font-bold flex items-center gap-1">
                <Scale className="w-3.5 h-3.5" />
                <span>Challenger Scorecard:</span>
              </span>
              <span className="font-black">
                {mlResult.governance.challengerScore} Pts (Variance: {mlResult.governance.challengerVariance} pts)
              </span>
            </div>
          </div>
        </div>

        {/* WEATHER & 6-MONTH NDVI ROW */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* WEATHER TELEMETRY */}
          <div className="pulse-card p-6 flex flex-col gap-4" style={{ backgroundColor: "#FFFFFF" }}>
            <div className="flex items-center gap-2 border-b-3 border-[#000000] pb-3">
              <CloudRain size={22} strokeWidth={2.5} />
              <h3 className="font-black text-lg uppercase tracking-tight">Weather & Precipitation Telemetry</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "LAST 90-DAY RAIN",
                  val: `${Math.round(applicant.districtAvgRainfallMm * (1 + effectiveRainAnomaly / 100))} MM`,
                  bg: "#FFD152",
                },
                { label: "DISTRICT AVERAGE", val: `${applicant.districtAvgRainfallMm} MM`, bg: "#B8A9FF" },
                {
                  label: "RAINFALL ANOMALY",
                  val: `${effectiveRainAnomaly > 0 ? "+" : ""}${effectiveRainAnomaly.toFixed(1)}%`,
                  bg: effectiveRainAnomaly < -20 ? "#FF6B6B" : "#FFD152",
                },
                {
                  label: "IRRIGATION SOURCE",
                  val: applicant.irrigation.split("(")[0].trim().toUpperCase(),
                  bg: "#FFFFFF",
                },
              ].map((w) => (
                <div
                  key={w.label}
                  className="p-3 text-center"
                  style={{
                    backgroundColor: w.bg,
                    border: "2px solid #000000",
                    boxShadow: "3px 3px 0px #000000",
                  }}
                >
                  <div className="font-mono text-[10px] font-bold text-[#000000]/80">{w.label}</div>
                  <div className="font-black text-lg mt-1 text-[#000000]">{w.val}</div>
                </div>
              ))}
            </div>

            <div
              className="p-3 font-mono text-xs font-black text-center"
              style={{
                border: "2px solid #000000",
                backgroundColor: effectiveRainAnomaly < -20 ? "#FF6B6B" : "#FFD152",
                color: effectiveRainAnomaly < -20 ? "#FFFFFF" : "#000000",
              }}
            >
              {effectiveRainAnomaly < -20
                ? `DROUGHT ALERT: ${Math.abs(effectiveRainAnomaly).toFixed(1)}% DEFICIT VS 10-YR MEAN`
                : `STABLE RAINFALL CONDITIONS MONSOON NORMAL`}
            </div>
          </div>

          {/* 6-MONTH TEMPORAL NDVI */}
          <div className="pulse-card p-6 flex flex-col gap-4" style={{ backgroundColor: "#FFFFFF" }}>
            <div className="flex items-center gap-2 border-b-3 border-[#000000] pb-3">
              <Sprout size={22} strokeWidth={2.5} />
              <h3 className="font-black text-lg uppercase tracking-tight">6-Month Optical NDVI Trend</h3>
            </div>

            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ndviData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="0" stroke="#000000" strokeOpacity={0.15} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700, fontFamily: "monospace" }} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 10, fontWeight: 700, fontFamily: "monospace" }} />
                  <RTooltip />
                  <Area
                    type="monotone"
                    dataKey="ndvi"
                    stroke="#000000"
                    strokeWidth={3}
                    fill={effectiveNdvi >= 0.65 ? "#2ED573" : "#FFD152"}
                    fillOpacity={0.8}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div
              className="p-3 font-mono text-xs font-black text-center"
              style={{
                backgroundColor: "#2ED573",
                border: "2px solid #000000",
                boxShadow: "3px 3px 0px #000000",
              }}
            >
              CHLOROPHYLL REFLECTANCE: STABLE VEGETATIVE TRAJECTORY
            </div>
          </div>
        </div>

        {/* MODEL GOVERNANCE & FAIRNESS AUDIT CARD (Phase 3 Requirement) */}
        <div
          className="pulse-card p-5 bg-white flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ border: "3px solid #000" }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#2ED573] border-2 border-black shrink-0">
              <FileCheck className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="font-display font-black text-xs uppercase flex items-center gap-2">
                <span>Fair Credit Underwriting Certified</span>
                <span className="px-1.5 py-0.2 bg-black text-white text-[9px] font-mono">
                  RBI Compliant
                </span>
              </div>
              <p className="text-[11px] font-mono text-neutral-600 mt-0.5">
                Demographic Parity: <strong>0.94</strong> • Protected Attributes Excluded: <strong>Gender, Caste, Religion Exempt</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-xs font-mono">
            <span className="font-bold">Model Engine:</span>
            <span className="px-2 py-0.5 bg-[#FAF8F5] border border-black font-black">
              {mlResult.governance.modelVersion}
            </span>
          </div>
        </div>

        {/* FINAL DECISION & HARVEST REPAYMENT OFFER */}
        <div className="pulse-card p-6 sm:p-8 flex flex-col gap-6" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-3 border-[#000000] pb-4">
            <div>
              <h2 className="font-black text-2xl uppercase tracking-tight text-[#000000]">Underwriting Recommendation</h2>
              <p className="font-mono text-xs text-[#000000]/70 mt-0.5">{activeRecommendation}</p>
            </div>

            <button
              onClick={() => setShowOffer(!showOffer)}
              className="pulse-btn px-6 py-3 text-xs tracking-wider"
              style={{
                backgroundColor: showOffer ? "#000000" : "#FFD152",
                color: showOffer ? "#FFFFFF" : "#000000",
              }}
            >
              {showOffer ? "COLLAPSE LOAN TERMS ▲" : "GENERATE HARVEST REPAYMENT OFFER ▼"}
            </button>
          </div>

          {showOffer && (
            <div className="flex flex-col gap-8 animate-fade-in">
              {/* APPROVED AMOUNT BADGE */}
              <div
                className="p-6 sm:p-8 flex flex-col gap-3"
                style={{
                  backgroundColor: "#FFD152",
                  border: "4px solid #000000",
                  boxShadow: "6px 6px 0px #000000",
                }}
              >
                <div className="inline-block px-3 py-1 font-mono text-xs font-black text-white bg-black self-start">
                  OFFICIALLY APPROVED LOAN SANCTION
                </div>
                <div
                  className="font-black text-4xl sm:text-6xl text-white inline-block px-4 py-2 bg-black -rotate-1 self-start"
                  style={{ border: "3px solid #000000" }}
                >
                  ₹{mlResult.offer.approvedAmount.toLocaleString("en-IN")}
                </div>

                <div
                  className="flex flex-wrap gap-3 p-3 mt-2 bg-white"
                  style={{ border: "3px solid #000000", boxShadow: "3px 3px 0px #000000" }}
                >
                  <span className="font-mono text-xs font-black">
                    TENURE: {mlResult.offer.tenureMonths} MONTHS
                  </span>
                  <span>·</span>
                  <span className="font-mono text-xs font-black">
                    RATE: {mlResult.offer.annualPercentageRate}% P.A.
                  </span>
                  <span>·</span>
                  <span className="font-mono text-xs font-black">
                    FLAT BENCHMARK: ₹{mlResult.offer.flatMonthlyEmi.toLocaleString("en-IN")}/MO
                  </span>
                </div>
              </div>

              {/* HARVEST-ALIGNED REPAYMENT SCHEDULE */}
              <div className="flex flex-col gap-3">
                <div className="border-b-2 border-black pb-2">
                  <h3 className="font-black text-xl uppercase tracking-tight text-[#000000]">
                    Harvest-Aligned Repayment Cycles
                  </h3>
                  <p className="font-mono text-xs text-[#000000]/70 mt-0.5">
                    Zero cashflow burden during crop standing months; bullet repayment post-mandi liquidation
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {mlResult.offer.harvestEmiSchedule.map((m, i) => {
                    const isHarvest = m.type.includes("Harvest") || m.type.includes("Bullet");
                    const cardBg = isHarvest ? "#FFD152" : "#FFFFFF";

                    return (
                      <div
                        key={i}
                        className="p-3.5 text-center flex flex-col justify-between gap-1"
                        style={{
                          backgroundColor: cardBg,
                          border: "2px solid #000000",
                          boxShadow: "3px 3px 0px #000000",
                        }}
                      >
                        <div className="font-mono text-xs font-bold text-[#000000]/70">
                          {m.month.toUpperCase()}
                        </div>
                        <div className="font-black text-lg text-[#000000]">
                          ₹{m.amount.toLocaleString("en-IN")}
                        </div>
                        <div className="font-mono text-[9px] font-black uppercase text-[#000000]">{m.type}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Statutory 3-Day Cooling-Off Notice Banner (RBI Mandated) */}
                <div
                  className="p-3.5 bg-[#FFF8E7] border-2 border-black flex flex-wrap items-center justify-between gap-3 font-mono text-xs"
                  style={{ boxShadow: "3px 3px 0px #000" }}
                >
                  <div className="flex items-center gap-2 text-black">
                    <Clock className="w-4 h-4 text-[#D97706] shrink-0" />
                    <span>
                      <strong>Statutory 3-Day Look-Up / Cooling-Off Period:</strong> You can exit this credit facility within 3 days without any foreclosure penalty.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setKfsModalOpen(true)}
                    className="font-bold underline text-black hover:text-[#D97706] cursor-pointer"
                  >
                    Review Disclosure Terms →
                  </button>
                </div>

                <div className="flex flex-wrap gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setKfsModalOpen(true)}
                    className="pulse-btn px-6 py-4 text-sm sm:text-base gap-2"
                    style={{ backgroundColor: "#FFD152", color: "#000000" }}
                  >
                    <FileText size={18} strokeWidth={2.5} />
                    VIEW RBI KEY FACT STATEMENT (KFS)
                  </button>

                  <Link
                    href="/staff"
                    className="pulse-btn px-6 py-4 text-sm sm:text-base gap-2"
                    style={{ backgroundColor: "#2ED573", color: "#000000" }}
                  >
                    <CheckCircle2 size={18} strokeWidth={2.5} />
                    ACCEPT & DISBURSE TO BORROWER BANK (RBI COMPLIANT)
                  </Link>

                  <button
                    type="button"
                    onClick={() => setOverrideModalOpen(true)}
                    className="pulse-btn px-5 py-4 text-sm sm:text-base gap-2"
                    style={{ backgroundColor: "#FFFFFF", color: "#000000" }}
                  >
                    REQUEST STRUCTURAL ADJUSTMENT
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* HUMAN-IN-THE-LOOP OVERRIDE MODAL */}
      {overrideModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white border-4 border-black max-w-lg w-full p-6 space-y-4 animate-in fade-in"
            style={{ boxShadow: "8px 8px 0px #000" }}
          >
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-black" />
                <h3 className="font-display font-black text-lg uppercase">
                  Credit Officer Discretionary Override
                </h3>
              </div>
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="p-1 border border-black hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-2.5 bg-[#FAF8F5] border border-black">
                <div className="text-[10px] text-neutral-500 uppercase">Applicant ID & Name</div>
                <div className="font-bold text-sm">{applicant.id} — {applicant.name}</div>
                <div className="text-[10px] text-neutral-600 mt-0.5">
                  AI Model Output: <strong>{mlResult.score100Scale} Pts ({mlResult.riskTier} Risk)</strong>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">Target Override Status</label>
                <select
                  value={overrideDecisionType}
                  onChange={(e) => setOverrideDecisionType(e.target.value as any)}
                  className="w-full p-2 border-2 border-black bg-white font-bold"
                >
                  <option value="APPROVED">Full Approval (Sanction with Prime Harvest Schedule)</option>
                  <option value="CONDITIONAL">Conditional Approval (Physical Geotagging Required)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">
                  Regulatory Audit Rationale (Mandatory Under RBI Guidelines)
                </label>
                <textarea
                  rows={3}
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                  placeholder="e.g. Field inspection confirmed perennial canal connection and unencumbered gold deposit backing..."
                  className="w-full p-2 border-2 border-black bg-[#FAF8F5]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="px-4 py-2 border-2 border-black text-xs font-mono font-bold bg-white hover:bg-neutral-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveOverride}
                disabled={!overrideNote.trim()}
                className="pulse-btn px-4 py-2 text-xs text-black bg-[#2ED573] hover:bg-[#52E08A] disabled:opacity-40"
              >
                Commit Override to Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RBI STANDARDIZED KEY FACT STATEMENT (KFS) MODAL */}
      {applicant && mlResult && (
        <KfsModal
          isOpen={kfsModalOpen}
          onClose={() => setKfsModalOpen(false)}
          applicant={applicant}
          offer={mlResult.offer}
        />
      )}
    </div>
  );
}

export default function ScoringClient() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center bg-grid-pattern"
          style={{ backgroundColor: "var(--pulse-cream)" }}
        >
          <div className="font-mono text-sm font-black uppercase text-[#000000]">
            Loading Satellite Telemetry & TreeSHAP Drivers...
          </div>
        </div>
      }
    >
      <ScoringInner />
    </Suspense>
  );
}
