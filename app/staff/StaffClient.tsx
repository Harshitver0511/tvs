"use client";
import Link from "next/link";
import { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
} from "recharts";
import {
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  IndianRupee,
  MapPin,
  Filter,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { applicants } from "../lib/data";

const filterOpts = ["ALL", "APPROVED", "CONDITIONAL", "REVIEW"];

export default function StaffClient() {
  const [filter, setFilter] = useState("ALL");

  const filtered =
    filter === "ALL"
      ? applicants
      : applicants.filter((a) => {
          if (filter === "APPROVED") return a.scoring.score >= 70;
          if (filter === "CONDITIONAL")
            return a.scoring.score >= 55 && a.scoring.score < 70;
          return a.scoring.score < 55;
        });

  const riskDist = [
    {
      name: "Very Low",
      value: applicants.filter((a) => a.scoring.score >= 80).length,
      color: "#2ED573",
    },
    {
      name: "Low",
      value: applicants.filter((a) => a.scoring.score >= 70 && a.scoring.score < 80).length,
      color: "#FFD152",
    },
    {
      name: "Medium",
      value: applicants.filter((a) => a.scoring.score >= 55 && a.scoring.score < 70).length,
      color: "#B8A9FF",
    },
    {
      name: "High",
      value: applicants.filter((a) => a.scoring.score < 55).length,
      color: "#FF6B6B",
    },
  ];

  const regionData = applicants.map((a) => ({
    name: a.district,
    score: a.scoring.score,
  }));

  const totalExposure = applicants.reduce((s, a) => s + a.requestedAmount, 0);
  const avgScore = Math.round(
    applicants.reduce((s, a) => s + a.scoring.score, 0) / applicants.length
  );

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
          <Link
            href="/staff"
            className="px-3.5 py-1.5"
            style={{
              backgroundColor: "#FFD152",
              border: "2px solid #000000",
              boxShadow: "3px 3px 0px #000000",
              color: "#000000",
            }}
          >
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
          <span className="pulse-pill" style={{ backgroundColor: "#B8A9FF", color: "#000000" }}>
            OFFICER DESK
          </span>
        </div>
      </header>

      {/* TICKER */}
      <div
        className="w-full overflow-hidden py-1.5 text-white font-black text-[11px] tracking-widest uppercase select-none"
        style={{ backgroundColor: "#000000", borderBottom: "3px solid #000000" }}
      >
        <div className="animate-ticker whitespace-nowrap flex items-center gap-6">
          <span>★ INTERNAL CREDIT COMMITTEE CONSOLE</span>
          <span>★ BATCH SANCTIONS ACTIVE</span>
          <span>★ ZERO-TOUCH DISBURSAL COMPLIANT</span>
          <span>★ AUDIT TRAIL SECURED</span>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 flex flex-col gap-8">
        {/* TITLE BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-3 border-[#000000] pb-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 bg-[#FFD152]"
              style={{ border: "3px solid #000000", boxShadow: "3px 3px 0px #000000" }}
            >
              <ShieldCheck size={26} strokeWidth={2.5} className="text-[#000000]" />
            </div>
            <div>
              <h1 className="font-black text-2xl sm:text-4xl uppercase tracking-tight text-[#000000]">
                Underwriting Desk
              </h1>
              <p className="font-mono text-xs text-[#000000]/70 mt-0.5">
                Batch evaluation, regional exposure concentration & instant disbursal approval
              </p>
            </div>
          </div>

          <span
            className="pulse-chip self-start sm:self-auto text-xs"
            style={{ backgroundColor: "#000000", color: "#FFFFFF" }}
          >
            ACTIVE QUEUE: {applicants.length} DOSSIERS
          </span>
        </div>

        {/* METRICS ROW (Pulse Candy Style) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "APPLICATIONS", value: applicants.length, bg: "#FF6B6B" },
            {
              label: "APPROVED (AI)",
              value: applicants.filter((a) => a.scoring.score >= 70).length,
              bg: "#FFD152",
            },
            { label: "AVERAGE SCORE", value: avgScore, bg: "#B8A9FF" },
            {
              label: "EXPOSURE QUEUE",
              value: `₹${(totalExposure / 100000).toFixed(1)}L`,
              bg: "#FFFFFF",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="pulse-card p-5 flex flex-col justify-between gap-2 text-[#000000]"
              style={{ backgroundColor: s.bg }}
            >
              <div className="font-mono text-[10px] uppercase font-black text-[#000000]/70">
                {s.label}
              </div>
              <div className="font-black text-3xl sm:text-4xl leading-none">{s.value}</div>
            </div>
          ))}
        </div>

        {/* CHARTS ROW */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* RISK STRATIFICATION PIE */}
          <div className="pulse-card p-6 flex flex-col gap-4" style={{ backgroundColor: "#FFFFFF" }}>
            <div className="flex items-center justify-between border-b-2 border-[#000000] pb-3">
              <h3 className="font-black text-lg uppercase tracking-tight">
                Portfolio Risk Stratification
              </h3>
              <span className="font-mono text-xs text-[#000000]/60">AI Tiers</span>
            </div>

            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={3}
                    stroke="#000000"
                    strokeWidth={2}
                  >
                    {riskDist.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <RTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div
              className="flex flex-wrap gap-2 p-2.5 justify-center"
              style={{
                backgroundColor: "var(--pulse-cream)",
                border: "2px solid #000000",
                boxShadow: "2px 2px 0px #000000",
              }}
            >
              {riskDist.map((d) => (
                <span
                  key={d.name}
                  className="px-2.5 py-1 font-mono text-xs font-black flex items-center gap-1.5"
                >
                  <span
                    className="w-3 h-3 border border-[#000000]"
                    style={{ backgroundColor: d.color }}
                  />
                  {d.name}: {d.value}
                </span>
              ))}
            </div>
          </div>

          {/* DISTRICT SCORE BENCHMARK */}
          <div className="pulse-card p-6 flex flex-col gap-4" style={{ backgroundColor: "#FFFFFF" }}>
            <div className="flex items-center justify-between border-b-2 border-[#000000] pb-3">
              <h3 className="font-black text-lg uppercase tracking-tight">
                Score By District
              </h3>
              <span className="font-mono text-xs text-[#000000]/60">Agro-Climatic</span>
            </div>

            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionData}>
                  <CartesianGrid strokeDasharray="0" stroke="#000000" strokeOpacity={0.15} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fontWeight: 700, fontFamily: "monospace" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fontWeight: 700, fontFamily: "monospace" }}
                  />
                  <RTooltip />
                  <Bar dataKey="score" stroke="#000000" strokeWidth={2}>
                    {regionData.map((d, i) => (
                      <Cell
                        key={i}
                        fill={
                          d.score >= 75
                            ? "#FFD152"
                            : d.score >= 60
                            ? "#B8A9FF"
                            : "#FF6B6B"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div
              className="p-2.5 font-mono text-xs font-black text-center"
              style={{
                backgroundColor: "var(--pulse-cream)",
                border: "2px solid #000000",
                boxShadow: "2px 2px 0px #000000",
              }}
            >
              ALL DISTRICT EXPOSURE WITHIN MANDATED PRUDENTIAL LIMITS
            </div>
          </div>
        </div>

        {/* REGIONAL HEATMAP */}
        <div className="pulse-card flex flex-col overflow-hidden" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="p-5 border-b-3 border-[#000000] flex items-center justify-between">
            <div>
              <h3 className="font-black text-lg uppercase tracking-tight">
                Geographic Risk Concentration Map
              </h3>
              <p className="font-mono text-xs text-[#000000]/70">
                Circle radius = exposure volume; color = AI risk tier
              </p>
            </div>
            <span
              className="pulse-chip text-xs"
              style={{ backgroundColor: "#FFD152", color: "#000000" }}
            >
              BHARAT PORTFOLIO
            </span>
          </div>

          <div className="h-[300px] p-2">
            <MapContainer
              center={[22.5, 78.0]}
              zoom={5}
              scrollWheelZoom={false}
              className="h-full w-full"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap"
              />
              {applicants.map((a) => (
                <CircleMarker
                  key={a.id}
                  center={[a.lat, a.lng]}
                  radius={Math.max(10, a.requestedAmount / 40000)}
                  pathOptions={{
                    color: "#000000",
                    weight: 3,
                    fillColor: a.scoring.score >= 70 ? "#FFD152" : "#FF6B6B",
                    fillOpacity: 0.85,
                  }}
                >
                  <Tooltip>
                    <div className="font-mono text-xs text-[#000000]">
                      <strong>{a.name}</strong> ({a.district})<br />
                      Score: {a.scoring.score} // Req: ₹{a.requestedAmount}
                    </div>
                  </Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* APPLICANT QUEUE TABLE */}
        <div className="pulse-card p-6 sm:p-8 flex flex-col gap-6" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-3 border-[#000000] pb-4">
            <div>
              <h2 className="font-black text-2xl uppercase tracking-tight text-[#000000]">
                Applications Awaiting Underwriting
              </h2>
              <p className="font-mono text-xs text-[#000000]/70 mt-0.5">
                Inspect satellite reports or issue one-click sanctions
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {filterOpts.map((o) => (
                <button
                  key={o}
                  onClick={() => setFilter(o)}
                  className="pulse-chip text-xs"
                  style={{
                    backgroundColor: filter === o ? "#000000" : "#FFFFFF",
                    color: filter === o ? "#FFFFFF" : "#000000",
                  }}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ border: "3px solid #000000" }}>
              <thead>
                <tr style={{ backgroundColor: "#000000", color: "#FFFFFF" }}>
                  {["ID", "APPLICANT", "DISTRICT", "PRODUCT", "AMOUNT", "SCORE", "RISK", "ACTION"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 font-mono text-xs uppercase font-black border-r border-white/20 last:border-r-0"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, idx) => (
                  <tr
                    key={a.id}
                    className="border-b border-black hover:bg-[#FAF8F5] transition-colors"
                    style={{ backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "var(--pulse-cream)" }}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-black border-r border-black">
                      {a.id}
                    </td>
                    <td className="px-4 py-3 font-black text-sm border-r border-black">
                      {a.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs border-r border-black">
                      {a.district}, {a.state}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs border-r border-black">
                      {a.loanProduct}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-black border-r border-black">
                      ₹{a.requestedAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-black border-r border-black">
                      {a.scoring.score}
                    </td>
                    <td className="px-4 py-3 border-r border-black">
                      <span
                        className="px-2 py-0.5 font-mono text-[10px] font-black uppercase"
                        style={{
                          backgroundColor:
                            a.scoring.score >= 70
                              ? "#FFD152"
                              : a.scoring.score >= 55
                              ? "#B8A9FF"
                              : "#FF6B6B",
                          color: "#000000",
                          border: "1.5px solid #000000",
                        }}
                      >
                        {a.scoring.riskTier}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/scoring?id=${a.id}`}
                        className="pulse-btn px-3 py-1 text-xs gap-1"
                        style={{ backgroundColor: "#FFD152", color: "#000000" }}
                      >
                        REVIEW <ExternalLink size={12} strokeWidth={2.5} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
