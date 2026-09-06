"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
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
} from "lucide-react";
import { applicants } from "../lib/data";

function ScoringInner() {
  const params = useSearchParams();
  const id = params.get("id") || "APP-1042";
  const applicant = useMemo(
    () => applicants.find((a) => a.id === id) || applicants[0],
    [id]
  );
  const s = applicant.scoring;
  const [showOffer, setShowOffer] = useState(false);

  const ndviData = applicant.satelliteVegetationIndex.map((v, i) => ({
    month: ["Apr", "May", "Jun", "Jul", "Aug", "Sep"][i],
    ndvi: v,
  }));

  const factorData = s.factors.map((f) => ({
    name: f.name.length > 20 ? f.name.slice(0, 18) + "…" : f.name,
    value: f.contribution,
    color: f.contribution >= 0 ? "#FFD152" : "#FF6B6B",
  }));

  const center: [number, number] = [applicant.lat, applicant.lng];

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
          <Link
            href="/scoring"
            className="px-3.5 py-1.5"
            style={{
              backgroundColor: "#FFD152",
              border: "2px solid #000000",
              boxShadow: "3px 3px 0px #000000",
              color: "#000000",
            }}
          >
            AI SCORE
          </Link>
          <Link href="/staff" className="px-3 py-1.5 text-black hover:text-[#FF6B6B] transition-colors">
            STAFF DESK
          </Link>
          <Link href="/monitoring" className="px-3 py-1.5 text-black hover:text-[#FF6B6B] transition-colors">
            RISK RADAR
          </Link>
          <Link href="/assistant" className="px-3 py-1.5 text-black hover:text-[#FF6B6B] transition-colors">
            SAHAYAK
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <span className="pulse-pill" style={{ backgroundColor: "#FFD152", color: "#000000" }}>
            SCORE: {s.score}/100
          </span>
        </div>
      </header>

      {/* TICKER */}
      <div
        className="w-full overflow-hidden py-1.5 text-white font-black text-[11px] tracking-widest uppercase select-none"
        style={{ backgroundColor: "#000000", borderBottom: "3px solid #000000" }}
      >
        <div className="animate-ticker whitespace-nowrap flex items-center gap-6">
          <span>★ MULTISPECTRAL NDVI CANOPY VIGOR</span>
          <span>★ SHAP EXPLAINABILITY COEFFICIENTS</span>
          <span>★ HYPER-LOCAL AGROMET TELEMETRY</span>
          <span>★ HARVEST-ALIGNED EMI ENGINE</span>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 flex flex-col gap-8">
        {/* DOSSIER SELECTOR CHIPS */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs font-black uppercase text-[#000000]/70">
            Select Active Farmer Dossier:
          </span>
          <div
            className="flex flex-wrap gap-2.5 p-3.5 bg-white"
            style={{ border: "3px solid #000000", boxShadow: "4px 4px 0px #000000" }}
          >
            {applicants.map((a, idx) => {
              const colors = ["#FF6B6B", "#FFD152", "#B8A9FF", "#FFFFFF"];
              const isSelected = a.id === id;
              return (
                <Link
                  key={a.id}
                  href={`/scoring?id=${a.id}`}
                  className="pulse-chip text-xs no-underline text-black"
                  style={{
                    backgroundColor: isSelected ? "#000000" : colors[idx % colors.length],
                    color: isSelected ? "#FFFFFF" : "#000000",
                  }}
                >
                  {a.name} [{a.district}]
                </Link>
              );
            })}
          </div>
        </div>

        {/* APPLICANT HERO OVERVIEW CARD */}
        <div
          className="pulse-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="pulse-pill text-[10px]" style={{ backgroundColor: "#FF6B6B", color: "#000000" }}>
                DOSSIER {applicant.id}
              </span>
              <span className="font-mono text-xs font-bold text-[#000000]/70">
                {applicant.village}, {applicant.district}, {applicant.state}
              </span>
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
                {applicant.landSizeAcres} Acres
              </span>
            </div>
          </div>

          {/* AI SCORE BOX */}
          <div
            className="w-36 h-36 flex flex-col items-center justify-center shrink-0"
            style={{
              backgroundColor: s.score >= 70 ? "#FFD152" : "#FF6B6B",
              color: "#000000",
              border: "4px solid #000000",
              boxShadow: "6px 6px 0px #000000",
            }}
          >
            <div className="font-black text-5xl leading-none">{s.score}</div>
            <div className="font-mono text-[11px] font-black uppercase mt-1">
              {s.riskTier} RISK
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
                NDVI: {applicant.ndviScore.toFixed(2)}
              </span>
            </div>

            <div className="h-[360px] p-2">
              <MapContainer
                center={center}
                zoom={15}
                scrollWheelZoom={false}
                className="h-full w-full"
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Polygon
                  positions={applicant.plotPolygon as [number, number][]}
                  pathOptions={{
                    color: "#000000",
                    weight: 3,
                    fillColor: "#FFD152",
                    fillOpacity: 0.7,
                  }}
                >
                  <Tooltip permanent direction="center">
                    <span className="font-black text-xs text-[#000000]">
                      NDVI {applicant.ndviScore.toFixed(2)}
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
                <span className="w-3.5 h-3.5 border-2 border-black bg-[#FF6B6B]" /> Barren (&lt;0.2)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-black bg-[#B8A9FF]" /> Sparse (0.2-0.4)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-black bg-[#FFD152]" /> Optimal (&gt;0.4)
              </span>
            </div>
          </div>

          {/* SHAP DRIVERS */}
          <div className="lg:col-span-2 pulse-card p-5 flex flex-col gap-4" style={{ backgroundColor: "#FFFFFF" }}>
            <div className="border-b-3 border-[#000000] pb-3">
              <h3 className="font-black text-lg uppercase tracking-tight">
                SHAP Decision Drivers
              </h3>
              <p className="font-mono text-xs text-[#000000]/60 mt-0.5">
                Factor contributions to credit scoring
              </p>
            </div>

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

            <div className="flex flex-col gap-2">
              {s.factors.map((f, i) => {
                const isPos = f.contribution >= 0;
                return (
                  <div
                    key={i}
                    className="p-2.5 flex items-center justify-between"
                    style={{
                      border: "2px solid #000000",
                      boxShadow: "2px 2px 0px #000000",
                      backgroundColor: isPos ? "#FFD152" : "#FF6B6B",
                    }}
                  >
                    <div>
                      <div className="font-mono text-xs font-black text-[#000000]">
                        {f.name}
                      </div>
                      <div className="font-mono text-[10px] text-[#000000]/80">
                        {f.detail}
                      </div>
                    </div>
                    <span
                      className="px-2 py-0.5 font-mono text-xs font-black text-white bg-black"
                      style={{ border: "1px solid #000000" }}
                    >
                      {isPos ? "+" : ""}
                      {(f.contribution * 100).toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* WEATHER & 6-MONTH NDVI ROW */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* WEATHER TELEMETRY */}
          <div className="pulse-card p-6 flex flex-col gap-4" style={{ backgroundColor: "#FFFFFF" }}>
            <div className="flex items-center gap-2 border-b-3 border-[#000000] pb-3">
              <CloudRain size={22} strokeWidth={2.5} />
              <h3 className="font-black text-lg uppercase tracking-tight">
                Weather & Precipitation Telemetry
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "LAST 90-DAY RAIN", val: `${applicant.last90DaysRainfallMm} MM`, bg: "#FFD152" },
                { label: "DISTRICT AVERAGE", val: `${applicant.districtAvgRainfallMm} MM`, bg: "#B8A9FF" },
                {
                  label: "RAINFALL ANOMALY",
                  val: `${applicant.rainfallAnomalyPct > 0 ? "+" : ""}${applicant.rainfallAnomalyPct}%`,
                  bg: applicant.rainfallAnomalyPct < -20 ? "#FF6B6B" : "#FFD152",
                },
                { label: "IRRIGATION SOURCE", val: applicant.irrigation.split("(")[0].trim().toUpperCase(), bg: "#FFFFFF" },
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
                  <div className="font-mono text-[10px] font-bold text-[#000000]/80">
                    {w.label}
                  </div>
                  <div className="font-black text-lg mt-1 text-[#000000]">{w.val}</div>
                </div>
              ))}
            </div>

            <div
              className="p-3 font-mono text-xs font-black text-center"
              style={{
                border: "2px solid #000000",
                backgroundColor: applicant.rainfallAnomalyPct < -20 ? "#FF6B6B" : "#FFD152",
                color: applicant.rainfallAnomalyPct < -20 ? "#FFFFFF" : "#000000",
              }}
            >
              {applicant.rainfallAnomalyPct < -20
                ? `DROUGHT ALERT: ${Math.abs(applicant.rainfallAnomalyPct)}% DEFICIT VS 10-YR MEAN`
                : `STABLE RAINFALL CONDITIONS MONSOON NORMAL`}
            </div>
          </div>

          {/* 6-MONTH TEMPORAL NDVI */}
          <div className="pulse-card p-6 flex flex-col gap-4" style={{ backgroundColor: "#FFFFFF" }}>
            <div className="flex items-center gap-2 border-b-3 border-[#000000] pb-3">
              <Calendar size={22} strokeWidth={2.5} />
              <h3 className="font-black text-lg uppercase tracking-tight">
                6-Month Temporal NDVI Trajectory
              </h3>
            </div>

            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ndviData}>
                  <CartesianGrid strokeDasharray="0" stroke="#000000" strokeOpacity={0.15} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}
                  />
                  <YAxis
                    domain={[0, 1]}
                    tick={{ fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}
                  />
                  <RTooltip />
                  <Area
                    type="monotone"
                    dataKey="ndvi"
                    stroke="#000000"
                    strokeWidth={3}
                    fill="#FFD152"
                    fillOpacity={0.85}
                    dot={{ fill: "#000000", r: 4, stroke: "#000000" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div
              className="flex justify-between p-3 font-mono text-xs font-bold"
              style={{
                backgroundColor: "var(--pulse-cream)",
                border: "2px solid #000000",
                boxShadow: "2px 2px 0px #000000",
              }}
            >
              <span>CURRENT: {applicant.ndviScore.toFixed(2)}</span>
              <span>PEAK: {Math.max(...applicant.satelliteVegetationIndex).toFixed(2)}</span>
              <span>SOIL: {applicant.soilType.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* DECISION & SANCTION SECTION */}
        <div className="pulse-card p-6 sm:p-8 flex flex-col gap-6" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-3 border-[#000000] pb-4">
            <div>
              <div className="font-mono text-xs font-bold text-[#000000]/70">
                AUTOMATED UNDERWRITING RESOLUTION
              </div>
              <h2 className="font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#000000]">
                Decision: {s.recommendation}
              </h2>
            </div>
            <span
              className="pulse-pill self-start sm:self-auto text-xs"
              style={{
                backgroundColor: s.score >= 70 ? "#FFD152" : "#FF6B6B",
                color: "#000000",
              }}
            >
              {s.score >= 70 ? "SANCTION APPROVED" : "MANUAL RISK REVIEW"}
            </span>
          </div>

          {!showOffer ? (
            <button
              onClick={() => setShowOffer(true)}
              className="pulse-btn px-6 py-4 text-base gap-2 self-start"
              style={{ backgroundColor: "#FFD152", color: "#000000" }}
            >
              <Sprout size={20} strokeWidth={2.5} />
              GENERATE SANCTION LETTER & HARVEST EMI SCHEDULE →
            </button>
          ) : (
            <div className="flex flex-col gap-6">
              {/* YELLOW DOT-MATRIX SANCTION LETTER BANNER */}
              <div
                className="p-6 sm:p-8 flex flex-col gap-4 text-black"
                style={{
                  backgroundColor: "#FFD152",
                  backgroundImage: "radial-gradient(#000000 1.5px, transparent 1.5px)",
                  backgroundSize: "16px 16px",
                  border: "4px solid #000000",
                  boxShadow: "6px 6px 0px #000000",
                }}
              >
                <div className="inline-block px-3 py-1 font-mono text-xs font-black text-white bg-black">
                  OFFICIALLY APPROVED LOAN SANCTION
                </div>
                <div
                  className="font-black text-4xl sm:text-6xl text-white inline-block px-4 py-2 bg-black -rotate-1 self-start"
                  style={{ border: "3px solid #000000" }}
                >
                  ₹{s.offer.approvedAmount.toLocaleString("en-IN")}
                </div>

                <div
                  className="flex flex-wrap gap-3 p-3 mt-2 bg-white"
                  style={{ border: "3px solid #000000", boxShadow: "3px 3px 0px #000000" }}
                >
                  <span className="font-mono text-xs font-black">
                    TENURE: {s.offer.tenureMonths} MONTHS
                  </span>
                  <span>·</span>
                  <span className="font-mono text-xs font-black">
                    RATE: {s.offer.interestRatePct}% P.A.
                  </span>
                  <span>·</span>
                  <span className="font-mono text-xs font-black">
                    FLAT BENCHMARK: ₹{s.offer.flatEmi.toLocaleString("en-IN")}/MO
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
                    Zero financial burden during sowing; bullet repayment post-mandi sale
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {s.offer.harvestEmiSchedule.map((m, i) => {
                    const isHarvest =
                      m.type.includes("Harvest") ||
                      m.type.includes("Bumper") ||
                      m.type.includes("Post") ||
                      m.type.includes("Rabi");

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
                        <div className="font-mono text-[9px] font-black uppercase text-[#000000]">
                          {m.type}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-4 pt-4">
                  <Link
                    href="/staff"
                    className="pulse-btn px-6 py-4 text-sm sm:text-base gap-2"
                    style={{ backgroundColor: "#FFD152", color: "#000000" }}
                  >
                    <CheckCircle2 size={18} strokeWidth={2.5} />
                    ACCEPT & DISBURSE VIA TVS WALLET
                  </Link>

                  <button
                    type="button"
                    className="pulse-btn px-6 py-4 text-sm sm:text-base gap-2"
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
            Loading Satellite Telemetry...
          </div>
        </div>
      }
    >
      <ScoringInner />
    </Suspense>
  );
}
