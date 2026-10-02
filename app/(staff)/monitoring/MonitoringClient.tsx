"use client";
import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  Radio,
  MapPin,
  Sprout,
  FileSpreadsheet,
  IndianRupee,
  Bell,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import { earlyWarnings } from "../../lib/data";

export default function MonitoringClient() {
  const [notifiedId, setNotifiedId] = useState<string | null>(null);
  const [restructuredId, setRestructuredId] = useState<string | null>(null);

  const totalLoans = earlyWarnings.reduce((s, w) => s + w.activeLoansCount, 0);
  const totalExposure = earlyWarnings.reduce((s, w) => s + w.totalExposureLakhs, 0);
  const highAlerts = earlyWarnings.filter((w) => w.severity === "High").length;

  return (
    <div className="min-h-screen w-full bg-grid-pattern" style={{ backgroundColor: "var(--pulse-cream)" }}>
      {/* === TOP NAVBAR === */}
      <Navbar />

      {/* TICKER */}
      <div
        className="w-full overflow-hidden py-1.5 text-white font-black text-[11px] tracking-widest uppercase select-none"
        style={{ backgroundColor: "#000000", borderBottom: "3px solid #000000" }}
      >
        <div className="animate-ticker whitespace-nowrap flex items-center gap-6">
          <span>★ EARLY WARNING ANOMALY DETECTION ENGINE</span>
          <span>★ SENTINEL-2 SPECTRAL STRESS MONITOR</span>
          <span>★ PREDICTIVE MANDI PRICE DROP SHIELD</span>
          <span>★ PROACTIVE RESTRUCTURING PROTOCOLS</span>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 flex flex-col gap-8">
        {/* TITLE BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-3 border-[#000000] pb-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 bg-[#FF6B6B]"
              style={{ border: "3px solid #000000", boxShadow: "3px 3px 0px #000000" }}
            >
              <Radio size={26} strokeWidth={2.5} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-2xl sm:text-4xl uppercase tracking-tight text-[#000000]">
                Early-Warning Radar
              </h1>
              <p className="font-mono text-xs text-[#000000]/70 mt-0.5">
                Real-time satellite vegetative stress, precipitation deficit & mandi shock alerts
              </p>
            </div>
          </div>

          <span
            className="pulse-chip self-start sm:self-auto text-xs"
            style={{ backgroundColor: "#FF6B6B", color: "#FFFFFF" }}
          >
            {highAlerts} CRITICAL RISKS DETECTED
          </span>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "MONITORED DISTRICTS", value: earlyWarnings.length, bg: "#FFFFFF" },
            { label: "BORROWERS AT RISK", value: totalLoans.toLocaleString(), bg: "#B8A9FF" },
            { label: "TOTAL EXPOSURE", value: `₹${totalExposure}L`, bg: "#FFD152" },
            { label: "CRITICAL HIGH ALERTS", value: highAlerts, bg: "#FF6B6B", textWhite: true },
          ].map((s) => (
            <div
              key={s.label}
              className="pulse-card p-5 flex flex-col justify-between gap-2"
              style={{ backgroundColor: s.bg }}
            >
              <div
                className={`font-mono text-[10px] uppercase font-black ${
                  s.textWhite ? "text-white/80" : "text-[#000000]/70"
                }`}
              >
                {s.label}
              </div>
              <div
                className={`font-black text-3xl sm:text-4xl leading-none ${
                  s.textWhite ? "text-white" : "text-[#000000]"
                }`}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* WARNING CARDS LIST */}
        <div className="flex flex-col gap-6">
          <div className="font-mono text-xs font-black uppercase text-[#000000]/70">
            GEOSPATIAL RISK ANOMALY FEED ({earlyWarnings.length})
          </div>

          {earlyWarnings.length === 0 ? (
            <div className="pulse-card p-8 bg-white text-center font-mono text-xs text-neutral-600 border-3 border-black">
              <div className="font-bold text-sm text-black mb-1 uppercase">Portfolio Telemetry Normal</div>
              <div>No extreme precipitation anomalies or NDVI crop distress flagged across active portfolio districts.</div>
            </div>
          ) : (
            earlyWarnings.map((w) => {
              const isHigh = w.severity === "High";
              const isMedium = w.severity === "Medium";
            const sevBg = isHigh ? "#FF6B6B" : isMedium ? "#FFD152" : "#B8A9FF";

            return (
              <div
                key={w.id}
                className="pulse-card p-6 sm:p-8 flex flex-col gap-5"
                style={{ backgroundColor: "#FFFFFF" }}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  <div className="flex-1 flex flex-col gap-4">
                    {/* Severity Badge & Title */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className="pulse-pill text-[10px]"
                        style={{
                          backgroundColor: sevBg,
                          color: isHigh ? "#FFFFFF" : "#000000",
                        }}
                      >
                        {w.severity.toUpperCase()} SEVERITY
                      </span>
                      <h2 className="font-black text-xl sm:text-2xl uppercase tracking-tight text-[#000000]">
                        {w.warningType}
                      </h2>
                    </div>

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
                        <MapPin size={12} strokeWidth={3} /> {w.district}, {w.state}
                      </span>
                      <span className="pulse-chip text-xs bg-white">
                        <Sprout size={12} strokeWidth={3} /> {w.crop}
                      </span>
                      <span className="pulse-chip text-xs bg-white">
                        <FileSpreadsheet size={12} strokeWidth={3} /> {w.activeLoansCount} Loans
                      </span>
                      <span className="pulse-chip text-xs bg-white">
                        <IndianRupee size={12} strokeWidth={3} /> ₹{w.totalExposureLakhs}L
                      </span>
                    </div>

                    <p className="text-sm sm:text-base font-medium text-[#000000] leading-relaxed">
                      {w.impactDescription}
                    </p>

                    {/* Protocol Recommendation Box */}
                    <div
                      className="p-4"
                      style={{
                        backgroundColor: "#FFD152",
                        border: "2px solid #000000",
                        boxShadow: "3px 3px 0px #000000",
                      }}
                    >
                      <div className="font-mono text-[10px] font-black uppercase text-[#000000]/80 mb-1">
                        RECOMMENDED UNDERWRITING PROTOCOL
                      </div>
                      <div className="font-bold text-xs sm:text-sm text-[#000000]">
                        {w.recommendedAction}
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col gap-3 shrink-0 lg:w-56">
                    <button
                      onClick={() => setNotifiedId(w.id)}
                      className="pulse-btn px-4 py-3 text-xs gap-2"
                      style={{
                        backgroundColor: notifiedId === w.id ? "#2ED573" : "#FF6B6B",
                        color: notifiedId === w.id ? "#000000" : "#FFFFFF",
                      }}
                    >
                      <Bell size={14} strokeWidth={2.5} />
                      {notifiedId === w.id ? "SMS NOTIFIED" : "NOTIFY BORROWERS"}
                    </button>

                    <button
                      onClick={() => setRestructuredId(w.id)}
                      className="pulse-btn px-4 py-3 text-xs gap-2"
                      style={{
                        backgroundColor: restructuredId === w.id ? "#2ED573" : "#FFD152",
                        color: "#000000",
                      }}
                    >
                      <RefreshCw size={14} strokeWidth={2.5} />
                      {restructuredId === w.id ? "EMI REPAIRED" : "RESTRUCTURE EMI"}
                    </button>

                    <Link
                      href={`/staff?district=${encodeURIComponent(w.district)}`}
                      className="pulse-btn px-4 py-3 text-xs gap-2 text-center"
                      style={{ backgroundColor: "#FFFFFF", color: "#000000" }}
                    >
                      <UserCheck size={14} strokeWidth={2.5} />
                      ASSIGN FIELD OFFICER
                    </Link>
                  </div>
                </div>
              </div>
            );
          }))}
        </div>
      </main>
    </div>
  );
}
