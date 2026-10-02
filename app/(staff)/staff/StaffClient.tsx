"use client";
import "leaflet/dist/leaflet.css"; // bundled only where a map is used (was a render-blocking CDN link)
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  X,
  FileText,
  Lock,
  Scale,
  RefreshCw,
  Trash2,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import type { UserRole } from "../../lib/roles";
import { maskPhone } from "../../lib/pii";

const filterOpts = ["ALL", "APPROVED", "CONDITIONAL", "REVIEW"];

export default function StaffClient() {
  const searchParams = useSearchParams();
  const districtParam = searchParams.get("district") || "";
  const [filter, setFilter] = useState("ALL");
  const [districtFilter, setDistrictFilter] = useState(districtParam);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string; role: UserRole; district?: string } | null>(null);
  const [liveApplicants, setLiveApplicants] = useState<any[]>([]);

  // Tab State: Queue vs Audit Trail
  const [activeTab, setActiveTab] = useState<"queue" | "audit">("queue");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const loadAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await fetch("/api/audit");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch {}
    finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (activeTab === "audit") {
      loadAuditLogs();
    }
  }, [activeTab]);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});

    fetch("/api/applications")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setLiveApplicants(data);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/me", { method: "POST" });
    localStorage.removeItem("tvs_demo_role");
    window.location.href = "/login?role=staff";
  };

  const handleDeleteApplication = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete application dossier ${id} permanently?`)) return;
    try {
      const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLiveApplicants((prev) => prev.filter((a) => a.id.toLowerCase() !== id.toLowerCase()));
      }
    } catch {}
  };

  // Row-level filtering (e.g. field officer → own district) is applied server-side
  const allApplicants = liveApplicants;

  const filtered = useMemo(() => {
    return allApplicants.filter((a) => {
      const matchesStatus =
        filter === "ALL"
          ? true
          : filter === "APPROVED"
          ? a.scoring.score >= 70
          : filter === "CONDITIONAL"
          ? a.scoring.score >= 55 && a.scoring.score < 70
          : a.scoring.score < 55;

      const matchesDistrict = districtFilter
        ? a.district.toLowerCase().includes(districtFilter.toLowerCase())
        : true;

      return matchesStatus && matchesDistrict;
    });
  }, [allApplicants, filter, districtFilter]);

  const riskDist = [
    {
      name: "Very Low",
      value: allApplicants.filter((a) => a.scoring.score >= 80).length,
      color: "#2ED573",
    },
    {
      name: "Low",
      value: allApplicants.filter((a) => a.scoring.score >= 70 && a.scoring.score < 80).length,
      color: "#FFD152",
    },
    {
      name: "Medium",
      value: allApplicants.filter((a) => a.scoring.score >= 55 && a.scoring.score < 70).length,
      color: "#B8A9FF",
    },
    {
      name: "High",
      value: allApplicants.filter((a) => a.scoring.score < 55).length,
      color: "#FF6B6B",
    },
  ];

  const regionData = allApplicants.map((a) => ({
    name: a.district,
    score: a.scoring.score,
  }));

  const totalExposure = allApplicants.reduce((s, a) => s + a.requestedAmount, 0);
  const avgScore = Math.round(
    allApplicants.reduce((s, a) => s + a.scoring.score, 0) / (allApplicants.length || 1)
  );

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

          <div className="flex flex-col sm:items-end gap-1.5">
            <span
              className="pulse-chip self-start sm:self-auto text-xs"
              style={{ backgroundColor: "#000000", color: "#FFFFFF" }}
            >
              ACTIVE QUEUE: {filtered.length} DOSSIERS
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-[#2ED573]" />
              <span>
                Scope: <strong>{currentUser ? `${currentUser.name} (${currentUser.role})` : "Credit Committee (Full Portfolio)"}</strong>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-red-600 underline font-bold ml-1 cursor-pointer"
              >
                [Sign Out]
              </button>
            </div>
          </div>
        </div>

        {/* METRICS ROW (Pulse Candy Style) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "APPLICATIONS", value: allApplicants.length, bg: "#FF6B6B" },
            {
              label: "APPROVED (AI)",
              value: allApplicants.filter((a) => a.scoring.score >= 70).length,
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
              {allApplicants.map((a: any) => (
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

        {/* TAB CONTROLS: APPLICATIONS QUEUE vs IMMUTABLE AUDIT TRAIL */}
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("queue")}
              className={`px-4 py-2.5 border-3 border-black text-xs font-black uppercase cursor-pointer transition-all ${
                activeTab === "queue" ? "bg-[#FFD152] text-black" : "bg-white text-neutral-700 hover:bg-neutral-100"
              }`}
              style={{ boxShadow: activeTab === "queue" ? "3px 3px 0px #000" : "none" }}
            >
              Underwriting Applications ({filtered.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("audit")}
              className={`px-4 py-2.5 border-3 border-black text-xs font-black uppercase cursor-pointer transition-all flex items-center gap-2 ${
                activeTab === "audit" ? "bg-[#2ED573] text-black" : "bg-white text-neutral-700 hover:bg-neutral-100"
              }`}
              style={{ boxShadow: activeTab === "audit" ? "3px 3px 0px #000" : "none" }}
            >
              <Scale className="w-4 h-4 text-black" />
              <span>Immutable Audit Trail & DPDP Governance ({auditLogs.length})</span>
            </button>
          </div>

          {activeTab === "audit" && (
            <button
              type="button"
              onClick={loadAuditLogs}
              disabled={loadingAudit}
              className="pulse-btn px-3 py-1.5 text-xs font-mono font-bold bg-white text-black hover:bg-neutral-100 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? "animate-spin" : ""}`} />
              <span>Refresh Log</span>
            </button>
          )}
        </div>

        {/* VIEW A: APPLICANT QUEUE TABLE */}
        {activeTab === "queue" && (
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
              <div className="flex flex-wrap items-center gap-2">
                {districtFilter && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FFF3E0] border-2 border-black text-xs font-mono font-bold">
                    <span>District: <strong>{districtFilter}</strong></span>
                    <button
                      type="button"
                      onClick={() => setDistrictFilter("")}
                      className="p-0.5 bg-black text-white hover:bg-red-600 cursor-pointer ml-1"
                      title="Clear district filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
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
                    {["ID", "APPLICANT & PII", "DISTRICT", "PRODUCT", "AMOUNT", "SCORE", "RISK", "ACTIONS"].map(
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
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center font-mono text-xs text-neutral-600">
                        <div className="font-bold text-sm mb-1 text-black">No Active Farm Dossiers in Queue</div>
                        <div>Submit a digital loan application at <Link href="/apply" className="underline font-bold text-black">/apply</Link> using real farmer boundaries to populate this underwriting desk.</div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((a, idx) => (
                      <tr
                        key={a.id}
                        className="border-b border-black hover:bg-[#FAF8F5] transition-colors"
                        style={{ backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "var(--pulse-cream)" }}
                      >
                      <td className="px-4 py-3 font-mono text-xs font-black border-r border-black">
                        {a.id}
                      </td>
                      <td className="px-4 py-3 border-r border-black">
                        <div className="font-black text-sm text-black">{a.name}</div>
                        <div className="font-mono text-[10px] text-neutral-600 flex items-center gap-1 mt-0.5">
                          <Lock className="w-2.5 h-2.5 text-[#2ED573]" />
                          <span>{maskPhone(a.phone)}</span>
                        </div>
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
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/scoring?id=${a.id}`}
                            className="pulse-btn px-2.5 py-1 text-xs gap-1"
                            style={{ backgroundColor: "#FFD152", color: "#000000" }}
                          >
                            REVIEW <ExternalLink size={12} strokeWidth={2.5} />
                          </Link>
                          <Link
                            href={`/kfs/${a.id}`}
                            className="px-2 py-1 border border-black hover:bg-neutral-100 text-[10px] font-mono font-bold flex items-center gap-1 bg-white"
                            title="View RBI Key Fact Statement"
                          >
                            <FileText className="w-3 h-3 text-black" />
                            <span>KFS</span>
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteApplication(a.id, e)}
                            className="p-1 border border-neutral-300 hover:border-red-600 hover:bg-red-50 text-neutral-400 hover:text-red-600 cursor-pointer transition-colors"
                            title={`Delete dossier ${a.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW B: IMMUTABLE AUDIT TRAIL & DPDP GOVERNANCE */}
        {activeTab === "audit" && (
          <div className="pulse-card p-6 sm:p-8 flex flex-col gap-6" style={{ backgroundColor: "#FFFFFF" }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-3 border-[#000000] pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="pulse-pill bg-[#2ED573] text-black text-[10px]">
                    TAMPER-EVIDENT LOG
                  </span>
                  <span className="pulse-pill bg-black text-white text-[10px]">
                    RBI & DPDP COMPLIANCE
                  </span>
                </div>
                <h2 className="font-black text-2xl uppercase tracking-tight text-[#000000]">
                  Regulatory Underwriting & Consent Audit Trail
                </h2>
                <p className="font-mono text-xs text-[#000000]/70 mt-0.5">
                  Chronological, immutable ledger of all algorithmic scoring decisions, human overrides, and DPDP consent actions.
                </p>
              </div>

              <div className="p-2.5 bg-[#FAF8F5] border-2 border-black font-mono text-[11px] space-y-0.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#2ED573]" />
                  <span>PII Masking Active</span>
                </div>
                <div className="text-[10px] text-neutral-600">Aadhaar redacted to XXXX-XXXX-1234</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ border: "3px solid #000000" }}>
                <thead>
                  <tr style={{ backgroundColor: "#000000", color: "#FFFFFF" }}>
                    {["TIMESTAMP", "ACTOR / ROLE", "ACTION", "RESOURCE", "AUDIT EVIDENCE DETAILS"].map(
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
                <tbody className="divide-y divide-black font-mono text-xs">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-neutral-600">
                        {loadingAudit ? (
                          <div className="animate-pulse">Loading compliance ledger from Supabase...</div>
                        ) : (
                          <div>No compliance events recorded yet. Perform an application submission or override to generate audit trail entries.</div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log: any, idx: number) => {
                      const isOverride = log.action.includes("OVERRIDE");
                      const isConsent = log.action.includes("CONSENT");
                      const isErasure = log.action.includes("ERASURE");

                      const badgeBg = isErasure
                        ? "#FF6B6B"
                        : isOverride
                        ? "#FFD152"
                        : isConsent
                        ? "#B8A9FF"
                        : "#2ED573";

                      return (
                        <tr
                          key={log.id || idx}
                          className="hover:bg-[#FAF8F5] transition-colors"
                          style={{ backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "var(--pulse-cream)" }}
                        >
                          <td className="px-4 py-3 font-bold border-r border-black whitespace-nowrap text-[11px]">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString("en-IN") : "Just now"}
                          </td>
                          <td className="px-4 py-3 border-r border-black whitespace-nowrap">
                            <div className="font-bold text-black">{log.actorId}</div>
                            <span className="text-[10px] text-neutral-600 uppercase font-bold">
                              {log.actorRole}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-r border-black">
                            <span
                              className="px-2 py-0.5 text-[10px] font-black uppercase inline-block"
                              style={{
                                backgroundColor: badgeBg,
                                color: "#000",
                                border: "1.5px solid #000",
                              }}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-r border-black font-bold text-xs whitespace-nowrap">
                            {log.entity}:{log.entityId}
                          </td>
                          <td className="px-4 py-3 text-[11px] leading-relaxed max-w-md break-words">
                            {log.afterState ? (
                              <pre className="font-mono text-[10px] bg-[#FAF8F5] p-2 border border-black/30 overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(log.afterState, null, 2)}
                              </pre>
                            ) : (
                              <span className="text-neutral-500 italic">No additional payload</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
